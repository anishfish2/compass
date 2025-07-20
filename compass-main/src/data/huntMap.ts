export interface HuntClue {
    id: number;
    text: string;
    hint: string;
    answer: string;
    url?: string;
  }
  
  export const huntMap: Record<string, HuntClue[]> = {
    sushi: [
      {
        id: 1,
        text: "Find the site that lets you order fresh sushi.",
        hint: "Think red delivery app.",
        answer: "doordash",
        url: "https://www.doordash.com",
      },
      // ...more
    ],
    tacos: [
      {
        id: 1,
        text: "Visit the taco place that thinks outside the bun.",
        hint: "Fast food giant.",
        answer: "tacobell",
        url: "https://www.tacobell.com",
      },
    ],
  };
  