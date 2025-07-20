import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types/Interfaces
interface PromptRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

interface OpenAIResponse {
  prompt: string;
  response: string;
  model: string;
}

interface ErrorResponse {
  error: string;
  detail: string;
}

// GET handler (equivalent to your root route)
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  return res.json({ Hello: 'World' });
}

// POST handler (your OpenAI route)
export default async function handler(request: NextApiRequest, res: NextApiResponse) {
  if (request.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Parse request body
    const body: PromptRequest = request.body;
    const { prompt, max_tokens = 150, temperature = 0.7 } = body;

    // Validate request
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json(
        {
          error: 'Validation Error',
          detail: 'Prompt is required and must be a string'
        } as ErrorResponse
      );
    }

    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json(
        {
          error: 'Configuration Error',
          detail: 'OpenAI API key not configured'
        } as ErrorResponse
      );
    }

    // Call OpenAI API
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: max_tokens,
      temperature: temperature
    });

    const messageContent = response.choices[0]?.message?.content;
    
    if (!messageContent) {
      return res.status(500).json(
        {
          error: 'OpenAI Error',
          detail: 'No response received from OpenAI'
        } as ErrorResponse
      );
    }

    // Return successful response
    const successResponse: OpenAIResponse = {
      prompt: prompt,
      response: messageContent.trim(),
      model: response.model
    };

    return res.json(successResponse);

  } catch (error: unknown) {
    console.error('OpenAI API Error:', error);

    // Type guard for error with status property
    const isErrorWithStatus = (err: unknown): err is { status: number; message?: string } => {
      return typeof err === 'object' && err !== null && 'status' in err;
    };

    // Handle specific OpenAI errors
    if (isErrorWithStatus(error) && error.status === 401) {
      return res.status(401).json(
        {
          error: 'Authentication Error',
          detail: 'Invalid OpenAI API key'
        } as ErrorResponse
      );
    }

    if (isErrorWithStatus(error) && error.status === 429) {
      return res.status(429).json(
        {
          error: 'Rate Limit Error',
          detail: 'OpenAI rate limit exceeded'
        } as ErrorResponse
      );
    }

    if (isErrorWithStatus(error) && error.status) {
      return res.status(error.status).json(
        {
          error: 'OpenAI API Error',
          detail: error.message || 'Unknown OpenAI error'
        } as ErrorResponse
      );
    }

    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
    return res.status(500).json(
      {
        error: 'Server Error',
        detail: errorMessage
      } as ErrorResponse
    );
  }
} 