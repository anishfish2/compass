// ──────────────────────────────────────────
// src/pages/api/generate_quiz.ts
// ──────────────────────────────────────────
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { Stagehand } from '@browserbasehq/stagehand';

/*──────────────── Types ────────────────*/
interface ResearchSite {
  domain: string;
  specificPage: string;
  pathFromHome: string;
  interestingFact: string;
  whyRelevant: string;
}
interface ScavengerStep {
  riddle: string;
  answer: string;
  hints: string[];
  targetUrl: string;
  pathFromHome: string;
}
interface PageContent {
  url: string;
  title: string;
  keyFacts: string[];
  specificContent: string[];
}

/*──────────────── Config ────────────────*/
const OPENAI_RESEARCH_MODEL =
  process.env.OPENAI_RESEARCH_MODEL || 'o3-deep-research';
const MAX_CONTENT_PAGES = 8;     // max sites we scrape in parallel
const MAX_STEPS = 10;            // max riddles returned

/*──────────────── Helpers ────────────────*/
async function askOpenAIForJson(
  prompt: string,
  maxTokens = 2000,
  model = OPENAI_RESEARCH_MODEL
) {
  const jsonPrompt = `${prompt.trim()}\n\nReturn your response as valid JSON.`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: jsonPrompt }],
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('[OpenAI] Error:', error);
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return r.ok && r.status < 400;
  } catch {
    return false;
  }
}
const getDomain = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

/** Extract page text quickly in Puppeteer‑compatible Stagehand page */
async function extractPageContent(
  page: Awaited<ReturnType<Stagehand['page']>>,
  url: string
): Promise<PageContent | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);

    const content = await page.evaluate(() => {
      const getText = (sel: string) =>
        Array.from(document.querySelectorAll(sel))
          .map(el => el.textContent?.trim() || '')
          .filter(t => t.length > 20 && t.length < 200);

      const facts = getText('p, li, dd, td')
        .filter(t =>
          /\b(19|20)\d{2}\b/.test(t) ||
          /\$[\d,]+/.test(t) ||
          /\d+%/.test(t) ||
          /\b\d+\s*(million|billion|thousand)\b/i.test(t) ||
          /(first|largest|oldest|founder|created|invented|launched|developed|introduced)/i.test(t)
        )
        .slice(0, 10);

      const specific = getText('p, li, h2, h3, blockquote')
        .filter(t => !/(cookie|privacy|subscribe|newsletter|sign up)/i.test(t))
        .slice(0, 15);

      return {
        url: location.href,
        title: document.title || 'Untitled',
        keyFacts: facts,
        specificContent: specific
      };
    });

    return content;
  } catch (err) {
    console.warn('[extract] Failed:', url, err);
    return null;
  }
}

/*──────────────── Main handler ────────────────*/
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const schema = z.object({
    topics: z.string(),
    links: z.array(z.string()).optional(),
    hints: z.string().optional()
  });
  const { topics, links = [], hints } = schema.parse(req.body);

  const steps: ScavengerStep[] = [];
  let stagehand: Stagehand | null = null;

  /*──────────────── 0.  Normalise & validate user‑supplied links ───────*/
  const explicitSeeds: ResearchSite[] = [];
  if (links.length) {
    console.log('[hunt] Validating user‑supplied links...');
    for (const raw of links) {
      let url = raw.trim();
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      if (!(await urlExists(url))) {
        return res.status(422).json({
          error: `Provided link is not reachable: ${url}`
        });
      }
      explicitSeeds.push({
        domain: getDomain(url),
        specificPage: url,
        pathFromHome: '',
        interestingFact: '',
        whyRelevant: 'User‑provided link'
      });
    }
  }

  try {
    /*──────────────── 1.  Stagehand boot ────────────────────────────*/
    stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      modelName: 'gpt-4o-mini',
      modelClientOptions: { apiKey: process.env.OPENAI_API_KEY }
    });
    await stagehand.init();
    const page = stagehand.page;

    /*──────────────── 2.  AI research for additional sites ───────────*/
    console.log('[hunt] Researching additional sites for topic:', topics);

    const aiResearch = await askOpenAIForJson(
      `You are a meticulous research assistant. 
Return 8‑10 **non‑homepage** URLs (Wikipedia, documentation, company history, tutorials) that:
- Contain verifiable facts, dates, or statistics
- Are publicly accessible (no paywall / login)
- Prefer HTTPS
For EACH page include:
  • "domain"
  • "specificPage"
  • "pathFromHome"
  • "interestingFact"
  • "whyRelevant" (why useful for "${topics}")
${hints ? `Extra guidance: ${hints}` : ''}
DO NOT repeat any of these user links: ${links.join(', ') || '(none)'}`,
      1500
    );

    const rawSites = Array.isArray(aiResearch.sites)
      ? aiResearch.sites
      : aiResearch.scavenger_hunt_sites || [];

    const additionalSeeds: ResearchSite[] = [];
    for (const site of rawSites) {
      let pageUrl =
        typeof site.specificPage === 'string'
          ? site.specificPage
          : typeof site.url === 'string'
            ? site.url
            : '';
      if (!pageUrl) continue;
      if (!/^https?:\/\//i.test(pageUrl)) pageUrl = `https://${pageUrl}`;

      const exists = await urlExists(pageUrl);
      if (exists) {
        if (
          explicitSeeds.some(s => s.specificPage === pageUrl) ||
          additionalSeeds.some(s => s.specificPage === pageUrl)
        )
          continue; // de‑dupe
        additionalSeeds.push({
          domain: getDomain(pageUrl),
          specificPage: pageUrl,
          pathFromHome: site.pathFromHome || site.path || '',
          interestingFact: site.interestingFact || site.description || '',
          whyRelevant: site.whyRelevant || site.reason || ''
        });
      }
    }

    /*──────────────── 3.  Consolidate seeds (user links first) ───────*/
    const seeds: ResearchSite[] = [
      ...explicitSeeds,
      ...additionalSeeds
    ];

    console.log(
      `[hunt] Total valid seeds: ${seeds.length} (${explicitSeeds.length} provided by user)`
    );

    if (!seeds.length)
      return res
        .status(422)
        .json({ error: 'No accessible websites found for this topic.' });

    /*──────────────── 4.  Scrape pages (ensure all user links) ───────*/
    const scrapeTargets = [
      ...seeds.slice(0, Math.max(MAX_CONTENT_PAGES, explicitSeeds.length))
    ];
    const allPageContent: (PageContent & { seed: ResearchSite })[] = [];

    await Promise.all(
      scrapeTargets.map(async seed => {
        console.log('[hunt] Extracting:', seed.specificPage);
        const content = await extractPageContent(page, seed.specificPage);
        if (
          content &&
          (content.keyFacts.length || content.specificContent.length)
        ) {
          allPageContent.push({ ...content, seed });
        }
      })
    );

    if (!allPageContent.length)
      return res
        .status(500)
        .json({ error: 'Failed to extract usable content from seeds.' });

    /*──────────────── 5.  Build riddles (user links first) ───────────*/
    // Helpers
    const buildRiddle = async (
      pc: PageContent
    ): Promise<ScavengerStep | null> => {
      const potentialAnswers = [
        ...pc.keyFacts.slice(0, 3),
        ...pc.specificContent.slice(0, 3)
      ].filter(t => t.length > 30 && t.length < 150);

      if (!potentialAnswers.length) return null;

      const domain = getDomain(pc.url);
      try {
        const data = await askOpenAIForJson(
          `Craft a 3‑4 sentence **poetic** riddle that references:
- The domain (“${domain}”) explicitly
- Navigation clues (breadcrumbs / headings) in metaphor
- A specific fact below chosen as the “answer”

Possible facts:
${potentialAnswers.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

Return JSON:
{
  "riddle": "...",
  "answer": "exact text",
  "hints": [
    "Visit ${domain}",
    "Go to the "${pc.title}" page",
    "Look for: first 4‑5 words of the answer...",
    "The answer begins with: first 6‑7 words..."
  ]
}`,
          1200
        );

        const riddleText = data.riddle.toLowerCase();
        if (
          !riddleText.includes(domain.toLowerCase()) &&
          !riddleText.includes(domain.split('.')[0].toLowerCase())
        ) {
          data.riddle = `Upon ${domain}'s pages, ${data.riddle}`;
        }

        return {
          riddle: data.riddle,
          answer: data.answer,
          hints: data.hints,
          targetUrl: pc.url,
          pathFromHome: pc.title
        };
      } catch (err) {
        console.error('[hunt] Riddle AI failed, falling back:', err);
        // basic fallback so user link still appears
        return {
          riddle: `Seek knowledge on ${domain}. Traverse to "${pc.title}" and discover its hidden truth.`,
          answer: potentialAnswers[0] || pc.title,
          hints: [
            `Visit ${domain}`,
            `Find the page titled “${pc.title}”`,
            `Scroll until you spot the phrase starting “${(potentialAnswers[0] || pc.title).split(' ').slice(0, 4).join(' ')
            }…”`,
            'Copy that sentence exactly'
          ],
          targetUrl: pc.url,
          pathFromHome: pc.title
        };
      }
    };

    // 5a. user‑supplied pages first
    for (const pc of allPageContent.filter(c =>
      explicitSeeds.some(s => s.specificPage === c.url)
    )) {
      const step = await buildRiddle(pc);
      if (step) steps.push(step);
    }

    // 5b. fill remaining steps with extra pages
    for (const pc of allPageContent.filter(
      c => !explicitSeeds.some(s => s.specificPage === c.url)
    )) {
      if (steps.length >= MAX_STEPS) break;
      const step = await buildRiddle(pc);
      if (step) steps.push(step);
    }

    /*──────────────── 6.  Post‑check: every link included ───────────*/
    const missing = explicitSeeds.filter(
      es => !steps.some(s => s.targetUrl === es.specificPage)
    );
    if (missing.length) {
      throw new Error(
        `Could not generate riddles for provided link(s): ${missing
          .map(m => m.specificPage)
          .join(', ')}`
      );
    }

    /*──────────────── 7.  Respond ───────────────────────────*/
    return res.json({
      theme: topics,
      instructions:
        'Each riddle points to a specific webpage. The answer is an exact quote from that page. Use hints if needed – they get progressively more specific.',
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
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    });
  } finally {
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (e) {
        console.error('[hunt] Error closing Stagehand:', e);
      }
    }
  }
}
