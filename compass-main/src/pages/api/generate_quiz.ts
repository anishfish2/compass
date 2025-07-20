import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const collectedTexts: string[] = [];


  var riddles: string[] = [];
  var urls: string[] = [];
  var answers: string[] = [];

  try {



    var initialPrompt = `You are a helpful browsing assistant that is creating an internet scavenger hunt for a user. The user has input these things to be included as themes or specific ideas, urls, or keywords to be included in the hunt. The scavenger hunt will involve a series of riddles that you are generating one by one. Given this prompt ${prompt}, generate an initial riddle for the first clue as to where to go and the url to that page.
                         The riddle should be somewhat easy to understand and link to a page that is relevant to the user's input. If the user's input is of a url or specific idea, the riddle should be related to that and the url should be the answer. The riddle should be very obvious and easy for the person to recognize where to go for the url. It should be a very famous website or a website that is very popular.
                         Your response should be in JSON format in this format {"riddle": "[your riddle here]", "url_answer": [your url here]"}. Do not include any other text or explanation in your response.}`

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: initialPrompt },
      ],
      temperature: 0.7,
    });

    const content = chatResponse.choices[0]!.message!.content!;
    const { riddle, url_answer } = JSON.parse(content);

    riddles.push(riddle);
    urls.push(url_answer);
    answers.push(riddle);


    for (let i = 0; i < 5; i++) {


      // Get browerbase content of the last page
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
      await page.goto(urls[urls.length - 1]);
      const pageContent = await page.evaluate(() => document.body.innerText);
      await stagehand.close();


      // Search step

      const searchResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: 'You are at Google.com. You are browwing the internet for the next location of an internet scavenger hunt. These are the things you need to include in the scavenger hunt: urls, keywords, or specific ideas. The user has given this prompt ${prompt}. Generate a search query that will help you find the next location of the scavenger hunt. Do not include any other text or explanation in your response. Make sure that the search query is relevant to the user\'s input.' },

        ],

      })


      const searchcontent = searchResponse.choices[0]!.message!.content!;

      const stagehand2 = new Stagehand({
        env: 'BROWSERBASE',
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
        modelName: 'gpt-4o',
        modelClientOptions: {
          apiKey: process.env.OPENAI_API_KEY,
        },
      });


      await stagehand2.init();
      const page2 = stagehand.page;
      await page2.goto(urls[urls.length - 1]);
      const pageContent2 = await page.evaluate(() => document.body.innerText);
      await stagehand2.close();


      // Generation Step


      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system', content: `You are a helpful browsing assistant that is creating an internet scavenger hunt for a user. The user has input these things to be included as themes or specific ideas, urls, or keywords to be included in the hunt. The scavenger hunt will involve a series of riddles that you are generating one by one. The user has given this prompt ${prompt}, and this was the url of the last page ${urls[urls.length - 1]}.
                                      This is the content of the last page ${pageContent} and this was the last riddle's answer ${answers[answers.length - 1]}. Generate the next riddle, with blanks where the user's input should be. The user's input should be from the last page's content. For example, if you create a riddle that says "The _____ are blue", and somewhere on the page the user has written "Often, birds can be blue", then the answer to the riddle should be "The birds are blue". and the url should be the url of twitter.com, who's
                                      mascot is a blue bird. The riddle should indicate the next url to visit and also where on the page the answer to the next riddle should be. The riddle should be somewhat easy to understand and link to a page that is relevant to the user's input. If the user's input is of a url or specific idea, the riddle should be related to that and the url should be the answer.
                                      Your response should be in JSON format in this format {"riddle": "[your riddle here]", "url_answer": [your url here], "answer": [your riddle's answer with the filled in blanks here]}. Do not include any other text or explanation in your response. Make sure that the riddles have some words blanked out that can be found in the content even if the previous riddle does not.}`
          },
        ],
      });

      const content = chatResponse.choices[0]!.message!.content!;
      const { riddle, url_answer } = JSON.parse(content);

      riddles.push(riddle);
      urls.push(url_answer);
      answers.push(riddle);



      console.log("riddles", riddles);
      console.log("urls", urls);
      console.log("answers", answers);
    }

    return res.json({ collectedTexts });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return res.status(500).json({ error: errorMessage });
  }
} 
