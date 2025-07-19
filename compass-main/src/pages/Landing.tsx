import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { AnswerInput } from "@/components/AnswerInput";

export const Landing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleStartHunt = async (query: string) => {
    setIsLoading(true);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate("/hunt", { state: { query } });
  };

  return (
    <div className="min-h-screen bg-gradient-forest flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8 max-w-2xl mx-auto"
      >
        <div className="space-y-4">
          <CompassStar size="lg" className="mx-auto" />
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground">
              compass
            </h1>
            <p className="text-foreground/80 font-serif italic text-lg">
              your digital cartographer
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <AnswerInput
            placeholder="what would you like to explore today?"
            onSubmit={handleStartHunt}
            isLoading={isLoading}
            className="max-w-lg mx-auto"
          />
          
          <p className="text-accent text-sm italic">
            generate my hunt!
          </p>
        </div>
      </motion.div>
    </div>
  );
};