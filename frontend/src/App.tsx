import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AppSidebar } from "@/components/layout/AppSidebar";

// Pages
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import RegisterPage from "./pages/RegisterPage";
import ReputationPage from "./pages/ReputationPage";
import FAQPage from "./pages/FAQPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import FeeCalculatorPage from "./pages/FeeCalculatorPage";
import WithdrawPage from "./pages/WithdrawPage";
import StatsPage from "./pages/StatsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Marketing Layout (with header/footer)
function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}

// App Layout (with sidebar)
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 ml-[260px] p-6 lg:p-8 transition-all duration-200">
        {children}
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Marketing Pages */}
          <Route path="/" element={<MarketingLayout><LandingPage /></MarketingLayout>} />
          <Route path="/how-it-works" element={<MarketingLayout><HowItWorksPage /></MarketingLayout>} />
          <Route path="/faq" element={<MarketingLayout><FAQPage /></MarketingLayout>} />
          
          {/* App Pages */}
          <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/register" element={<AppLayout><RegisterPage /></AppLayout>} />
          <Route path="/reputation" element={<AppLayout><ReputationPage /></AppLayout>} />
          <Route path="/fees" element={<AppLayout><FeeCalculatorPage /></AppLayout>} />
          <Route path="/withdraw" element={<AppLayout><WithdrawPage /></AppLayout>} />
          <Route path="/history" element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/stats" element={<AppLayout><StatsPage /></AppLayout>} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
