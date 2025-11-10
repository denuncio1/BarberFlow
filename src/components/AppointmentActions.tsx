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
    <div className="flex items-center space-x-2">
      <Button variant="destructive" onClick={onBlockTime} className="bg-red-600 hover:bg-red-700 text-white">
        <TimerOff className="h-4 w-4 mr-2" /> Bloquear horário
      </Button>
      <Button variant="secondary" onClick={onNewProductSale} className="bg-yellow-600 hover:bg-yellow-700 text-white">
        <ShoppingBag className="h-4 w-4 mr-2" /> Nova venda de produtos
      </Button>
      <Button variant="secondary" onClick={onNewAppointment} className="bg-yellow-600 hover:bg-yellow-700 text-white">
        <CalendarPlus className="h-4 w-4 mr-2" /> Novo agendamento
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800 text-white border-gray-700">
          <DropdownMenuItem onClick={() => onOtherAction && onOtherAction('view_reports')} className="hover:bg-gray-700">
            Ver Relatórios
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOtherAction && onOtherAction('manage_services')} className="hover:bg-gray-700">
            Gerenciar Serviços
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AppointmentActions;