"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TableRow, TableCell } from '@/components/ui/table';

interface PaymentMethodListItemProps {
  id: string;
  name: string;
  percentage: number;
  receipt_in_days: number;
  take_out_of_barbershop: boolean;
  onClick?: (paymentMethodId: string) => void;
}

const PaymentMethodListItem: React.FC<PaymentMethodListItemProps> = ({
  id,
  name,
  percentage,
  receipt_in_days,
  take_out_of_barbershop,
  onClick,
}) => {
  const { t } = useTranslation();

  const formattedPercentage = `${percentage.toFixed(2).replace('.', ',')}%`;
  const formattedReceiptDays = `${receipt_in_days} ${t('days_short')}`;
  const takeOutOfBarbershopText = take_out_of_barbershop ? t('yes') : t('no');

  return (
    <TableRow
      className="cursor-pointer hover:bg-gray-700 transition-colors"
      onClick={() => onClick?.(id)}
    >
      <TableCell className="font-semibold text-gray-100">{name}</TableCell>
      <TableCell className="text-gray-300">{formattedPercentage}</TableCell>
      <TableCell className="text-gray-300">{formattedReceiptDays}</TableCell>
      <TableCell className="text-gray-300">{takeOutOfBarbershopText}</TableCell>
      <TableCell className="w-[50px]">
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </TableCell>
    </TableRow>
  );
};

export default PaymentMethodListItem;