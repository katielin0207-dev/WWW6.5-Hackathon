import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DreamProvider } from "@/lib/dream/DreamProvider";
import DreamLanding from "./pages/DreamLanding";
import DreamCreate from "./pages/DreamCreate";
import DreamWorld from "./pages/DreamWorld";
import DreamDiary from "./pages/DreamDiary";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DreamProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dream" replace />} />
            <Route path="/dream" element={<DreamLanding />} />
            <Route path="/dream/create" element={<DreamCreate />} />
            <Route path="/dream/world" element={<DreamWorld />} />
            <Route path="/dream/diary" element={<DreamDiary />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DreamProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
