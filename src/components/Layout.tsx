"use client";

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { MadeWithDyad } from './made-with-dyad';
import { useSession } from '@/contexts/SessionContext';
import { Navigate, Outlet } from 'react-router-dom'; // Import Outlet

const Layout: React.FC = () => { // Removed LayoutProps interface and children prop
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow p-4 overflow-auto">
          <Outlet /> {/* Render nested routes here */}
        </main>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;