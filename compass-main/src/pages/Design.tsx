// Updated Design.tsx to match new clue structure from /api/generate_quiz
import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TrailMap } from "@/components/TrailMap";
import { Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const generateFoodKey = () => {
  const foods = ["banana", "taco", "bagel", "mango", "donut", "sushi", "noodle", "apple", "carrot", "pizza"];
  return foods[Math.floor(Math.random() * foods.length)] + Math.floor(Math.random() * 1000);
};

const Design: React.FC = () => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [customLinks, setCustomLinks] = useState<string[]>([""]);
  const [generalTopics, setGeneralTopics] = useState("");
  const [additionalHints, setAdditionalHints] = useState("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const validateInputs = () => {
    const hasCustomLinks = customLinks.some(link => link.trim());
    const hasTopics = generalTopics.trim();
    const hasHints = additionalHints.trim();

    if (!hasCustomLinks && !hasTopics && !hasHints) {
      setError("Please provide at least one custom link, topic, or hint to generate your hunt.");
      return false;
    }

    const validUrls = customLinks.filter(link => link.trim()).every(link => {
      try {
        new URL(link);
        return true;
      } catch {
        return false;
      }
    });

    if (customLinks.some(link => link.trim()) && !validUrls) {
      setError("Please enter valid URLs (including https://).");
      return false;
    }

    setError("");
    return true;
  };

  const generateHunt = async () => {
    if (!validateInputs()) return;

    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: generalTopics,
          links: customLinks.filter(link => link.trim()),
          hints: additionalHints
        })
      });

      const data = await res.json();
      const clues = data.hunt;
      console.log("data: ",data);
      console.log(clues);
      if (!clues || clues.length === 0) throw new Error("No clues returned");

      const formattedClues = clues.map((c: any, idx: number) => ({
        id: idx,
        text: c.riddle,
        hint: c.hints?.[0] || "",
        answer: c.answer,
        url: c.targetUrl
      }));

      console.log(formattedClues)

      const generatedKey = generateFoodKey();
      const { error: insertError } = await supabase.from("hunts").insert([
        { key: generatedKey, info: formattedClues }
      ]);

      if (insertError) throw insertError;
      router.push(`/Hunt?key=${generatedKey}`);
    } catch (err) {
      console.error("Error generating or saving hunt:", err);
      setError("Failed to generate hunt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-forest flex flex-col items-center justify-center p-6 font-serif">
      <TrailMap />
      <div className="space-y-6 w-full max-w-2xl">
        <h1 className="text-4xl text-center text-foreground font-serif mb-4">Design Your Hunt</h1>

        <div className="text-xl text-red-500 italic text-center">{error}</div>

        <div className="space-y-2">
          <label className="block text-foreground text-lg">Custom Links</label>
          {customLinks.map((link, index) => (
            <Input
              key={index}
              type="text"
              value={link}
              onChange={e => {
                const newLinks = [...customLinks];
                newLinks[index] = e.target.value;
                setCustomLinks(newLinks);
              }}
              placeholder="https://example.com"
              className="w-full"
            />
          ))}
        </div>

        <div>
          <label className="block text-foreground text-lg">General Topics</label>
          <Input
            type="text"
            value={generalTopics}
            onChange={e => setGeneralTopics(e.target.value)}
            placeholder="Art museums, AI, coffee shops..."
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-foreground text-lg">Additional Hints</label>
          <Textarea
            value={additionalHints}
            onChange={e => setAdditionalHints(e.target.value)}
            placeholder="Add extra riddle or scavenger clues here..."
            className="w-full"
          />
        </div>

        <Button
          onClick={generateHunt}
          className="w-full bg-accent hover:bg-accent/80 text-background text-lg py-4 rounded-xl"
          disabled={isGenerating}
        >
          {isGenerating ? <><Loader2 className="mr-2 animate-spin" /> Generating...</> : "Generate Hunt"}
        </Button>
      </div>
    </div>
  );
};

export default Design;