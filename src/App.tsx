import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "@/contexts/SessionContext";
import Layout from "@/components/Layout"; // Import the new Layout component
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider
import { I18nextProvider } from "react-i18next"; // Import I18nextProvider
import i18n from "./i18n"; // Import i18n configuration

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
import ClientRegistration from "./pages/ClientRegistration"; // New import

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <I18nextProvider i18n={i18n}>
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
                  {/* New Registration Routes */}
                  <Route path="/registration/clients" element={<ClientRegistration />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SessionContextProvider>
          </BrowserRouter>
        </TooltipProvider>
      </I18nextProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;