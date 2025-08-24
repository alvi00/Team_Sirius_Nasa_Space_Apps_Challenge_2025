import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import Landing from "./pages/Landing";
import Results from "./pages/Results";
import PaperDetail from "./pages/PaperDetail";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import DatasetExplorer from "./pages/DatasetExplorer";
import ComparativeAnalysis from "./pages/ComparativeAnalysis";
import AdminPlayground from "./pages/AdminPlayground";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/search" element={<Results />} />
            <Route path="/paper/:id" element={<PaperDetail />} />
            <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
            <Route path="/datasets" element={<DatasetExplorer />} />
            <Route path="/compare" element={<ComparativeAnalysis />} />
            <Route path="/admin" element={<AdminPlayground />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
