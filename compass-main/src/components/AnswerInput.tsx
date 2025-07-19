import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AnswerInputProps {
  placeholder: string;
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const AnswerInput = ({ 
  placeholder, 
  onSubmit, 
  isLoading = false,
  className 
}: AnswerInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="relative bg-accent/20 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-accent-foreground text-lg">›</span>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none text-accent-foreground placeholder:text-accent-foreground/60 focus-visible:ring-0 text-lg"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!value.trim() || isLoading}
            className="bg-accent-foreground/20 hover:bg-accent-foreground/30 text-accent-foreground border-0 rounded-full p-2 h-8 w-8"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
};