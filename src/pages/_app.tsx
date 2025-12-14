import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AppProvider } from "@/contexts/AppContext";
import { BottomNav } from "@/components/BottomNav";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="pb-20">
          <Component {...pageProps} />
        </div>
        <BottomNav />
      </AppProvider>
    </ThemeProvider>
  );
}