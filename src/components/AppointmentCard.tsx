"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  phoneNumber?: string;
  status: string; // 'scheduled', 'completed', 'cancelled', 'no-show', 'pending'
  onClick?: () => void;
  technicianColor?: string; // Cor customizada do barbeiro
  appointmentId?: string; // ID do agendamento para ações
  onDelete?: (id: string) => void; // Callback para deletar
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  clientName,
  serviceName,
  startTime,
  endTime,
  phoneNumber,
  status,
  onClick,
  technicianColor,
  appointmentId,
  onDelete,
}) => {
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (appointmentId && onDelete && confirm('Tem certeza que deseja cancelar este agendamento?')) {
      onDelete(appointmentId);
    }
  };
  const getStatusClasses = (status: string) => {
    // Usa cor customizada do barbeiro para agendamentos scheduled/pending
    if (status === 'scheduled' || status === 'pending') {
      return `border-l-4 shadow-lg`;
    }
    
    switch (status) {
      case 'scheduled':
      case 'pending':
        return 'bg-gradient-to-br from-yellow-500/90 to-yellow-600/90 border-l-4 border-yellow-400 shadow-lg shadow-yellow-500/20';
      case 'completed':
        return 'bg-gradient-to-br from-green-500/90 to-green-600/90 border-l-4 border-green-400 shadow-lg shadow-green-500/20';
      case 'cancelled':
        return 'bg-gradient-to-br from-red-500/90 to-red-600/90 border-l-4 border-red-400 shadow-lg shadow-red-500/20';
      case 'no-show':
        return 'bg-gradient-to-br from-orange-500/90 to-orange-600/90 border-l-4 border-orange-400 shadow-lg shadow-orange-500/20';
      default:
        return 'bg-gradient-to-br from-blue-500/90 to-blue-600/90 border-l-4 border-blue-400 shadow-lg shadow-blue-500/20';
    }
  };
  
  const getCustomStyle = () => {
    if (status === 'scheduled' || status === 'pending') {
      // Usa a cor do barbeiro ou cor vibrante como padrão
      const color = technicianColor || '#10b981'; // green-500 vibrante como fallback
      return {
        backgroundColor: color,
        borderLeftColor: color,
        opacity: 0.95,
      };
    }
    return {};
  };

  return (
    <div
      onClick={onClick}
      style={getCustomStyle()}
      className={cn(
        "w-[calc(100%-8px)] mx-1 p-2.5 rounded-lg text-white text-xs backdrop-blur-sm h-full flex flex-col cursor-pointer hover:opacity-90 transition-opacity group relative",
        getStatusClasses(status)
      )}
    >
      <div className="font-bold flex items-center justify-between mb-1">
        <span className="text-sm">{startTime} - {clientName}</span>
        {onDelete && appointmentId && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-300 text-lg leading-none"
            title="Cancelar agendamento"
          >
            ×
          </button>
        )}
      </div>
      <p className="text-[11px] opacity-95 font-medium mb-1">{serviceName}</p>
      {phoneNumber && <p className="text-[10px] opacity-80 mb-1">{phoneNumber}</p>}
      <p className="text-[10px] opacity-90">{startTime} - {endTime}</p>
    </div>
  );
};

export default AppointmentCard;