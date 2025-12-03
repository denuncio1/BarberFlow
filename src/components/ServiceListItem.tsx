"use client";

import React from 'react';
import { ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
  onReorderUp?: (serviceId: string) => void;
  onReorderDown?: (serviceId: string) => void;
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
    <TableRow 
      className="hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={() => onClick?.(id)}
    >
      <TableCell className="text-gray-300">
        <div className="flex flex-col items-center space-y-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-yellow-500 hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); onReorderUp?.(id); }}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-yellow-500 hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); onReorderDown?.(id); }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="font-semibold text-gray-100">{name}</TableCell>
      <TableCell className="text-gray-300">{formattedPrice}</TableCell>
      <TableCell className="text-gray-300">{formattedDuration}</TableCell>
      <TableCell className="text-gray-300">{visibleStatus}</TableCell>
      <TableCell className="text-gray-300">{t(`service_type_${type.toLowerCase().replace(/ /g, '_')}`)}</TableCell>
      <TableCell className="text-gray-300">{t(`service_category_${category.toLowerCase().replace(/ /g, '_')}`)}</TableCell>
      <TableCell className="text-gray-400">
        <ChevronRight className="h-5 w-5" />
      </TableCell>
    </TableRow>
  );
};

export default ServiceListItem;