"use client";

import React from 'react';
import Header from '@/components/Header';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';

const Reports = () => {
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
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">Relatórios</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Visualize dados e insights do seu negócio.
          </p>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Reports;