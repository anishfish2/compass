import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const collectedTexts: string[] = [];
  let currentPrompt = prompt;

  try {
    // Loop control
    for (let i = 0; i < 5; i++) {
      // 1. Ask OpenAI for next step
      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful browsing assistant. Respond only with JSON.' },
          { role: 'user', content: currentPrompt },
        ],
        temperature: 0.7,
      });

      const message = chatResponse.choices[0]?.message?.content;
      if (!message) break;

      // 2. Parse JSON response
      let parsed;
      try {
        parsed = JSON.parse(message);
      } catch (e) {
        return NextResponse.json({ error: 'OpenAI did not return valid JSON', message }, { status: 500 });
      }

      const schema = z.object({
        text: z.string(),
        url: z.string().optional(),
      });

      const { text, url } = schema.parse(parsed);
      collectedTexts.push(text);

      // 3. If no more URLs to fetch, stop
      if (!url) break;

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

      await stagehand.init();
      const page = stagehand.page;
      await page.goto(url);
      const pageContent = await page.evaluate(() => document.body.innerText);
      await stagehand.close();

      // 5. Update prompt for next iteration
      currentPrompt = `Here is the content of ${url}. What should I do next? Respond in JSON. \n\n${pageContent}`;
    }

    return NextResponse.json({ collectedTexts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
