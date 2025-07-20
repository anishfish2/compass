import { CompassStar } from "@/components/CompassStar";
import { useState, useCallback, CSSProperties } from "react";

const MAX_STARS = 18;
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

interface StarProps { id: number }

const Star = ({ id }: StarProps) => {
  const makeVars = useCallback(() => {
    const size = Math.floor(rand(30, 60));      // 30-60 px
    const startRot = rand(0, 360);
    const dx = rand(-1200, 1200);               // px to drift (off‑screen)
    const dy = rand(-800, 800);
    const dur = rand(12, 20);                   // 12-20 s
    const spinDur = dur * 2;                    // 24-40 s
    const opacity = rand(0.1, 0.3);
    const left = rand(0, 100);                  // vw%
    const top = rand(0, 100);                   // vh%

    return { size, startRot, dx, dy, dur, spinDur, opacity, left, top };
  }, []);

  const [vars, setVars] = useState(makeVars);

  const handleIter = () => setVars(makeVars());

  const style: CSSProperties & {
    "--dx": string;
    "--dy": string;
    "--start": string;
  } = {
    top: `${vars.top}vh`,
    left: `${vars.left}vw`,
    width: vars.size,
    height: vars.size,
    opacity: vars.opacity,
    filter: "blur(0.5px)",
    "--dx": `${vars.dx}px`,
    "--dy": `${vars.dy}px`,
    "--start": `${vars.startRot}deg`,
    animation: `drift ${vars.dur}s linear infinite,
                spin ${vars.spinDur}s linear infinite`,
  };

  return (
    <div
      key={id}
      onAnimationIteration={handleIter}
      className="absolute pointer-events-none will-change-transform"
      style={style}
    >
      <CompassStar className="text-accent w-full h-full" />
    </div>
  );
};

export const BackgroundStars = () => (
  <>
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <Star key={i} id={i} />
      ))}
    </div>

    {/* global keyframes (once) */}
    <style jsx global>{`
      @keyframes drift {
        from   { transform: translate(0, 0) rotate(var(--start)); }
        to     { transform: translate(var(--dx), var(--dy)) rotate(var(--start)); }
      }
      @keyframes spin {
        to     { transform: rotate(calc(var(--start) + 360deg)); }
      }
    `}</style>
  </>
);
