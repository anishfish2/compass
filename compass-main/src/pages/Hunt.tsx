// File: pages/hunt.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { ProgressBar } from "@/components/ProgressBar";
import { AnswerInput } from "@/components/AnswerInput";
import { HintButton } from "@/components/HintButton";
import Confetti from "react-confetti";
import { createClient } from "@supabase/supabase-js";

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
  const [huntData, setHuntData] = useState<HuntClue[]>([]);
  const [currentClue, setCurrentClue] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const huntKey = router.query.key as string;

  useEffect(() => {
    const fetchHunt = async () => {
      if (!huntKey) return;

      const { data, error } = await supabase
        .from("hunts")
        .select("info")
        .eq("key", huntKey)
        .single();

      if (error || !data?.info) {
        setError("Failed to load hunt. Try a different key.");
        return;
      }

      setHuntData(data.info);
      setLoaded(true);
    };

    if (router.isReady) {
      fetchHunt();
    }
  }, [router.isReady, huntKey]);

  const handleAnswer = async (answer: string) => {
    setIsLoading(true);
    setError(null);

    const correctAnswer = huntData[currentClue].answer.trim().toLowerCase();
    const userAnswer = answer.trim().toLowerCase();

    await new Promise(resolve => setTimeout(resolve, 600));

    if (userAnswer === correctAnswer) {
      setAnswers(prev => [...prev, answer]);
      setShowConfetti(true);

      setTimeout(() => {
        setShowConfetti(false);
        if (currentClue < huntData.length - 1) {
          setCurrentClue(currentClue + 1);
        } else {
          const endTime = Date.now();
          const totalTime = Math.floor((endTime - startTime) / 1000);
          const correctAnswers = [...answers, answer].filter((ans, idx) =>
            ans.toLowerCase().includes(huntData[idx]?.answer?.toLowerCase())
          ).length;

          router.push({
            pathname: "/complete",
            query: {
              key: huntKey,
              totalTime: totalTime.toString(),
              correctAnswers: correctAnswers.toString(),
              totalClues: huntData.length.toString(),
              answers: JSON.stringify([...answers, answer])
            }
          });
        }
      }, 1200);
    } else {
      setShake(true);
      setError("Wrong answer! Try again.");
      setTimeout(() => {
        setShake(false);
        setError(null);
      }, 600);
    }

    setIsLoading(false);
  };

  const currentClueData = huntData[currentClue];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-forest flex flex-col"
    >
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      {!loaded && !error && (
        <div className="text-center text-foreground mt-32 text-xl font-serif italic">Loading hunt...</div>
      )}

      {error && (
        <div className="text-center text-red-500 mt-32 text-xl font-serif italic">{error}</div>
      )}

      {loaded && !error && currentClueData && (
        <>
          {/* Hint */}
          <div className="px-6 mb-8">
            <HintButton hint={currentClueData.hint} />
          </div>

          {/* Main Content */}
          <div className="flex-grow flex justify-center px-6">
            <div className="flex flex-col justify-center items-center w-full max-w-2xl text-center space-y-8 min-h-[calc(100vh-200px)]">
              <CompassStar size="md" className="mx-auto" />
              <p className="text-foreground text-lg md:text-xl leading-relaxed font-serif">
                {currentClueData.text}
              </p>

              <AnswerInput
                placeholder="enter your answer here ..."
                onSubmit={handleAnswer}
                isLoading={isLoading}
                error={shake}
              />

              <ProgressBar
                currentStep={currentClue + 1}
                totalSteps={huntData.length}
                className="justify-center"
              />
            </div>
          </div>

          {/* Timer */}
          <div className="p-6">
            <div className="flex items-center text-foreground text-sm">
              <div className="w-3 h-3 bg-accent rounded-full mr-2" />
              <span>
                {Math.floor((Date.now() - startTime) / 1000 / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {Math.floor(((Date.now() - startTime) / 1000) % 60)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          50% {
            transform: translateX(5px);
          }
          75% {
            transform: translateX(-5px);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-shake {
          animation: shake 0.4s ease;
        }
      `}</style>
    </motion.div>
  );
};

export default Hunt;
