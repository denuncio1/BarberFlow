"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, History, Users, DollarSign, Package, TrendingUp, BarChartBig, LayoutDashboard, PlusCircle, ChevronDown, UsersRound, Scissors, Box, CreditCard, TimerOff } from 'lucide-react'; // Added TimerOff for Blocked Times icon
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; // Import Collapsible components
import { useTranslation } from 'react-i18next'; // Import useTranslation

const navItems = [
  { name: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'appointments', href: '/appointments', icon: CalendarDays },
  { name: 'history', href: '/history', icon: History },
  {
    name: 'registration', // New main category
    icon: PlusCircle,
    children: [
      { name: 'clients', href: '/registration/clients', icon: Users }, // Nested item
      { name: 'team', href: '/registration/team', icon: UsersRound }, // New nested item for Team
      { name: 'services', href: '/registration/services', icon: Scissors }, // New nested item for Services
      { name: 'products', href: '/registration/products', icon: Box }, // New nested item for Products
      { name: 'payment_methods', href: '/registration/payment-methods', icon: CreditCard }, // New nested item for Payment Methods
      { name: 'blocked_times', href: '/registration/blocked-times', icon: TimerOff }, // New nested item for Blocked Times
    ],
  },
  { name: 'client_management', href: '/client-management', icon: Users },
  { name: 'financial', href: '/financial', icon: DollarSign },
  { name: 'stock_control', href: '/stock-control', icon: Package },
  { name: 'marketing_loyalty', href: '/marketing-loyalty', icon: TrendingUp },
  { name: 'reports', href: '/reports', icon: BarChartBig },
];

const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4 flex flex-col">
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
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 p-2 rounded-md transition-colors",
                    location.pathname === item.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
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