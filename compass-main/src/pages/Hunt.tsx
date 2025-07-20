import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { ProgressBar } from "@/components/ProgressBar";
import { AnswerInput } from "@/components/AnswerInput";
import { HintButton } from "@/components/HintButton"; // assume it accepts onClick + hint
import Confetti from "react-confetti";
import { createClient } from "@supabase/supabase-js";
import clsx from "clsx";   // if you don't already have a helper

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HuntClue {
  id: number;
  text: string;
  hints: string[];        // <── holds all hints
  answer: string;
  url?: string;
}

interface SupabaseClue {
  text?: string;
  riddle?: string;
  hints?: string[];
  hint?: string;
  answer: string;
  url?: string;
  targetUrl?: string;
}

const Hunt = () => {
  const router = useRouter();
  const [huntData, setHuntData] = useState<HuntClue[]>([]);
  const [currentClue, setCurrentClue] = useState(0);
  const [hintIndex, setHintIndex] = useState(-1);
  const [answers, setAnswers] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [correctOnFirstTry, setCorrectOnFirstTry] = useState(0);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [elapsed, setElapsed] = useState(0);     // seconds since start

  // ──────────────────────────────────────────
  // Fetch hunt once router key is ready
  // ──────────────────────────────────────────
  useEffect(() => {
    const fetchHunt = async () => {
      const huntKey = router.query.key as string;
      if (!huntKey) return;

      const { data, error } = await supabase
        .from("hunts")
        .select("info")
        .eq("key", huntKey)
        .single();

      if (error || !data?.info) {
        console.error("Failed to load hunt:", error);
        setError("Failed to load hunt. Try a different key.");
        return;
      }
      const parsed: HuntClue[] = (data.info as SupabaseClue[]).map((clue, idx) => ({

        id: idx,
        text: clue.text ?? clue.riddle ?? "",   // ← always a string
        hints:
          clue.hints?.length
            ? clue.hints
            : clue.hint
              ? [clue.hint]
              : [""],                              // ← always array<string>
        answer: clue.answer ?? "",               // (assuming answer is required)
        url: clue.url ?? clue.targetUrl ?? ""    // ← pick one or fallback to ""
      }));

      setHuntData(parsed);
      setLoaded(true);
    };

    if (router.isReady) fetchHunt();
  }, [router.isReady, router.query.key]);

  // reset hint index whenever we move to a new clue
  useEffect(() => {
    setHintIndex(0);
  }, [currentClue]);

  const handleHintClick = () => {
    const total = huntData[currentClue]?.hints.length ?? 1;
    console.log(total);
    console.log("hint clicked", hintIndex);
    setHintIndex(prev =>
      (prev + 1) % total        // reveal first, then cycle
    );
  };


  useEffect(() => setHintIndex(-1), [currentClue]);

  useEffect(() => {
    if (!loaded) return;                         // wait until hunt fetched

    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(id);              // cleanup on unmount
  }, [loaded, startTime]);

  const handleAnswer = async (answer: string) => {
    setIsLoading(true);
    setError(null);

    const correctAnswer = huntData[currentClue].answer.trim().toLowerCase();
    const userAnswer = answer.trim().toLowerCase();

    await new Promise(r => setTimeout(r, 600));

    if (userAnswer === correctAnswer) {
      // count only if no previous wrong attempt for this clue
      let newCorrect = correctOnFirstTry;
      if (isFirstAttempt) {
        newCorrect = correctOnFirstTry + 1;
        setCorrectOnFirstTry(newCorrect);
      }

      setAnswers(prev => [...prev, answer]);
      setShowConfetti(true);

      setTimeout(() => {
        setShowConfetti(false);
        if (currentClue < huntData.length - 1) {
          setCurrentClue(prev => prev + 1);
          setIsFirstAttempt(true);                // ⬅️ reset for next clue
        } else {
          const endTime = Date.now();
          const totalTime = Math.floor((endTime - startTime) / 1000);

          router.push({
            pathname: "/Complete",
            query: {
              key: router.query.key,
              totalTime: totalTime.toString(),
              correctAnswers: newCorrect.toString(), // ⬅️ use counter
              totalClues: huntData.length.toString(),
              answers: JSON.stringify([...answers, answer])
            }
          });

        }
      }, 3000);
    } else {
      setIsFirstAttempt(false);
      setShake(true);
      setTimeout(() => setShake(false), 600); // duration matches CSS
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
      className={clsx(
        "min-h-screen bg-gradient-forest flex flex-col",
        shake && "animate-shake overflow-hidden"   // 👈 hide both axes while shaking
      )}
    // className="min-h-screen bg-gradient-forest flex flex-col"
    >
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />

      )}

      {!loaded && !error && (
        <div className="text-center text-foreground mt-32 text-xl font-serif italic">
          Loading hunt...
        </div>
      )}

      {/* {error && ( */}
      {/*   <div className="text-center text-red-500 mt-32 text-xl font-serif italic"> */}
      {/*     {error} */}
      {/*   </div> */}
      {/* )} */}

      {loaded && !error && currentClueData && (
        <>
          {/* Hint button with cycling */}
          <div className="px-6 mb-8">

            <HintButton
              hint={
                hintIndex === -1
                  ? undefined              // show the “hint?” bulb
                  : currentClueData.hints[hintIndex]
              }
              onClick={handleHintClick}
            />

          </div>

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

          <div className="p-6">
            <div className="flex items-center text-foreground text-sm">
              <div className="w-3 h-3 bg-accent rounded-full mr-2" />
              <span>
                {Math.floor(elapsed / 60).toString().padStart(2, "0")}:
                {(elapsed % 60).toString().padStart(2, "0")}
              </span>            </div>
          </div>
        </>
      )}

      {/* shake animation */}
      <style jsx global>{`
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-6px) rotate(-2deg); }
  40%      { transform: translateX(6px)  rotate(2deg); }
  60%      { transform: translateX(-4px) rotate(-1deg); }
  80%      { transform: translateX(4px)  rotate(1deg); }
}
.animate-shake {
  animation: shake 0.6s ease;
}

      `}</style>
    </motion.div>
  );
};

export default Hunt;
