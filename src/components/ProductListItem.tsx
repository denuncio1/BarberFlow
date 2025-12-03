"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
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
    <TableRow 
      className="cursor-pointer hover:bg-gray-700 transition-colors"
      onClick={() => onClick?.(id)}
    >
      <TableCell className="font-semibold text-gray-100">{name}</TableCell>
      <TableCell className="text-gray-300">{formattedSalePrice}</TableCell>
      <TableCell className="text-gray-300">{formattedCostPrice}</TableCell>
      <TableCell className="text-gray-300">{displayProducer}</TableCell>
      <TableCell className="text-gray-300">{displayType}</TableCell>
      <TableCell className="text-gray-300">{stock_quantity}</TableCell>
      <TableCell className="text-right">
        <ChevronRight className="h-5 w-5 text-gray-400 inline-block" />
      </TableCell>
    </TableRow>
  );
};

export default ProductListItem;