import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { CompassStar } from "@/components/CompassStar";
import { AnswerInput } from "@/components/AnswerInput";
import { TrailMap } from "@/components/TrailMap";
import { Button } from "@/components/ui/button";

export const Landing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [angle, setAngle] = useState(0);
  const targetAngleRef = useRef(0);
  const compassRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleStartNewHunt = () => {
    router.push("/Design");
  };

  const handleShareableLink = async (link: string) => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      // Validate URL format first
      if (!link.trim()) {
        setError("Please enter a hunt link");
        return;
      }

      // Add protocol if missing
      let urlString = link.trim();
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'https://' + urlString;
      }

      let url;
      try {
        url = new URL(urlString);
      } catch (urlError) {
        setError("Please enter a valid URL");
        return;
      }
      
      // Parse the shareable link to extract hunt data
      const huntId = url.searchParams.get("huntId");
      
      if (!huntId) {
        setError("Invalid hunt link - missing hunt ID");
        return;
      }

      // Navigate to the hunt with the shared data
      router.push(`/hunt?huntId=${huntId}`);
      
    } catch (error) {
      console.error("Error loading shared hunt:", error);
      setError("An unexpected error occurred - please try again");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error when user starts a new submission
  const handleShareableLinkWrapper = async (link: string) => {
    // Clear any existing error when user tries again
    if (error) {
      setError(null);
    }
    await handleShareableLink(link);
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
      diff = ((diff + 180) % 360) - 180;

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
          <p className="text-foreground text-lg font-serif italic leading-relaxed max-w-lg mx-auto">
            Create and share digital scavenger hunts that guide explorers 
            through curated web destinations with clues and challenges.
          </p>

          <div className="space-y-4">
            <Button
              onClick={handleStartNewHunt}
              className="w-full max-w-md mx-auto bg-accent hover:bg-accent/80 text-background font-serif italic text-lg py-6 rounded-2xl"
              disabled={isLoading}
            >
              Create New Hunt
            </Button>

            <div className="relative">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1 h-px bg-foreground/20"></div>
                <span className="text-foreground/60 text-sm font-serif italic">or</span>
                <div className="flex-1 h-px bg-foreground/20"></div>
              </div>

              <div className="space-y-2">
                <AnswerInput
                  placeholder="paste a shareable hunt link here..."
                  onSubmit={handleShareableLinkWrapper}
                  isLoading={isLoading}
                  className="max-w-md mx-auto text-base placeholder:text-foreground/50 placeholder:text-md placeholder:italic placeholder:font-serif font-serif"
                />
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm font-serif italic max-w-md mx-auto"
                  >
                    {error}
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};