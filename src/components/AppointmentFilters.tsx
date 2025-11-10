"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="hide-blocked-times" className="text-gray-300">Ocultar Horários Bloqueados:</Label>
        <Switch
          id="hide-blocked-times"
          checked={hideBlockedTimes}
          onCheckedChange={onHideBlockedTimesChange}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-600"
        />
      </div>

      <Select onValueChange={onBarberChange} defaultValue={selectedBarber}>
        <SelectTrigger className="w-[200px] bg-gray-800 text-white border-gray-600">
          <SelectValue placeholder="Barbeiro: Todos os visíveis" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 text-white border-gray-700">
          <SelectItem value="all">Todos os visíveis</SelectItem>
          {barbers.map(barber => (
            <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AppointmentFilters;