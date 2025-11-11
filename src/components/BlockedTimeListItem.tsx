"use client";

import React from 'react';
import { ChevronRight, Calendar, Clock, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlockedTimeListItemProps {
  id: string;
  technician_name: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  reason?: string;
  is_recurring: boolean;
  onClick?: (blockedTimeId: string) => void;
}

const BlockedTimeListItem: React.FC<BlockedTimeListItemProps> = ({
  id,
  technician_name,
  start_time,
  end_time,
  reason,
  is_recurring,
  onClick,
}) => {
  const { t } = useTranslation();
  const displayReason = reason || t('not_informed');

  const startDate = parseISO(start_time);
  const endDate = parseISO(end_time);

  const formattedStartDate = format(startDate, 'dd/MM/yyyy', { locale: ptBR });
  const formattedStartTime = format(startDate, 'HH:mm', { locale: ptBR });
  const formattedEndTime = format(endDate, 'HH:mm', { locale: ptBR });

  return (
    <div
      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-sm hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <div className="flex items-center space-x-4 flex-grow">
        <div className="flex-grow grid grid-cols-4 gap-2 items-center">
          <div>
            <p className="font-semibold text-gray-100">{technician_name}</p>
            <p className="text-sm text-gray-400 flex items-center">
              <Calendar className="h-3 w-3 mr-1" /> {formattedStartDate}
            </p>
          </div>
          <p className="text-gray-300 flex items-center">
            <Clock className="h-4 w-4 mr-1" /> {formattedStartTime} - {formattedEndTime}
          </p>
          <p className="text-gray-300">{displayReason}</p>
          <p className="text-gray-300">
            {is_recurring ? (
              <span className="flex items-center text-yellow-500">
                <Repeat className="h-4 w-4 mr-1" /> {t('blocked_time_recurring')}
              </span>
            ) : (
              <span className="text-gray-500">{t('blocked_time_one_time')}</span>
            )}
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
    </div>
  );
};

export default BlockedTimeListItem;