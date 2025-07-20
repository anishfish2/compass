import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <form onSubmit={handleSubmit} className={cn("relative", className)} style={{ width: '100%', maxWidth: 'none' }}>
      <style>{`
        form { max-width: none !important; width: 600px !important; }
      `}</style>
      <div className="relative bg-accent/20 rounded-2xl p-8 backdrop-blur-sm min-h-[80px] w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="text-accent-foreground text-lg">›</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-accent text-sm italic font-serif placeholder:text-accent placeholder:italic focus:ring-0 focus:outline-none focus:border-none"
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