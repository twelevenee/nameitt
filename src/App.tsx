import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import Reflect from "./pages/Reflect";
import Results from "./pages/Results";
import Patterns from "./pages/Patterns";
import Journal from "./pages/Journal";
import Stories from "./pages/Stories";
import SharedSummary from "./pages/SharedSummary";
import NotFound from "./pages/NotFound";
import Companion from "./components/Companion";

const queryClient = new QueryClient();

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [location.pathname]);

  return (
    <div className={`transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="texture-overlay" />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/reflect" element={<Reflect />} />
            <Route path="/results" element={<Results />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/my-journal" element={<Journal />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/shared/:id" element={<SharedSummary />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
        <Companion />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
