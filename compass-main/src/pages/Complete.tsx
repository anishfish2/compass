import { useLocation, useNavigate } from "react-router-dom";
import { RotateCcw, Share, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

export const Complete = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    query = "remote work tools",
    totalTime = 0,
    correctAnswers = 0,
    totalClues = 5,
    answers = [],
  } = location.state || {};

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} minutes ${secs} seconds`;
  };

  const accuracy = Math.round((correctAnswers / totalClues) * 100) / 100;

  const handleScreenshotShare = async () => {
    try {
      const element = document.body;
      const canvas = await html2canvas(element, {
        useCORS: true,
        scrollY: -window.scrollY, // capture fixed position elements
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "compass-screenshot.png";
      link.click();
    } catch (error) {
      console.error("Failed to take screenshot:", error);
    }
  };

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
          <h1 className="text-3xl md:text-4xl font-serif italic text-foreground">
            congratulations!
          </h1>
        </div>

        {/* Content */}
        <div className="flex justify-center">
          <div className="bg-accent/20 rounded-2xl p-6 backdrop-blur-sm min-w-[280px] text-center">
            <h2 className="text-foreground/70 font-serif text-xl mb-4">
              your stats:
            </h2>
            <div className="space-y-3 text-foreground/70">
              <div className="flex items-center justify-center gap-2 font-serif">
                <span className="text-lg">⏱️</span>
                <span>time: {formatTime(totalTime)}</span>
              </div>
              <div className="flex items-center justify-center gap-2 font-serif">
                <span className="text-lg">🎯</span>
                <span>
                  accuracy: {correctAnswers}/{totalClues} correct on first try
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 font-serif">
                <span className="text-lg">🏆</span>
                <span>achievement: {query} navigator</span>
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
            onClick={handleScreenshotShare}
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
