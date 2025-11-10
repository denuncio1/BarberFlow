"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, History, Users, DollarSign, Package, TrendingUp, BarChartBig, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agendamentos', href: '/appointments', icon: CalendarDays },
  { name: 'Histórico', href: '/history', icon: History },
  { name: 'Gestão de Clientes', href: '/client-management', icon: Users },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Controle de Estoque', href: '/stock-control', icon: Package },
  { name: 'Marketing e Fidelização', href: '/marketing-loyalty', icon: TrendingUp },
  { name: 'Relatórios', href: '/reports', icon: BarChartBig },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4 flex flex-col">
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => (
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
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;