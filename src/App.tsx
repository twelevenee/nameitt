import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Reflect from "./pages/Reflect";
import Results from "./pages/Results";
import Patterns from "./pages/Patterns";
import Journal from "./pages/Journal";
import Stories from "./pages/Stories";
import SharedSummary from "./pages/SharedSummary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
