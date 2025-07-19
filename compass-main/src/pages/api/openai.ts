import { NextRequest, NextResponse } from 'next/server';
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
export async function GET() {
  return NextResponse.json({ Hello: 'World' });
}

// POST handler (your OpenAI route)
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PromptRequest = await request.json();
    const { prompt, max_tokens = 150, temperature = 0.7 } = body;

    // Validate request
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          detail: 'Prompt is required and must be a string'
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'Configuration Error',
          detail: 'OpenAI API key not configured'
        } as ErrorResponse,
        { status: 500 }
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
      return NextResponse.json(
        {
          error: 'OpenAI Error',
          detail: 'No response received from OpenAI'
        } as ErrorResponse,
        { status: 500 }
      );
    }

    // Return successful response
    const successResponse: OpenAIResponse = {
      prompt: prompt,
      response: messageContent.trim(),
      model: response.model
    };

    return NextResponse.json(successResponse);

  } catch (error: any) {
    console.error('OpenAI API Error:', error);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      return NextResponse.json(
        {
          error: 'Authentication Error',
          detail: 'Invalid OpenAI API key'
        } as ErrorResponse,
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        {
          error: 'Rate Limit Error',
          detail: 'OpenAI rate limit exceeded'
        } as ErrorResponse,
        { status: 429 }
      );
    }

    if (error.status) {
      return NextResponse.json(
        {
          error: 'OpenAI API Error',
          detail: error.message || 'Unknown OpenAI error'
        } as ErrorResponse,
        { status: error.status }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'Server Error',
        detail: error.message || 'Unexpected error occurred'
      } as ErrorResponse,
      { status: 500 }
    );
  }
}