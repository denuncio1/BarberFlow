import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, History, Users, DollarSign, Package, TrendingUp, BarChartBig, LayoutDashboard, PlusCircle, ChevronDown, UsersRound, Scissors, Box, CreditCard, TimerOff, PackageCheck, ShoppingCart, ArrowUpDown, Warehouse, ShoppingBag, Bell, FileText, Clock, MapPin, ArrowDownCircle, ArrowUpCircle, TrendingUpDown, TrendingDown, CreditCard as SubscriptionIcon, Receipt, Calendar, Settings, FileBarChart, Target, Cake, UserPlus, PieChart, Brain, Truck } from 'lucide-react'; // Added icons for financial
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; // Import Collapsible components
import { useTranslation } from 'react-i18next'; // Import useTranslation

const navItems = [
  { name: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'appointments', href: '/appointments', icon: CalendarDays },
  { name: 'history', href: '/history', icon: History },
  { name: 'aper_module', href: '/aper', icon: Brain }, // A.P.E.R. Module - Menu Principal
  {
    name: 'registration', // New main category
    icon: PlusCircle,
    children: [
      { name: 'clients', href: '/registration/clients', icon: Users }, // Nested item
      { name: 'suppliers', href: '/stock-control/suppliers', icon: Truck }, // Fornecedores
      { name: 'team', href: '/registration/team', icon: UsersRound }, // New nested item for Team
      { name: 'services', href: '/registration/services', icon: Scissors }, // New nested item for Services
      { name: 'products', href: '/registration/products', icon: Box }, // New nested item for Products
      { name: 'payment_methods', href: '/registration/payment-methods', icon: CreditCard }, // New nested item for Payment Methods
      { name: 'blocked_times', href: '/registration/blocked-times', icon: TimerOff }, // New nested item for Blocked Times
      {
        name: 'service_packages',
        icon: PackageCheck,
        children: [
          { name: 'package_registration', href: '/registration/service-packages/registration', icon: PlusCircle },
          { name: 'package_sales', href: '/registration/service-packages/sales', icon: ShoppingCart },
        ],
      },
    ],
  },
  { name: 'client_management', href: '/client-management', icon: Users },
  {
    name: 'financial',
    icon: DollarSign,
    children: [
      { name: 'financial_dashboard', href: '/financial/dashboard', icon: LayoutDashboard },
      { name: 'accounts_payable', href: '/financial/accounts-payable', icon: ArrowDownCircle },
      { name: 'accounts_receivable', href: '/financial/accounts-receivable', icon: ArrowUpCircle },
      { name: 'cash_flow', href: '/financial/cash-flow', icon: TrendingUpDown },
      { name: 'cash_register_report', href: '/financial/cash-register-report', icon: FileBarChart },
    ],
  },
  {
    name: 'stock_control',
    icon: Package,
    children: [
      { name: 'stock_movements', href: '/stock-control/movements', icon: ArrowUpDown },
      { name: 'real_time_inventory', href: '/stock-control/inventory', icon: Warehouse },
      { name: 'purchase_orders', href: '/stock-control/purchase-orders', icon: ShoppingBag },
      { name: 'replenishment_alerts', href: '/stock-control/alerts', icon: Bell },
      { name: 'advanced_stock_report', href: '/stock-control/advanced-report', icon: BarChartBig },
      { name: 'batch_validity', href: '/stock-control/batch-validity', icon: Clock },
      { name: 'multiple_locations', href: '/stock-control/locations', icon: MapPin },
    ],
  },
  {
    name: 'subscription_club',
    icon: SubscriptionIcon,
    children: [
      { name: 'subscription_plans', href: '/subscription-club/plans', icon: Package },
      { name: 'subscribers_summary', href: '/subscription-club/subscribers', icon: Users },
      { name: 'revenue_extract', href: '/subscription-club/revenue', icon: Receipt },
      { name: 'projected_invoices', href: '/subscription-club/invoices', icon: Calendar },
      { name: 'subscription_management', href: '/subscription-club/management', icon: CreditCard },
      { name: 'balance_withdrawal', href: '/subscription-club/balance', icon: DollarSign },
      { name: 'chargeback_requests', href: '/subscription-club/chargebacks', icon: TrendingDown },
      { name: 'subscription_ltv_report', href: '/subscription-club/ltv', icon: PieChart },
      { name: 'subscription_settings', href: '/subscription-club/settings', icon: Settings },
    ],
  },
  { name: 'marketing_loyalty', href: '/marketing-loyalty', icon: TrendingUp },
  {
    name: 'reports',
    icon: BarChartBig,
    children: [
      { name: 'reports_overview', href: '/reports', icon: FileBarChart },
      { name: 'team_goals', href: '/reports/team-goals', icon: Target },
      { name: 'collaborators_report', href: '/reports/collaborators', icon: UsersRound },
      { name: 'products_services_report', href: '/reports/products-services', icon: Package },
      { name: 'clients_report', href: '/reports/clients', icon: Users },
      { name: 'birthday_report', href: '/reports/birthdays', icon: Cake },
      { name: 'first_appointment_report', href: '/reports/first-appointment', icon: UserPlus },
      { name: 'last_appointment_report', href: '/reports/last-appointment', icon: Clock },
      { name: 'appointment_behavior_report', href: '/reports/appointment-behavior', icon: TrendingUp },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <aside
      className="w-64 bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)] border-r border-[var(--sidebar-border)] p-4 flex flex-col rounded-xl shadow-xl transition-all duration-500"
      style={{ background: 'var(--sidebar-background)' }}
    >
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => (
            item.children ? (
              <Collapsible key={item.name} defaultOpen={location.pathname.startsWith('/' + item.children[0].href.split('/')[1])}> {/* Open if any child is active */}
                <CollapsibleTrigger className={cn(
                  "flex items-center justify-between w-full space-x-3 p-2 rounded-md transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  location.pathname.startsWith('/' + item.children[0].href.split('/')[1]) // Check if any child route is active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" // Highlight parent if child is active
                    : ""
                )}>
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span>{t(item.name)}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4 mt-2 space-y-1">
                  {item.children.map((child) => (
                    child.children ? (
                      <Collapsible key={child.name} defaultOpen={false}>
                        <CollapsibleTrigger className={cn(
                          "flex items-center justify-between w-full space-x-3 p-2 rounded-lg transition-all duration-300",
                          "hover:bg-gradient-to-r hover:from-blue-100 hover:via-purple-100 hover:to-green-100 hover:scale-[1.03] hover:shadow",
                        )}>
                          <div className="flex items-center space-x-3">
                            <child.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                            <span>{t(child.name)}</span>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-1">
                          {child.children.map((subChild) => (
                            <li key={subChild.name}>
                              <Link
                                to={subChild.href}
                                className={cn(
                                  "flex items-center space-x-3 p-2 rounded-lg transition-all duration-300",
                                  location.pathname === subChild.href
                                    ? "bg-gradient-to-r from-blue-100 via-purple-100 to-green-100 text-[var(--sidebar-primary-foreground)] scale-[1.04] shadow-sm"
                                    : "hover:bg-gradient-to-r hover:from-blue-50 hover:via-purple-50 hover:to-green-50 hover:scale-[1.03] hover:shadow-sm"
                                )}
                              >
                                <subChild.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-sm">{t(subChild.name)}</span>
                              </Link>
                            </li>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <li key={child.name}>
                        <Link
                          to={child.href}
                          className={cn(
                            "flex items-center space-x-3 p-2 rounded-md transition-colors",
                            location.pathname === child.href
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <child.icon className="h-5 w-5" />
                          <span>{t(child.name)}</span>
                        </Link>
                      </li>
                    )
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 p-2 rounded-lg transition-all duration-300",
                    location.pathname === item.href
                      ? "bg-gradient-to-r from-blue-300 via-purple-300 to-green-300 text-[var(--sidebar-primary-foreground)] scale-[1.04] shadow-lg"
                      : "hover:bg-gradient-to-r hover:from-blue-200 hover:via-purple-200 hover:to-green-200 hover:scale-[1.03] hover:shadow-lg hover:text-[var(--sidebar-accent-foreground)]"
                  )}
                >
                  <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  <span>{t(item.name)}</span>
                </Link>
              </li>
            )
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;