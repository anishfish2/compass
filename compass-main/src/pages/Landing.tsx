import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { AnswerInput } from "@/components/AnswerInput";

export const Landing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rotation, setRotation] = useState(0);
  const compassRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleStartHunt = async (query: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate("/hunt", { state: { query } });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const compass = compassRef.current;
      if (!compass) return;

      const rect = compass.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      setRotation(angle);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-forest flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8 max-w-2xl mx-auto"
      >
        <div className="space-y-4">
          {/* Compass stays in place but rotates */}
          <div className="mx-auto" ref={compassRef} style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.1s ease-out" }}>
            <CompassStar size="lg" />
          </div>
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
            className="max-w-4xl mx-auto placeholder:text-accent placeholder:text-sm placeholder:italic"
          />

          <p className="text-accent text-lg italic font-serif">
            generate my hunt!
          </p>
        </div>
      </motion.div>
    </div>
  );
};
