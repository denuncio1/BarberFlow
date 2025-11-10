"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
    <div
      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-sm hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <div className="flex items-center space-x-4 flex-grow">
        <div className="flex-grow grid grid-cols-4 gap-2 items-center">
          <p className="font-semibold text-gray-100">{name}</p>
          <p className="text-gray-300">{formattedPercentage}</p>
          <p className="text-gray-300">{formattedReceiptDays}</p>
          <p className="text-gray-300">{takeOutOfBarbershopText}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
    </div>
  );
};

export default PaymentMethodListItem;