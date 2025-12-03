"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TimerOff, ShoppingBag, CalendarPlus, Plus } from 'lucide-react'; // Changed ClockOff to TimerOff

interface AppointmentActionsProps {
  onBlockTime: () => void;
  onNewProductSale: () => void;
  onNewAppointment: () => void;
  onOtherAction?: (action: string) => void;
}

const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  onBlockTime,
  onNewProductSale,
  onNewAppointment,
  onOtherAction,
}) => {
  return (
    <div className="flex items-center gap-3">
      <Button variant="destructive" onClick={onBlockTime} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6">
        <TimerOff className="h-4 w-4 mr-2" /> Bloquear horário
      </Button>
      <Button variant="secondary" onClick={onNewProductSale} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6">
        <ShoppingBag className="h-4 w-4 mr-2" /> Venda de Produtos/Pacotes
      </Button>
      <Button variant="secondary" onClick={onNewAppointment} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6">
        <CalendarPlus className="h-4 w-4 mr-2" /> Novo agendamento
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-transparent hover:bg-yellow-500/10 text-yellow-500 border-yellow-500 font-semibold px-6">
            <Plus className="h-4 w-4 mr-2" /> Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800 text-white border-gray-700 min-w-[280px]">
          <DropdownMenuItem onClick={() => onOtherAction && onOtherAction('bulk_appointment')} className="hover:bg-gray-700 py-3">
            <span className="text-yellow-500 font-medium">Agendamento avulso clube</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOtherAction && onOtherAction('recurring_appointment')} className="hover:bg-gray-700 py-3">
            <Plus className="h-4 w-4 mr-2 text-yellow-500" />
            <span className="text-yellow-500 font-medium">Novo agendamento recorrente</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AppointmentActions;