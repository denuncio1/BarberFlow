"use client";

import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';

const StockControl = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">Controle de Estoque</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Gerencie seus produtos e inventário.
        </p>
      </div>
    </div>
  );
};

export default StockControl;