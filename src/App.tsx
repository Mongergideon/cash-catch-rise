
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Plans from "./pages/Plans";
import Wallet from "./pages/Wallet";
import PaymentVerification from "./pages/PaymentVerification";
import GameMoneyFalling from "./pages/GameMoneyFalling";
import CoinRunner from "./pages/CoinRunner";
import SpinWheel from "./pages/SpinWheel";
import MemoryFlip from "./pages/MemoryFlip";
import Runner3D from "./pages/Runner3D";
import Ludo from "./pages/Ludo";
import Blackjack from "./pages/Blackjack";
import SnakeLeader from "./pages/SnakeLeader";
import Store from "./pages/Store";
import Referral from "./pages/Referral";
import Notifications from "./pages/Notifications";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import SuccessfulWithdrawals from "./pages/SuccessfulWithdrawals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminAuth />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/payment-verification" element={<PaymentVerification />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="plans" element={<Plans />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="game/money-falling" element={<GameMoneyFalling />} />
              <Route path="game/coin-runner" element={<CoinRunner />} />
              <Route path="game/spin-wheel" element={<SpinWheel />} />
              <Route path="game/memory-flip" element={<MemoryFlip />} />
              <Route path="game/runner-3d" element={<Runner3D />} />
              <Route path="game/ludo" element={<Ludo />} />
              <Route path="game/blackjack" element={<Blackjack />} />
              <Route path="game/snake-leader" element={<SnakeLeader />} />
              <Route path="store" element={<Store />} />
              <Route path="referral" element={<Referral />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="settings" element={<Settings />} />
              <Route path="successful-withdrawals" element={<SuccessfulWithdrawals />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
