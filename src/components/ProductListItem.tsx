"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ProductListItemProps {
  id: string;
  name: string;
  sale_price: number;
  cost_price?: number;
  producer?: string;
  type?: string; // Corresponds to 'category' in DB, but 'type' in UI
  stock_quantity: number;
  onClick?: (productId: string) => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({
  id,
  name,
  sale_price,
  cost_price,
  producer,
  type,
  stock_quantity,
  onClick,
}) => {
  const { t } = useTranslation();

  const formattedSalePrice = `R$ ${sale_price.toFixed(2).replace('.', ',')}`;
  const formattedCostPrice = cost_price ? `R$ ${cost_price.toFixed(2).replace('.', ',')}` : t('not_informed');
  const displayProducer = producer || t('not_informed');
  const displayType = type || t('not_informed');

  return (
    <div
      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-sm hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <div className="flex items-center space-x-4 flex-grow">
        <div className="flex-grow grid grid-cols-6 gap-2 items-center">
          <p className="font-semibold text-gray-100">{name}</p>
          <p className="text-gray-300">{formattedSalePrice}</p>
          <p className="text-gray-300">{formattedCostPrice}</p>
          <p className="text-gray-300">{displayProducer}</p>
          <p className="text-gray-300">{displayType}</p>
          <p className="text-gray-300">{stock_quantity}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
    </div>
  );
};

export default ProductListItem;