import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "@/contexts/SessionContext";
import Layout from "@/components/Layout"; // Import the new Layout component

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientManagement from "./pages/ClientManagement";
import Financial from "./pages/Financial";
import StockControl from "./pages/StockControl";
import MarketingLoyalty from "./pages/MarketingLoyalty";
import Reports from "./pages/Reports";
import Appointments from "./pages/Appointments";
import History from "./pages/History"; // Import the new History page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            {/* Rotas autenticadas usam o Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/history" element={<History />} /> {/* New route for History */}
              <Route path="/client-management" element={<ClientManagement />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/stock-control" element={<StockControl />} />
              <Route path="/marketing-loyalty" element={<MarketingLoyalty />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;