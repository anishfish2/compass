import { useRouter } from "next/router";
import { RotateCcw, Share, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { BackgroundStars } from "@/components/BackgroundStars";

const MountainBackground = () => {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full h-[28vh] z-0 pointer-events-none"
      viewBox="0 0 1440 440"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="mountainFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d="M0 230 Q 360 90 720 230 T 1440 230 V440 H0 Z"
        fill="url(#mountainFade)"
        className="text-foreground"
      />
      <path
        d="M0 270 Q 360 120 720 270 T 1440 270 V440 H0 Z"
        fill="currentColor"
        opacity={0.1}
      />
      <path
        d="M0 310 Q 360 160 720 310 T 1440 310 V480 H0 Z"
        fill="currentColor"
        opacity={0.15}
      />
      <path
        d="M0 350 Q 360 200 720 350 T 1440 350 V480 H0 Z"
        fill="currentColor"
        opacity={0.2}
      />
    </svg>
  );
};

export const Complete = () => {
  const router = useRouter();

  const query = (router.query.query as string) || "remote work tools";
  const totalTime = parseInt((router.query.totalTime as string) || "0");
  const correctAnswers = parseInt(
    (router.query.correctAnswers as string) || "0"
  );
  const totalClues = parseInt((router.query.totalClues as string) || "5");
  const answers = router.query.answers
    ? JSON.parse(router.query.answers as string)
    : [];

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} minutes ${secs} seconds`;
  };

  const handleScreenshotShare = async () => {
    try {
      const element = document.body;
      const canvas = await html2canvas(element, {
        useCORS: true,
        // scrollY: -window.scrollY,
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
      className="relative min-h-screen bg-gradient-forest flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      <MountainBackground />
      <BackgroundStars />

      <div className="max-w-2xl mx-auto text-center space-y-8 z-10 translate-y-[-9vh]">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif italic text-foreground">
            congratulations!
          </h1>
        </div>

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

        <div className="flex items-center justify-center gap-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
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
            onClick={() => router.push("/")}
            className="text-foreground hover:text-accent hover:bg-accent/20 flex flex-col items-center gap-1"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs">new hunt</span>
          </Button>
        </div>

        <div className="pt-8 space-y-2">
          <CompassStar size="lg" className="mx-auto" />
          <div>
            <h2 className="text-2xl font-serif text-foreground">compass</h2>
            <p className="text-foreground/70 font-serif italic text-base">
              your digital cartographer
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10">
        <div className="flex items-center text-foreground text-sm">
          <div className="w-3 h-3 bg-accent rounded-full mr-2" />
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>
    </motion.div>
  );
};