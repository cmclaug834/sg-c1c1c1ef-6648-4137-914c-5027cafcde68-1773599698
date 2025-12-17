import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { BottomNav } from "@/components/BottomNav";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Show BottomNav on these pages
  const showBottomNav = 
    router.pathname === "/tracks" ||
    router.pathname.startsWith("/track/") ||
    router.pathname === "/inspections" ||
    router.pathname.startsWith("/inspection/") ||
    router.pathname.startsWith("/reorder") ||
    router.pathname.startsWith("/settings");

  return (
    <ThemeProvider>
      <AppProvider>
        <Component {...pageProps} />
        {showBottomNav && <BottomNav />}
      </AppProvider>
    </ThemeProvider>
  );
}