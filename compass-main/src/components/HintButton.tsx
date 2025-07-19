import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HintButtonProps {
  hint: string;
  className?: string;
}

export const HintButton = ({ hint, className }: HintButtonProps) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={cn("text-right", className)}>
      {!isRevealed ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsRevealed(true)}
          className="text-accent hover:text-accent-foreground hover:bg-accent/20 transition-colors"
        >
          <Lightbulb className="w-4 h-4 mr-1" />
          hint?
        </Button>
      ) : (
        <div className="text-sm text-accent-foreground bg-accent/10 rounded-lg p-3 max-w-sm ml-auto">
          {hint}
        </div>
      )}
    </div>
  );
};