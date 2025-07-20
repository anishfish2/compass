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
    <img 
      src="/star.png" 
      alt="Compass Star"
      className={cn(sizeClasses[size], className)}
    />
  );
};