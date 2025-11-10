"use client";

import React from 'react';
// Header and MadeWithDyad are now handled by the Layout component
import { useSession } from '@/contexts/SessionContext';
// Navigate is handled by the Layout component

const Appointments = () => {
  const { isLoading } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">Carregando...</div>;
  }

  // The Navigate to /login is now handled by the Layout component

  return (
    <div className="p-4 bg-background text-foreground min-h-full">
      <h1 className="text-3xl font-bold mb-6">Agendamentos</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400">
        Gerencie seus agendamentos aqui. (Conteúdo futuro para o calendário de agendamentos)
      </p>
    </div>
  );
};

export default Appointments;