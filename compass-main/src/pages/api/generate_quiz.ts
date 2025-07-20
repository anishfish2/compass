import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

// Initialize Claude (Anthropic)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

// Helper to clean URLs
function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

// Helper to get domain
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  const steps: ScavengerStep[] = [];
  const visitedDomains: string[] = [];

  try {
    console.log('Starting scavenger hunt generation for theme:', prompt);

    // Initialize Stagehand
    const stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      modelName: 'claude-3-5-sonnet-20241022',
      modelClientOptions: {
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
    });

    await stagehand.init();
    const page = stagehand.page;

    // Step 1: Research relevant websites for the theme
    const researchMessage = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Research websites for a scavenger hunt about "${prompt}".

        Find 5 interesting websites with specific pages (not just homepages) that would create an educational journey.
        Each site should have pages that are 1-2 clicks from the homepage.

        For example, for "food":
        - Not just "mcdonalds.com" but "mcdonalds.com/us/en-us/about-us/our-history.html"
        - Not just "wikipedia.org" but a specific interesting article

        Return ONLY valid JSON without markdown:
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
        }`
      }]
    });

    let researchContent = researchMessage.content[0].text;
    researchContent = researchContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const research = JSON.parse(researchContent);

    // Generate riddles for each site
    for (let i = 0; i < Math.min(5, research.sites.length); i++) {
      const site = research.sites[i];
      const targetUrl = `https://${site.specificPage}`;

      console.log(`Step ${i + 1}: Creating riddle for ${targetUrl}`);

      // Navigate to the target page to extract content
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extract key information from the page
        const pageInfo: PageInfo = await page.evaluate(() => {
          const keyFacts: string[] = [];
          const uniqueContent: string[] = [];

          // Find specific facts (years, numbers, names)
          document.querySelectorAll('p, li, h2, h3, div').forEach(el => {
            const text = el.textContent?.trim() || '';

            // Look for years
            if (text.match(/\b(19|20)\d{2}\b/) && text.length < 200) {
              keyFacts.push(text);
            }

            // Look for specific names, places, or unique terms
            if (text.length > 30 && text.length < 150 &&
              (text.includes('founded') || text.includes('created') ||
                text.includes('invented') || text.includes('discovered') ||
                text.includes('first') || text.includes('largest'))) {
              uniqueContent.push(text);
            }
          });

          // Get navigation structure
          const navLinks = Array.from(document.querySelectorAll('nav a, header a'))
            .map(a => a.textContent?.trim() || '')
            .filter(text => text.length > 0);

          return {
            url: window.location.href,
            domain: window.location.hostname,
            title: document.title,
            keyFacts: [...new Set(keyFacts)].slice(0, 10),
            navigationPaths: navLinks.slice(0, 10),
            uniqueContent: [...new Set(uniqueContent)].slice(0, 10)
          };
        });

        // Create a riddle that hints at the URL and asks about content
        const riddleMessage = await anthropic.messages.create({
          model: 'claude-opus-4-20250514',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `Create a riddle for a "${prompt}" scavenger hunt.

            Target URL: ${targetUrl}
            Domain: ${site.domain}
            Path from homepage: ${site.pathFromHome}
            Page content includes: ${pageInfo.keyFacts.slice(0, 3).join(' | ')}
            Unique content: ${pageInfo.uniqueContent.slice(0, 3).join(' | ')}

            Create a riddle that:
            1. Hints at the domain/company without saying it directly
            2. Hints at the specific section (history, about, products, etc.)
            3. Asks a specific question that can be answered from the page
            4. Is descriptive and engaging (3-4 sentences)

            Example format:
            "Journey to the golden arches empire, where billions have been served since 1940. Navigate to where their story began, through the chronicles of time. Once you arrive at their historical archives, tell me: In what year did Ray Kroc open the first franchised location?"

            Also provide 4 hints from vague to obvious:
            - Hint 1: Very cryptic
            - Hint 2: Mentions the type of company/site
            - Hint 3: Stronger clue about the specific page
            - Hint 4: Almost gives away the domain and section

            Return ONLY valid JSON without markdown:
            {
              "riddle": "The full riddle text",
              "answer": "The specific answer from the page",
              "hints": [
                "Cryptic hint",
                "Type of site hint",
                "Page location hint",
                "Obvious hint"
              ]
            }`
          }]
        });

        let riddleContent = riddleMessage.content[0].text;
        riddleContent = riddleContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const riddleData = JSON.parse(riddleContent);

        steps.push({
          riddle: riddleData.riddle,
          targetUrl: targetUrl,
          answer: riddleData.answer,
          hints: riddleData.hints,
          pathFromHome: site.pathFromHome
        });

        visitedDomains.push(getDomain(targetUrl));

      } catch (error) {
        console.error(`Failed to process ${targetUrl}:`, error);

        // Create a fallback riddle without visiting the page
        steps.push({
          riddle: `Explore the world of ${prompt} at ${site.domain}. Navigate to their ${site.specificPage.includes('about') ? 'about section' : 'main content'} and discover an interesting fact about their journey.`,
          targetUrl: targetUrl,
          answer: "Check the main heading or first paragraph",
          hints: [
            `Think about ${prompt} and where you might learn more`,
            `This site is dedicated to ${site.whyRelevant}`,
            `Look for the '${site.pathFromHome.split(' ')[1]}' section`,
            `Visit ${site.domain} and ${site.pathFromHome.toLowerCase()}`
          ],
          pathFromHome: site.pathFromHome
        });
      }
    }

    await stagehand.close();

    console.log(steps);

    // Return the complete scavenger hunt
    return res.json({
      theme: prompt,
      instructions: "For each riddle: 1) Guess the website and navigate to the specific page described, 2) Find the answer to the question asked in the riddle",
      hunt: steps.map((step, index) => ({
        step: index + 1,
        riddle: step.riddle,
        targetUrl: step.targetUrl,
        answer: step.answer,
        hints: step.hints,
        navigationHelp: step.pathFromHome
      })),
      totalSteps: steps.length
    });

  } catch (err: unknown) {
    console.error('Error in scavenger hunt generation:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return res.status(500).json({ error: errorMessage });
  }
}










