import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { ProgressBar } from "@/components/ProgressBar";
import { AnswerInput } from "@/components/AnswerInput";
import { HintButton } from "@/components/HintButton";

// Mock hunt data
const huntData = {
  clues: [
    {
      id: 1,
      text: "The pandemic changed everything about work. Visit the company that wrote 'Remote: Office Not Required' and find their latest blog post about remote work.",
      hint: "Look for a company founded by the creators of Ruby on Rails. They're known for their project management tools.",
      answer: "basecamp"
    },
    {
      id: 2,
      text: "Find the social media platform where professionals connect. Navigate to the profile of the CEO of Tesla and SpaceX.",
      hint: "Think blue and white logo, business networking, professional profiles.",
      answer: "linkedin"
    },
    {
      id: 3,
      text: "Discover the video platform where a Swedish gamer became the most subscribed individual creator. What's his real first name?",
      hint: "He's known for playing Minecraft and has over 110 million subscribers.",
      answer: "felix"
    },
    {
      id: 4,
      text: "Visit the repository hosting service with the cat logo. Find the most starred JavaScript framework repository.",
      hint: "It's where developers store code. The framework starts with 'R' and is made by Facebook.",
      answer: "react"
    },
    {
      id: 5,
      text: "Navigate to the search engine that 'doesn't track you'. What's the name of their browser extension?",
      hint: "It's an alternative to Google with a duck mascot.",
      answer: "duckduckgo"
    }
  ]
};

export const Hunt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentClue, setCurrentClue] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);

  const query = location.state?.query || "remote work tools";

  const handleAnswer = async (answer: string) => {
    setIsLoading(true);
    
    // Simulate checking answer
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    
    if (currentClue < huntData.clues.length - 1) {
      setCurrentClue(currentClue + 1);
    } else {
      // Hunt complete
      const endTime = Date.now();
      const totalTime = Math.floor((endTime - startTime) / 1000);
      const correctAnswers = newAnswers.filter((ans, idx) => 
        ans.toLowerCase().includes(huntData.clues[idx].answer.toLowerCase())
      ).length;
      
      navigate("/complete", {
        state: {
          query,
          totalTime,
          correctAnswers,
          totalClues: huntData.clues.length,
          answers: newAnswers
        }
      });
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
      className="min-h-screen bg-gradient-forest flex flex-col"
    >

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
            placeholder="enter your url here ..."
            onSubmit={handleAnswer}
            isLoading={isLoading}
          />

          <ProgressBar
            currentStep={currentClue + 1}
            totalSteps={huntData.clues.length}
            className="justify-center"
          />
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