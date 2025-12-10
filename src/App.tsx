import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "@/contexts/SessionContext";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { CommandPalette } from "@/components/CommandPalette";

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
import History from "./pages/History";
import ClientsPage from "./pages/ClientsPage";
import TeamPage from "./pages/TeamPage";
import ServicesPage from "./pages/ServicesPage";
import ProductsPage from "./pages/ProductsPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import BlockedTimesPage from "./pages/BlockedTimesPage";
import ServicePackageRegistration from "./pages/ServicePackageRegistration";
import ServicePackageSales from "./pages/ServicePackageSales";
import SubscribersSummary from "./pages/SubscribersSummary";
import RevenueExtract from "./pages/RevenueExtract";
import ProjectedInvoices from "./pages/ProjectedInvoices";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import BalanceWithdrawal from "./pages/BalanceWithdrawal";
import ChargebackRequests from "./pages/ChargebackRequests";
import SubscriptionSettings from "./pages/SubscriptionSettings";
import StockMovements from "./pages/StockMovements";
import RealTimeInventory from "./pages/RealTimeInventory";
import PurchaseOrders from "./pages/PurchaseOrders";
import ReplenishmentAlerts from "./pages/ReplenishmentAlerts";
import BatchValidity from "./pages/BatchValidity";
import MultipleLocations from "./pages/MultipleLocations";
import FinancialDashboard from "./pages/FinancialDashboard";
import AccountsPayable from "./pages/AccountsPayable";
import AccountsReceivable from "./pages/AccountsReceivable";
import CashFlow from "./pages/CashFlow";
import CashRegisterReport from "./pages/CashRegisterReport";
import OccupancyRate from "./pages/OccupancyRate";
import AverageTicket from "./pages/AverageTicket";
import ClientFrequency from "./pages/ClientFrequency";
import WalkInClientReport from "./pages/WalkInClientReport";
import TeamGoals from "./pages/TeamGoals";
import CollaboratorsReport from "./pages/CollaboratorsReport";
import ProductsServicesReport from "./pages/ProductsServicesReport";
import ClientsReport from "./pages/ClientsReport";
import AdvancedStockReport from "./pages/AdvancedStockReport";
import BirthdayReport from "./pages/BirthdayReport";
import FirstAppointmentReport from "./pages/FirstAppointmentReport";
import LastAppointmentReport from "./pages/LastAppointmentReport";
import AppointmentBehaviorReport from "./pages/AppointmentBehaviorReport";
import APERModule from "./pages/APERModule";
import Sales from "./pages/Sales";
import SuppliersPage from "./pages/SuppliersPage";

const queryClient = new QueryClient();

const mockClients = [
  { type: "client" as const, id: "1", name: "João Silva" },
  { type: "client" as const, id: "2", name: "Maria Souza" },
];
const mockServices = [
  { type: "service" as const, id: "1", name: "Corte Masculino" },
  { type: "service" as const, id: "2", name: "Barba" },
];
const mockProducts = [
  { type: "product" as const, id: "1", name: "Pomada Modeladora" },
  { type: "product" as const, id: "2", name: "Shampoo" },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CommandPalette clients={mockClients} services={mockServices} products={mockProducts} />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <SessionContextProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/client-management" element={<ClientManagement />} />
                  <Route path="/financial" element={<Financial />} />
                  <Route path="/stock-control" element={<StockControl />} />
                  <Route path="/marketing-loyalty" element={<MarketingLoyalty />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/registration/clients" element={<ClientsPage />} />
                  <Route path="/registration/team" element={<TeamPage />} />
                  <Route path="/registration/services" element={<ServicesPage />} />
                  <Route path="/registration/products" element={<ProductsPage />} />
                  <Route path="/registration/payment-methods" element={<PaymentMethodsPage />} />
                  <Route path="/registration/blocked-times" element={<BlockedTimesPage />} />
                  <Route path="/registration/service-packages/registration" element={<ServicePackageRegistration />} />
                  <Route path="/registration/service-packages/sales" element={<ServicePackageSales />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/subscription-club/subscribers" element={<SubscribersSummary />} />
                  <Route path="/subscription-club/revenue" element={<RevenueExtract />} />
                  <Route path="/subscription-club/invoices" element={<ProjectedInvoices />} />
                  <Route path="/subscription-club/management" element={<SubscriptionManagement />} />
                  <Route path="/subscription-club/plans" element={<SubscriptionPlans />} />
                  <Route path="/subscription-club/balance" element={<BalanceWithdrawal />} />
                  <Route path="/subscription-club/chargebacks" element={<ChargebackRequests />} />
                  <Route path="/subscription-club/settings" element={<SubscriptionSettings />} />
                  <Route path="/stock-control/movements" element={<StockMovements />} />
                  <Route path="/stock-control/inventory" element={<RealTimeInventory />} />
                  <Route path="/stock-control/purchase-orders" element={<PurchaseOrders />} />
                  <Route path="/stock-control/suppliers" element={<SuppliersPage />} />
                  <Route path="/stock-control/alerts" element={<ReplenishmentAlerts />} />
                  <Route path="/stock-control/advanced-report" element={<AdvancedStockReport />} />
                  <Route path="/stock-control/batch-validity" element={<BatchValidity />} />
                  <Route path="/stock-control/locations" element={<MultipleLocations />} />
                  <Route path="/financial/dashboard" element={<FinancialDashboard />} />
                  <Route path="/financial/accounts-payable" element={<AccountsPayable />} />
                  <Route path="/financial/accounts-receivable" element={<AccountsReceivable />} />
                  <Route path="/financial/cash-flow" element={<CashFlow />} />
                  <Route path="/financial/cash-register-report" element={<CashRegisterReport />} />
                  <Route path="/dashboard/occupancy-rate" element={<OccupancyRate />} />
                  <Route path="/dashboard/average-ticket" element={<AverageTicket />} />
                  <Route path="/dashboard/client-frequency" element={<ClientFrequency />} />
                  <Route path="/dashboard/walk-in-report" element={<WalkInClientReport />} />
                  <Route path="/reports/team-goals" element={<TeamGoals />} />
                  <Route path="/reports/collaborators" element={<CollaboratorsReport />} />
                  <Route path="/reports/products-services" element={<ProductsServicesReport />} />
                  <Route path="/reports/clients" element={<ClientsReport />} />
                  <Route path="/reports/birthdays" element={<BirthdayReport />} />
                  <Route path="/reports/first-appointment" element={<FirstAppointmentReport />} />
                  <Route path="/reports/last-appointment" element={<LastAppointmentReport />} />
                  <Route path="/reports/appointment-behavior" element={<AppointmentBehaviorReport />} />
                  <Route path="/aper" element={<APERModule />} />
                </Route>
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
