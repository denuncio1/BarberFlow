"use client";

import React from 'react';
import { ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ServiceListItemProps {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  is_visible_to_clients: boolean;
  type: string;
  category: string;
  onClick?: (serviceId: string) => void;
  onReorderUp?: (serviceId: string) => void; // Placeholder for reordering
  onReorderDown?: (serviceId: string) => void; // Placeholder for reordering
}

const ServiceListItem: React.FC<ServiceListItemProps> = ({
  id,
  name,
  price,
  duration_minutes,
  is_visible_to_clients,
  type,
  category,
  onClick,
  onReorderUp,
  onReorderDown,
}) => {
  const { t } = useTranslation();

  const formattedPrice = `R$ ${price.toFixed(2).replace('.', ',')}`;
  const formattedDuration = `${String(Math.floor(duration_minutes / 60)).padStart(2, '0')}:${String(duration_minutes % 60).padStart(2, '0')}`;
  const visibleStatus = is_visible_to_clients ? t('yes') : t('no');

  return (
    <div
      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-sm hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <div className="flex items-center space-x-4 flex-grow">
        {/* Reorder Arrows (Placeholder) */}
        <div className="flex flex-col items-center space-y-1">
          <button onClick={(e) => { e.stopPropagation(); onReorderUp?.(id); }} className="text-gray-400 hover:text-yellow-500">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onReorderDown?.(id); }} className="text-gray-400 hover:text-yellow-500">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-grow grid grid-cols-5 gap-2 items-center">
          <p className="font-semibold text-gray-100">{name}</p>
          <p className="text-gray-300">{formattedPrice}</p>
          <p className="text-gray-300">{formattedDuration}</p>
          <p className="text-gray-300">{visibleStatus}</p>
          <p className="text-gray-300">{t(`service_type_${type.toLowerCase().replace(/ /g, '_')}`)}</p>
          <p className="text-gray-300">{t(`service_category_${category.toLowerCase().replace(/ /g, '_')}`)}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
    </div>
  );
};

export default ServiceListItem;