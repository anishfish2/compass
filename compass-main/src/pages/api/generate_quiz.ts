// src/pages/api/generate_quiz.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { Stagehand } from '@browserbasehq/stagehand';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
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

// ──────────────────────────────────────────
// Config
// ──────────────────────────────────────────
const OPENAI_RESEARCH_MODEL =
  process.env.OPENAI_RESEARCH_MODEL || 'o3-deep-research';

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
async function askOpenAIForJson(
  prompt: string,
  maxTokens = 2000,
  model = OPENAI_RESEARCH_MODEL
) {
  // Always include “json” in the prompt when using json_object response format
  const jsonPrompt = `${prompt.trim()}

Return your response as valid JSON.`;

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

/** Quick content extraction from a single page */
async function extractPageContent(
  page: Awaited<ReturnType<Stagehand['page']>>,
  url: string
): Promise<PageContent | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Wait for content to load
    await page.waitForTimeout(1000);

    const content = await page.evaluate(() => {
      const getText = (sel: string) =>
        Array.from(document.querySelectorAll(sel))
          .map(el => el.textContent?.trim() || '')
          .filter(t => t.length > 20 && t.length < 200);

      // Extract factual content
      const facts = getText('p, li, dd, td')
        .filter(t =>
          /\b(19|20)\d{2}\b/.test(t) || // dates
          /\$[\d,]+/.test(t) || // money
          /\d+%/.test(t) || // percentages
          /\b\d+\s*(million|billion|thousand)\b/i.test(t) || // large numbers
          /(first|largest|oldest|founder|created|invented|launched|developed|introduced)/i.test(t)
        )
        .slice(0, 10);

      // Extract specific content
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

// ──────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────
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

  const { topics, links, hints } = schema.parse(req.body);
  const steps: ScavengerStep[] = [];

  let stagehand: Stagehand | null = null;

  try {
    stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      modelName: 'gpt-4o-mini',
      modelClientOptions: { apiKey: process.env.OPENAI_API_KEY }
    });
    await stagehand.init();
    const page = stagehand.page;

    /* ───────────────── 1. Research Sites ──────────────────────────── */
    console.log('[hunt] Starting research for:', topics);

    const research = await askOpenAIForJson(
      `You are a meticulous research assistant. 
Return 8‑10 **non‑homepage** URLs (Wikipedia, documentation, company history, tutorials) that:
- Contain verifiable facts, dates, or statistics
- Are publicly accessible (no paywalls, logins, or heavy JavaScript gates)
- Prefer HTTPS

For EACH page include:
  • "domain": base domain only
  • "specificPage": full URL (must start with "http")
  • "pathFromHome": breadcrumbs / nav trail (if guessable)
  • "interestingFact": a single factual nugget from the page (30‑80 chars)
  • "whyRelevant": why it matters for the topic "${topics}"

${links?.length ? `You **must** incorporate these seed links if valid: ${links.join(', ')}` : ''}
${hints ? `Extra guidance: ${hints}` : ''}`,
      1500
    );

    const rawSites = research.sites || research.scavenger_hunt_sites || [];

    if (!Array.isArray(rawSites)) {
      console.error('[hunt] Invalid response format:', research);
      throw new Error('Invalid response from AI – please try again');
    }

    const seeds: ResearchSite[] = [];

    // Validate URLs quickly
    const urlChecks = rawSites.map(async site => {
      let pageUrl = site.specificPage || site.url || '';
      if (!pageUrl || typeof pageUrl !== 'string') return null;

      if (!pageUrl.startsWith('http')) {
        pageUrl = `https://${pageUrl}`;
      }

      const exists = await urlExists(pageUrl);
      if (exists) {
        return {
          domain: getDomain(pageUrl),
          specificPage: pageUrl,
          pathFromHome: site.pathFromHome || site.path || '',
          interestingFact: site.interestingFact || site.description || '',
          whyRelevant: site.whyRelevant || site.reason || ''
        };
      }
      console.log('[hunt] URL not accessible:', pageUrl);
      return null;
    });

    const validatedSites = await Promise.all(urlChecks);
    for (const site of validatedSites) {
      if (site) seeds.push(site);
    }

    if (!seeds.length) {
      return res.status(422).json({
        error: 'No accessible websites found. Try a different topic.'
      });
    }

    console.log(`[hunt] Found ${seeds.length} valid sites`);

    /* ───────────────── 2. Extract Content ──────────────────────────── */
    const allPageContent: PageContent[] = [];

    // Process pages in parallel with timeout
    const contentPromises = seeds.slice(0, 8).map(async seed => {
      console.log('[hunt] Extracting content from:', seed.domain);
      try {
        const content = await extractPageContent(page, seed.specificPage);
        if (
          content &&
          (content.keyFacts.length > 0 || content.specificContent.length > 0)
        ) {
          return { ...content, seed };
        }
      } catch (err) {
        console.error('[hunt] Failed to extract:', seed.specificPage, err);
      }
      return null;
    });

    const results = await Promise.all(contentPromises);

    for (const result of results) {
      if (result) {
        allPageContent.push(result);
      }
    }

    if (allPageContent.length < 2) {
      console.log('[hunt] Not enough content extracted, trying direct approach');

      // Fallback: Try to get content directly from first few seeds
      for (const seed of seeds.slice(0, 5)) {
        try {
          await page.goto(seed.specificPage, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });

          const pageInfo = await page.evaluate(() => {
            const txt = (sel: string) =>
              Array.from(document.querySelectorAll(sel))
                .map(el => el.textContent?.trim() || '')
                .filter(t => t && t.length > 30 && t.length < 200);

            return {
              title: document.title,
              keyFacts: txt('p, li, h2, h3')
                .filter(t => /\b(19|20)\d{2}\b/.test(t) || /\d+/.test(t))
                .slice(0, 5),
              specificContent: txt('p, li').slice(0, 10)
            };
          });

          if (
            pageInfo.keyFacts.length > 0 ||
            pageInfo.specificContent.length > 0
          ) {
            allPageContent.push({
              url: seed.specificPage,
              title: pageInfo.title,
              keyFacts: pageInfo.keyFacts,
              specificContent: pageInfo.specificContent
            });
          }
        } catch (err) {
          console.error('[hunt] Fallback error:', err);
        }
      }
    }

    /* ───────────────── 3. Generate Riddles ──────────────────────────── */
    for (const pageContent of allPageContent) {
      const potentialAnswers = [
        ...pageContent.keyFacts.slice(0, 3),
        ...pageContent.specificContent.slice(0, 3)
      ].filter(a => a && a.length > 30 && a.length < 150);

      if (!potentialAnswers.length) continue;

      try {
        const domain = getDomain(pageContent.url);
        const riddleData = await askOpenAIForJson(
          `Craft a 3‑4 sentence **poetic** riddle that references:
- The domain (“${domain}”) explicitly
- Navigation clues (breadcrumbs / headings) in metaphor
- A specific fact below chosen as the “answer”

Possible facts:
${potentialAnswers.map((a, i) => `${i + 1}. "${a}"`).join('\n')}

Return JSON:
{
  "riddle": "...",
  "answer": "exact text",
  "hints": [
    "Visit ${domain}",
    "Go to the "${pageContent.title}" page",
    "Look for: first 4‑5 words of the answer...",
    "The answer begins with: first 6‑7 words..."
  ]
}`,
          1400
        );

        // Ensure riddle mentions the domain
        const riddleText = riddleData.riddle.toLowerCase();
        const domainMentioned =
          riddleText.includes(domain.toLowerCase()) ||
          riddleText.includes(domain.split('.')[0].toLowerCase());

        if (!domainMentioned) {
          riddleData.riddle = `Upon ${domain}'s digital pages, ${riddleData.riddle}`;
        }

        steps.push({
          riddle: riddleData.riddle,
          answer: riddleData.answer,
          hints: riddleData.hints,
          targetUrl: pageContent.url,
          pathFromHome: pageContent.title
        });

        if (steps.length >= 8) break;
      } catch (err) {
        console.error('[hunt] Failed to generate riddle:', err);
      }
    }

    if (!steps.length) {
      return res.status(500).json({
        error: 'Could not generate riddles. Try a different topic.'
      });
    }

    /* ───────────────── 4. Response ──────────────────────────── */
    res.json({
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
    // Always close Stagehand
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (err) {
        console.error('[hunt] Error closing Stagehand:', err);
      }
    }
  }
}
