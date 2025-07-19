import { useLocation, useNavigate } from "react-router-dom";
import { RotateCcw, Share, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { Button } from "@/components/ui/button";

export const Complete = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    query = "remote work tools",
    totalTime = 0,
    correctAnswers = 0,
    totalClues = 5,
    answers = []
  } = location.state || {};

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} minutes ${secs} seconds`;
  };

  const accuracy = Math.round((correctAnswers / totalClues) * 100) / 100;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-forest flex flex-col items-center justify-center p-6"
    >
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Celebration */}
        <div className="space-y-4">
          <div className="text-4xl">🎉</div>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">
            Congratulations, digital explorer!
          </h1>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="text-foreground/90 space-y-2 md:text-right">
            <p className="text-lg">You've successfully</p>
            <p>navigated the world of</p>
            <p>{query} and</p>
            <p>discovered the essentials</p>
            <p>of digital nomad life.</p>
          </div>

          <div className="bg-accent/20 rounded-2xl p-6 backdrop-blur-sm min-w-[280px]">
            <h2 className="text-accent-foreground font-serif text-xl mb-4">
              Your Stats:
            </h2>
            <div className="space-y-3 text-accent-foreground">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏱️</span>
                <span>Time: {formatTime(totalTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span>Accuracy: {correctAnswers}/{totalClues} correct on first try</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <span>Achievement: "Remote Work Navigator"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-foreground hover:text-accent hover:bg-accent/20 flex flex-col items-center gap-1"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-xs">restart</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Mock share functionality
              navigator.share?.({
                title: "I completed a Compass hunt!",
                text: `Just finished exploring ${query} in ${formatTime(totalTime)}!`,
                url: window.location.origin
              }).catch(() => {
                // Fallback for browsers without Web Share API
                navigator.clipboard?.writeText(
                  `I just completed a digital scavenger hunt about ${query} in ${formatTime(totalTime)}! Check it out at ${window.location.origin}`
                );
              });
            }}
            className="text-foreground hover:text-accent hover:bg-accent/20 flex flex-col items-center gap-1"
          >
            <Share className="w-5 h-5" />
            <span className="text-xs">share</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-foreground hover:text-accent hover:bg-accent/20 flex flex-col items-center gap-1"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs">new hunt</span>
          </Button>
        </div>

        {/* Logo */}
        <div className="pt-8 space-y-2">
          <CompassStar size="md" className="mx-auto" />
          <div>
            <h2 className="text-2xl font-serif text-foreground">compass</h2>
            <p className="text-foreground/70 font-serif italic text-sm">
              your digital cartographer
            </p>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="absolute bottom-6 left-6">
        <div className="flex items-center text-foreground text-sm">
          <div className="w-3 h-3 bg-accent rounded-full mr-2" />
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>
    </motion.div>
  );
};