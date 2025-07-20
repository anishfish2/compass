// pages/_app.tsx
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient();

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* global UI */}
        <Toaster />
        <Sonner />
        {/* the actual page */}
        <Component {...pageProps} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
