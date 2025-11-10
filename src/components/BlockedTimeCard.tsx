"use client";

import React from 'react';
import { cn } from '@/lib/utils';

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
        "absolute w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white text-xs overflow-hidden shadow-md"
      )}
      style={{
        top: `${parseInt(startTime.split(':')[1]) / 10 * 16.6667}px`, // Assuming 10-min intervals, 16.6667px per minute
        height: `${(new Date(`2000/01/01 ${endTime}`).getTime() - new Date(`2000/01/01 ${startTime}`).getTime()) / (1000 * 60) / 10 * 16.6667}px`,
      }}
    >
      <div className="font-bold">Horário Bloqueado</div>
      <p className="mt-1">{startTime} - {endTime}</p>
      <p>{reason}</p>
      {isRecurring && <p className="text-gray-400">(Bloqueio Recorrente)</p>}
    </div>
  );
};

export default BlockedTimeCard;