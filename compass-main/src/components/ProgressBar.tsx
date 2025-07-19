import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export const ProgressBar = ({ currentStep, totalSteps, className }: ProgressBarProps) => {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <span className="text-sm text-muted-foreground">progress:</span>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              i < currentStep
                ? "bg-accent shadow-sm"
                : "bg-muted border border-border"
            )}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        [{currentStep}/{totalSteps}]
      </span>
    </div>
  );
};