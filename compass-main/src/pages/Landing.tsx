import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { AnswerInput } from "@/components/AnswerInput";
import { TrailMap } from "@/components/TrailMap";


export const Landing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [angle, setAngle] = useState(0); // Current rotation
  const targetAngleRef = useRef(0);      // Target angle
  const compassRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const generateQuiz = async (query: string) => {
    try {
      setIsLoading(true);

      console.log("Generating quiz for query:", query);

      const response = await fetch("/api/generate_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: query }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();
      console.log("Generated quiz data:", data);

      // Navigate to hunt with the generated quiz data
      router.push({
        pathname: "/hunt",
        query: {
          query,
          quizData: JSON.stringify(data.collectedTexts),
        },
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      // Fallback to original behavior
      router.push({
        pathname: "/hunt",
        query: { query },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartHunt = async (query: string) => {
    await generateQuiz(query);
  };

 // Mouse tracking to update target angle
 useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    const compass = compassRef.current;
    if (!compass) return;


    const rect = compass.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;


    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;


    const target = Math.atan2(dy, dx) * (180 / Math.PI);
    targetAngleRef.current = target;
  };


  window.addEventListener("mousemove", handleMouseMove);
  return () => window.removeEventListener("mousemove", handleMouseMove);
}, []);


// Spring-like rotation animation toward target angle
useEffect(() => {
  let animationFrameId: number;
  let velocity = 0;


  const stiffness = 0.1;
  const damping = 0.8;


  const updateRotation = () => {
    const current = angle;
    const target = targetAngleRef.current;


    let diff = target - current;
    diff = ((diff + 180) % 360) - 180; // Normalize to [-180, 180]


    velocity += stiffness * diff;
    velocity *= damping;


    const newAngle = current + velocity;
    setAngle(newAngle);


    animationFrameId = requestAnimationFrame(updateRotation);
  };


  animationFrameId = requestAnimationFrame(updateRotation);
  return () => cancelAnimationFrame(animationFrameId);
}, [angle]);


return (
  <div className="relative min-h-screen bg-gradient-forest flex flex-col items-center justify-center p-6 overflow-hidden">
    <TrailMap />


    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center space-y-8 max-w-2xl mx-auto"
    >
      <div className="space-y-4">
        <div className="relative mx-auto w-fit" ref={compassRef}>
          <div
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "center center",
            }}
          >
            <CompassStar size="lg" />
          </div>
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
