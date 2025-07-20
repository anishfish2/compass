import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
interface PageInfo {
  url: string;
  domain: string;
  title: string;
  keyFacts: string[];
  navigationPaths: string[];
  uniqueContent: string[];
}

interface ScavengerStep {
  riddle: string;
  targetUrl: string;
  answer: string;
  hints: string[];
  pathFromHome: string;
}

interface ResearchSite {
  domain: string;
  specificPage: string;
  pathFromHome: string;
  interestingFact: string;
  whyRelevant: string;
}

// ──────────────────────────────────────────
// Utils
// ──────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Ask ChatGPT for JSON, retrying until it actually returns JSON */
async function askOpenAIForJson(
  userPrompt: string,
  maxTokens = 1500,
  maxTries = 3
) {
  let prompt = userPrompt;

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // fast + GPT‑4‑class quality
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = res.choices[0].message.content?.trim() || '';
    try {
      return JSON.parse(raw);
    } catch {
      console.warn(
        `[hunt] OpenAI reply not JSON (try ${attempt}/${maxTries})`
      );
      prompt = `REMINDER: Return ONLY valid JSON. No prose.\n\n` + userPrompt;
    }
  }

  throw new Error(
    'OpenAI failed to return valid JSON after several attempts.'
  );
}

/** HEAD‑request reachability test (follows redirects) */
async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return res.ok && res.status < 400;
  } catch {
    return false;
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// ──────────────────────────────────────────
// Handler
// ──────────────────────────────────────────
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const schema = z.object({ prompt: z.string().min(3) });
  const { prompt } = schema.parse(req.body);

  const steps: ScavengerStep[] = [];

  try {
    console.log('[hunt] Theme:', prompt);

    // ─── Stagehand / Browserbase set‑up ────────────────────────────
    const stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      modelName: 'gpt-4o-mini',
      modelClientOptions: { apiKey: process.env.OPENAI_API_KEY }
    });
    await stagehand.init();
    const page = stagehand.page;

    // ─── 1. Ask OpenAI for candidate pages ─────────────────────────
    const research = (await askOpenAIForJson(
      `
      Research websites for a scavenger hunt about "${prompt}".
      Find 5 interesting websites with specific pages (not just homepages) that would create an educational journey.
      Each site should have pages that are 1‑2 clicks from the homepage.

      Return ONLY valid JSON:
      {
        "sites": [
          {
            "domain": "example.com",
            "specificPage": "example.com/about/history",
            "pathFromHome": "Click 'About Us' then 'Our History'",
            "interestingFact": "Something unique on this page",
            "whyRelevant": "How it relates to ${prompt}"
          }
        ]
      }
      `
    )) as { sites: ResearchSite[] };

    // ─── 2. Keep only reachable pages ─────────────────────────────
    const reachableSites: ResearchSite[] = [];
    for (const site of research.sites) {
      const url = site.specificPage.startsWith('http')
        ? site.specificPage
        : `https://${site.specificPage}`;

      if (await urlExists(url)) {
        reachableSites.push({ ...site, specificPage: url });
        if (reachableSites.length === 5) break;
      } else {
        console.warn('[hunt] Filtered out unreachable URL:', url);
      }
    }

    if (!reachableSites.length)
      return res
        .status(422)
        .json({ error: 'No valid URLs returned – try a different prompt.' });

    // ─── 3. Build the hunt steps ──────────────────────────────────
    for (const [idx, site] of reachableSites.entries()) {
      const targetUrl = site.specificPage;
      console.log(`[hunt] (${idx + 1}/${reachableSites.length}) Visiting: ${targetUrl}`);

      try {
        await page.goto(targetUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });

        const currentDomain = await page.evaluate(() =>
          location.hostname.replace(/^www\./, '')
        );
        if (currentDomain !== getDomain(targetUrl))
          throw new Error('Redirected off‑site – skipping.');

        const pageInfo: PageInfo = await page.evaluate(() => {
          const txt = (sel: string) =>
            Array.from(document.querySelectorAll(sel)).map(
              el => el.textContent?.trim() || ''
            );

          const keyFacts = txt('p, li, h2, h3')
            .filter(t => /\b(19|20)\d{2}\b/.test(t) && t.length < 200)
            .slice(0, 10);

          const uniqueContent = txt('p, li')
            .filter(
              t =>
                t.length > 30 &&
                t.length < 150 &&
                /(founded|created|invented|discovered|first|largest)/i.test(t)
            )
            .slice(0, 10);

          const navLinks = txt('nav a, header a').slice(0, 10);

          return {
            url: location.href,
            domain: location.hostname,
            title: document.title,
            keyFacts: Array.from(new Set(keyFacts)),
            navigationPaths: navLinks,
            uniqueContent: Array.from(new Set(uniqueContent))
          };
        });

        // ─── Ask OpenAI to craft the riddle ───────────────────────
        const riddleData = await askOpenAIForJson(
          `
          Create a riddle for a "${prompt}" scavenger hunt.

          Target URL: ${targetUrl}
          Domain: ${site.domain}
          Path from homepage: ${site.pathFromHome}
          Page content includes: ${pageInfo.keyFacts.slice(0, 3).join(' | ')}
          Unique content: ${pageInfo.uniqueContent.slice(0, 3).join(' | ')}

          The riddle should:
          1. Hint at the domain/company without naming it outright
          2. Hint at the specific section (history, about, products, etc.)
          3. Ask a specific question answerable from the page
          4. Be 3‑4 engaging sentences

          Include 4 hints from vague to obvious.

          Return ONLY valid JSON:
          {
            "riddle": "…",
            "answer": "…",
            "hints": ["…", "…", "…", "…"]
          }
          `,
          1200
        );

        steps.push({
          riddle: riddleData.riddle,
          targetUrl,
          answer: riddleData.answer,
          hints: riddleData.hints,
          pathFromHome: site.pathFromHome
        });
      } catch (err) {
        console.error('[hunt] Skipping page:', targetUrl, err);
      }
    }

    await stagehand.close();

    if (!steps.length)
      return res
        .status(500)
        .json({ error: 'All candidate pages failed – try again.' });

    // ─── 4. Respond ────────────────────────────────────────────────
    res.json({
      theme: prompt,
      instructions:
        'For each riddle: (1) Guess the site, (2) navigate via the hint path, (3) answer the question.',
      totalSteps: steps.length,
      hunt: steps.map((s, i) => ({
        step: i + 1,
        riddle: s.riddle,
        targetUrl: s.targetUrl,
        answer: s.answer,
        hints: s.hints,
        navigationHelp: s.pathFromHome
      }))
    });
  } catch (err) {
    console.error('[hunt] Fatal error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
