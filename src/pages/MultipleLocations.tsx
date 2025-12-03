"use client";

import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';

const MultipleLocations = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-100">Gestão de Múltiplos Locais</h1>
      <p className="text-gray-400">Controle de estoque em diferentes depósitos e lojas.</p>
      <div className="bg-gray-800 p-8 rounded-lg text-center">
        <p className="text-gray-300">Funcionalidade em desenvolvimento...</p>
      </div>
    </div>
  );
};

export default MultipleLocations;
