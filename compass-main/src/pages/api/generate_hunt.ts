// File: pages/api/generate_hunt.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';


interface HuntClue {
  id: number;
  text: string;
  hint: string;
  answer: string;
  url?: string;
}

const sampleClues: HuntClue[] = [
  {
    id: 1,
    text: "Find the social platform where professionals connect and share their career achievements.",
    hint: "Think blue and white logo, business networking, job postings.",
    answer: "linkedin",
    url: "https://linkedin.com"
  },
  {
    id: 2,
    text: "Visit the repository hosting service where developers collaborate on open source projects.",
    hint: "It has a cat mascot and is owned by Microsoft.",
    answer: "github",
    url: "https://github.com"
  },
  {
    id: 3,
    text: "Navigate to the search engine that promises not to track your searches.",
    hint: "It has a duck mascot and focuses on privacy.",
    answer: "duckduckgo",
    url: "https://duckduckgo.com"
  },
  {
    id: 4,
    text: "Find the video platform where creators share short-form content with dancing and trends.",
    hint: "Popular with Gen Z, known for viral dances and challenges.",
    answer: "tiktok",
    url: "https://tiktok.com"
  },
  {
    id: 5,
    text: "Visit the online encyclopedia that anyone can edit and contribute to.",
    hint: "It's a collaborative knowledge base that starts with 'Wiki'.",
    answer: "wikipedia",
    url: "https://wikipedia.org"
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simulate clue generation logic — return 5 sample clues for now
    const generatedClues = sampleClues.slice(0, 5);
    return res.status(200).json({ clues: generatedClues });
  } catch (error) {
    console.error('Error generating hunt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const generateFoodKey = () => {
  const foods = ["banana", "taco", "bagel", "mango", "donut", "sushi", "noodle", "apple", "carrot", "pizza"];
  return foods[Math.floor(Math.random() * foods.length)] + Math.floor(Math.random() * 1000);
};