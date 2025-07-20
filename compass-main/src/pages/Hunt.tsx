import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { ProgressBar } from "@/components/ProgressBar";
import { AnswerInput } from "@/components/AnswerInput";
import { HintButton } from "@/components/HintButton";

// Confetti component
const Confetti = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: "-5%",
            backgroundColor: Math.random() > 0.5 ? "#FFD700" : "#FFFFFF",
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ 
            y: window.innerHeight + 20, 
            opacity: 0,
            rotate: particle.rotation,
            x: Math.random() * 200 - 100,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Mock hunt data (fallback)
const mockHuntData = {
  clues: [
    {
      id: 1,
      text: "The pandemic changed everything about work. Visit the company that wrote 'Remote: Office Not Required' and find their latest blog post about remote work.",
      hint: "Look for a company founded by the creators of Ruby on Rails. They're known for their project management tools.",
      answer: "basecamp",
      url: "https://basecamp.com"
    },
    {
      id: 2,
      text: "Find the social media platform where professionals connect. Navigate to the profile of the CEO of Tesla and SpaceX.",
      hint: "Think blue and white logo, business networking, professional profiles.",
      answer: "linkedin",
      url: "https://linkedin.com"
    },
    {
      id: 3,
      text: "Discover the video platform where a Swedish gamer became the most subscribed individual creator. What's his real first name?",
      hint: "He's known for playing Minecraft and has over 110 million subscribers.",
      answer: "felix",
      url: "https://youtube.com"
    },
    {
      id: 4,
      text: "Visit the repository hosting service with the cat logo. Find the most starred JavaScript framework repository.",
      hint: "It's where developers store code. The framework starts with 'R' and is made by Facebook.",
      answer: "react",
      url: "https://github.com"
    },
    {
      id: 5,
      text: "Navigate to the search engine that 'doesn't track you'. What's the name of their browser extension?",
      hint: "It's an alternative to Google with a duck mascot.",
      answer: "duckduckgo",
      url: "https://duckduckgo.com"
    }
  ]
};

export const Hunt = () => {
  const router = useRouter();
  const [currentClue, setCurrentClue] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get hunt data from router query or use mock data
  const huntData = router.query.huntData 
    ? JSON.parse(router.query.huntData as string)
    : mockHuntData;
  
  const query = (router.query.query as string) || "digital exploration";

  const isValidAnswer = (answer: string, expectedAnswer: string) => {
    const cleanAnswer = answer.toLowerCase().trim();
    const cleanExpected = expectedAnswer.toLowerCase().trim();
    
    // Check if the answer contains the expected answer
    // or if it's a URL containing the expected domain
    return cleanAnswer.includes(cleanExpected) || 
           cleanAnswer.includes(cleanExpected.replace(/\s+/g, ''));
  };

  const handleAnswer = async (answer: string) => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage("");
    
    // Simulate checking answer
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const currentClueData = huntData.clues[currentClue];
    const isCorrect = isValidAnswer(answer, currentClueData.answer);
    
    if (isCorrect) {
      // Show confetti for correct answer
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);
      
      // Wait a moment for confetti before proceeding
      setTimeout(() => {
        if (currentClue < huntData.clues.length - 1) {
          setCurrentClue(currentClue + 1);
        } else {
          // Hunt complete
          const endTime = Date.now();
          const totalTime = Math.floor((endTime - startTime) / 1000);
          const correctAnswers = newAnswers.filter((ans, idx) => 
            isValidAnswer(ans, huntData.clues[idx].answer)
          ).length;
          
          router.push({
            pathname: '/complete',
            query: {
              query,
              totalTime: totalTime.toString(),
              correctAnswers: correctAnswers.toString(),
              totalClues: huntData.clues.length.toString(),
              answers: JSON.stringify(newAnswers)
            }
          });
        }
      }, 1500);
    } else {
      // Show error state
      setIsError(true);
      setErrorMessage("That's not quite right. Try again!");
    }
    
    setIsLoading(false);
  };

  const currentClueData = huntData.clues[currentClue];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-forest flex flex-col relative"
    >
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      {/* Hint */}
      <div className="px-6 mb-8">
        <HintButton hint={currentClueData.hint} />
      </div>

      {/* Main Content */}
      <div className="flex-grow flex justify-center px-6">
        <div className="flex flex-col justify-center items-center w-full max-w-2xl text-center space-y-8 min-h-[calc(100vh-200px)]">
          <CompassStar size="md" className="mx-auto" />
          
          <motion.p 
            key={currentClue}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-foreground text-lg md:text-xl leading-relaxed font-serif"
          >
            {currentClueData.text}
          </motion.p>

          <div className="w-full max-w-md">
            <AnswerInput
              key={`${currentClue}-${isError}`} // Force re-render on error to trigger shake
              placeholder="enter your url here ..."
              onSubmit={handleAnswer}
              isLoading={isLoading}
              isError={isError}
              clearOnError={true}
            />
            
            <AnimatePresence>
              {errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-400 text-sm mt-3 font-serif italic"
                >
                  {errorMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <ProgressBar
            currentStep={currentClue + 1}
            totalSteps={huntData.clues.length}
            className="justify-center"
          />
          
          <AnimatePresence>
            {showConfetti && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="bg-accent/90 backdrop-blur-sm rounded-2xl px-8 py-4">
                  <p className="text-background font-serif text-xl">🎉 Correct!</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timer */}
      <div className="p-6">
        <div className="flex items-center text-foreground text-sm">
          <div className="w-3 h-3 bg-accent rounded-full mr-2" />
          <span>
            {Math.floor((Date.now() - startTime) / 1000 / 60).toString().padStart(2, '0')}:
            {Math.floor(((Date.now() - startTime) / 1000) % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};