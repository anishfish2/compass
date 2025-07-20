import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("beginning of generate");
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { prompt } = req.body;
  const collectedTexts: string[] = [];
  let currentPrompt = prompt;

  try {
    console.log("Generating quiz for prompt:", prompt);
    // Loop control
    for (let i = 0; i < 5; i++) {
      // 1. Ask OpenAI for next step
      currentPrompt = 'Give a random URL and only that URL. Respond in a string URL.'
      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful browsing assistant.' },
          { role: 'user', content: currentPrompt },
        ],
        temperature: 0.7,
      });

      // const message = chatResponse.choices[0]?.message?.content;
      const message = 'https://www.ycombinator.com/companies/pylon-2'
      if (!message) break;
      console.log("message:", message);

      // // 2. Parse JSON response
      // let parsed;
      // try {
      //   parsed = JSON.parse(message);
      // } catch (e) {
      //   console.log("error:", e);
      //   return res.status(500).json({ error: 'OpenAI did not return valid JSON', message });
      // }

      // const schema = z.object({
      //   text: z.string(),
      //   url: z.string().optional(),
      // });

      // console.log("parsed:", parsed);

      // const { text, url } = schema.parse(parsed);
      // console.log("text:", text);
      // console.log("url:", url);
      // collectedTexts.push(text);

      // // 3. If no more URLs to fetch, stop
      // if (!url) {
      //   console.log("no url, breaking");
      //   break;
      // }

      // console.log("url:", url);

      // 4. Fetch page content with Browserbase
      const stagehand = new Stagehand({
        env: 'BROWSERBASE',
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
        modelName: 'gpt-4o',
        modelClientOptions: {
          apiKey: process.env.OPENAI_API_KEY,
        },
      });

      console.log("stagehand");

      await stagehand.init();
      console.log("stagehand2");
      const page = stagehand.page;
      await page.goto(message);
      console.log("page3");
      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log("page4");
      console.log("111");
      await stagehand.close();
      
      console.log("pageContent:", pageContent);

      // 5. Update prompt for next iteration
      currentPrompt = `Here is the content of ${message}. What should I do next? Respond in JSON. \n\n${pageContent}`;
    }

    return res.json({ collectedTexts });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return res.status(500).json({ error: errorMessage });
  }
} 