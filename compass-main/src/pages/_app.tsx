import "@/index.css";
import type { AppProps } from "next/app";
import { HomeButton } from "@/components/HomeButton";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <HomeButton />
    </>
  );
}
