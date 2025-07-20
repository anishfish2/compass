// File: pages/Design.tsx
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TrailMap } from "@/components/TrailMap";
import { Loader2, ClipboardCopy } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface HuntClue {
  id: number;
  text: string;
  hint: string;
  answer: string;
  url?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const Design: React.FC = () => {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [huntData, setHuntData] = useState<HuntClue[] | null>(null);
  const [customLinks, setCustomLinks] = useState<string[]>([""]);
  const [generalTopics, setGeneralTopics] = useState("");
  const [additionalHints, setAdditionalHints] = useState("");
  const [error, setError] = useState<string>("");
  const [shareableUrl, setShareableUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [angle, setAngle] = useState(0);
  const targetAngleRef = useRef(0);
  const compassRef = useRef<HTMLDivElement>(null);

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
      const clues: HuntClue[] = customLinks
        .filter(link => link.trim())
        .map((url, idx) => ({
          id: idx,
          text: `Clue for ${url}`,
          hint: additionalHints || "",
          answer: "Some answer",
          url,
        }));
  
      const generatedKey = generalTopics.trim().toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 10000);
  
      const { error: insertError } = await supabase.from("hunts").insert([
        { key: generatedKey, info: clues }
      ]);
  
      if (insertError) throw insertError;
  
      // Optional: Set shareable URL to show on screen
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
      const shareUrl = `${siteUrl}/hunt?key=${generatedKey}`;
      setShareableUrl(shareUrl);
      await navigator.clipboard.writeText(shareUrl);
  
      // ✅ Redirect to /hunt?key=...
      router.push(`/hunt?key=${generatedKey}`);
    } catch (err) {
      console.error("Error generating or saving hunt:", err);
      setError("Failed to save hunt to Supabase.");
    } finally {
      setIsGenerating(false);
    }
  };
  

  const handleCopyLink = async () => {
    if (shareableUrl) {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

        {huntData && (
          <div className="text-center space-y-2">
            <h2 className="text-2xl text-foreground">Hunt Generated!</h2>
            <p className="italic text-foreground/80">Share this link:</p>
            <div className="flex flex-col items-center space-y-2">
              <p className="font-mono text-blue-600 underline break-all">{shareableUrl}</p>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleCopyLink}
              >
                <ClipboardCopy className="w-4 h-4" /> {copied ? "Copied!" : "Copy link"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Design;
