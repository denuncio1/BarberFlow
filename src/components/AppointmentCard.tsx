"use client";

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  phoneNumber?: string;
  orderNumber?: string;
  isFavorite?: boolean;
  status: string; // 'scheduled', 'completed', 'cancelled', 'no-show', 'pending'
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  clientName,
  serviceName,
  startTime,
  endTime,
  phoneNumber,
  orderNumber,
  isFavorite = false,
  status,
}) => {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'pending':
        return 'bg-blue-600 border-blue-700';
      case 'completed':
        return 'bg-green-600 border-green-700';
      case 'cancelled':
        return 'bg-red-600 border-red-700';
      case 'no-show':
        return 'bg-yellow-600 border-yellow-700';
      default:
        return 'bg-gray-600 border-gray-700';
    }
  };

  return (
    <div
      className={cn(
        "absolute w-full p-2 rounded-md text-white text-xs overflow-hidden shadow-md",
        getStatusClasses(status)
      )}
      style={{
        top: `${parseInt(startTime.split(':')[1]) / 10 * 16.6667}px`, // Assuming 10-min intervals, 16.6667px per minute
        height: `${(new Date(`2000/01/01 ${endTime}`).getTime() - new Date(`2000/01/01 ${startTime}`).getTime()) / (1000 * 60) / 10 * 16.6667}px`,
      }}
    >
      <div className="font-bold flex items-center">
        {startTime} - {clientName} {isFavorite && <Star className="h-3 w-3 ml-1 fill-current text-yellow-300" />}
      </div>
      <p className="mt-1">{serviceName}</p>
      {phoneNumber && <p>{phoneNumber}</p>}
      {orderNumber && <p>Nº da comanda: {orderNumber}</p>}
    </div>
  );
};

export default AppointmentCard;