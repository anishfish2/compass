
// components/HomeButton.tsx
import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeButtonProps {
  className?: string;
}

export const HomeButton = ({ className }: HomeButtonProps) => (
  <Link
    href="/"
    aria-label="Back to home"
    className={cn(
      "fixed bottom-6 right-6 z-50 bg-accent/80 backdrop-blur-sm",
      "hover:bg-accent text-accent-foreground shadow-md",
      "rounded-full p-3 transition-all",
      className
    )}
  >
    <Home className="h-5 w-5" />
  </Link>
);
