"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface CalendarNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarNavigation: React.FC<CalendarNavigationProps> = ({ selectedDate, onDateChange }) => {
  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="icon" onClick={handlePreviousDay} className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="w-[150px] justify-center text-center font-normal bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
            locale={ptBR}
            className="text-white"
          />
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="icon" onClick={handleNextDay} className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CalendarNavigation;