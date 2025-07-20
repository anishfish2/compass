// File: pages/hunt.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HuntClue {
  id: number;
  text: string;
  hint: string;
  answer: string;
  url?: string;
}

const Hunt = () => {
  const router = useRouter();
  const [huntData, setHuntData] = useState<HuntClue[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHunt = async () => {
      const foodKey = router.query.key as string;
      if (!foodKey) return;

      const { data, error } = await supabase
        .from("hunts")
        .select("clues")
        .eq("key", foodKey)
        .single();

      if (error) {
        console.error(error);
        setError("Failed to load hunt. Try a different key.");
        return;
      }

      if (!data?.clues) {
        setError("No clues found for this hunt.");
        return;
      }

      setHuntData(data.clues);
    };

    fetchHunt();
  }, [router.query.key]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-serif">Hunt Time!</h1>
        {error && <p className="text-red-500">{error}</p>}
        {huntData?.map((clue, index) => (
          <div key={clue.id} className="p-4 rounded-xl bg-gray-100">
            <h2 className="font-bold font-serif">Clue {index + 1}</h2>
            <p>{clue.text}</p>
            <p className="text-sm text-gray-500">Hint: {clue.hint}</p>
            {clue.url && (
              <a href={clue.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                {clue.url}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hunt;
