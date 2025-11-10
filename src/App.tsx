import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "@/contexts/SessionContext"; // Import SessionContextProvider
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Import Login page
import Dashboard from "./pages/Dashboard"; // Import Dashboard page
import ClientManagement from "./pages/ClientManagement";
import Financial from "./pages/Financial";
import StockControl from "./pages/StockControl";
import MarketingLoyalty from "./pages/MarketingLoyalty";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Wrap routes with SessionContextProvider */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/client-management" element={<ClientManagement />} />
            <Route path="/financial" element={<Financial />} />
            <Route path="/stock-control" element={<StockControl />} />
            <Route path="/marketing-loyalty" element={<MarketingLoyalty />} />
            <Route path="/reports" element={<Reports />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;