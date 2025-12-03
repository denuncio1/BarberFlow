"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface AppointmentFiltersProps {
  barbers: { id: string; name: string }[];
  selectedBarber: string;
  onBarberChange: (barberId: string) => void;
  hideBlockedTimes: boolean;
  onHideBlockedTimesChange: (hide: boolean) => void;
}

const AppointmentFilters: React.FC<AppointmentFiltersProps> = ({
  barbers,
  selectedBarber,
  onBarberChange,
  hideBlockedTimes,
  onHideBlockedTimesChange,
}) => {
  const { t, i18n } = useTranslation();
  
  const getYesNoLabel = () => {
    if (i18n.language === 'pt') return { yes: 'Sim', no: 'Não' };
    if (i18n.language === 'es') return { yes: 'Sí', no: 'No' };
    return { yes: 'Yes', no: 'No' };
  };
  
  const labels = getYesNoLabel();
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
        <Label htmlFor="hide-blocked-times" className="text-gray-300 font-medium text-sm whitespace-nowrap">
          {t('hide_blocked_times')}
        </Label>
        <Select value={hideBlockedTimes ? labels.yes : labels.no} onValueChange={(val) => onHideBlockedTimesChange(val === labels.yes)}>
          <SelectTrigger className="w-[100px] bg-gray-700 text-white border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            <SelectItem value={labels.yes}>{labels.yes}</SelectItem>
            <SelectItem value={labels.no}>{labels.no}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
        <Label className="text-gray-300 font-medium text-sm whitespace-nowrap">Barber:</Label>
        <Select onValueChange={onBarberChange} value={selectedBarber}>
          <SelectTrigger className="w-[200px] bg-gray-700 text-white border-gray-600">
            <SelectValue placeholder="Todos os visíveis" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
            <SelectItem value="all">Todos os visíveis</SelectItem>
            {barbers.map(barber => (
              <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AppointmentFilters;