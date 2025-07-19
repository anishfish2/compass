import { cn } from "@/lib/utils";

interface CompassStarProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const CompassStar = ({ className, size = "md" }: CompassStarProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="w-full h-full text-compass-star"
      >
        <path
          d="M24 2L26.4 12.6L37 8L32.4 18.6L43 21L32.4 29.4L37 40L26.4 35.4L24 46L21.6 35.4L11 40L15.6 29.4L5 21L15.6 18.6L11 8L21.6 12.6L24 2Z"
          fill="currentColor"
          className="drop-shadow-sm"
        />
      </svg>
    </div>
  );
};