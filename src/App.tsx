
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Plans from "./pages/Plans";
import Wallet from "./pages/Wallet";
import GameMoneyFalling from "./pages/GameMoneyFalling";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="plans" element={<Plans />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="game/money-falling" element={<GameMoneyFalling />} />
            <Route path="store" element={<div className="p-8 text-center">Store - Coming Soon!</div>} />
            <Route path="referral" element={<div className="p-8 text-center">Referral - Coming Soon!</div>} />
            <Route path="settings" element={<div className="p-8 text-center">Settings - Coming Soon!</div>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
