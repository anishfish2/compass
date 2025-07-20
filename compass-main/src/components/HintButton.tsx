// HintButton.tsx
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HintButtonProps {
  hint?: string;          // undefined → show “hint?” button
  onClick: () => void;
  className?: string;
}

export const HintButton = ({ hint, onClick, className }: HintButtonProps) => {
  return (
    <div className={cn("w-full text-center", className)}>
      {hint === undefined ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="text-accent hover:text-accent-foreground hover:bg-accent/20 transition-colors pr-6"
        >
          <Lightbulb className="w-4 h-4" />hint?
        </Button>
      ) : (
        <button
          onClick={onClick}
          className="cursor-pointer text-sm text-accent bg-accent/10 rounded-lg p-3 max-w-sm mx-auto mt-4 select-none"
        >
          {hint}
        </button>
      )}
    </div>
  );
};
