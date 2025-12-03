"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCcw } from 'lucide-react';

interface BlockedTimeCardProps {
  reason: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
}

const BlockedTimeCard: React.FC<BlockedTimeCardProps> = ({
  reason,
  startTime,
  endTime,
  isRecurring = false,
}) => {
  return (
    <div
      className={cn(
        "w-[calc(100%-8px)] mx-1 p-2.5 rounded-lg border text-white text-xs overflow-hidden shadow-lg h-full",
        isRecurring 
          ? "bg-gray-700/90 border-gray-600" 
          : "bg-gray-700/80 border-gray-500"
      )}
    >
      <div className="flex flex-col h-full justify-center">
        <div className="font-bold text-sm mb-1 text-gray-200">Horário Bloqueado</div>
        <p className="text-[11px] text-gray-300 mb-1">{startTime} - {endTime}</p>
        <p className="text-[11px] text-gray-300 font-medium">{reason}</p>
        {isRecurring && (
          <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
            <RefreshCcw className="h-3 w-3" />
            <span>Bloqueio Recorrente</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedTimeCard;