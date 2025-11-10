"use client";

import React from 'react';
import { format, parseISO, setHours, setMinutes, isWithinInterval, isSameDay, addDays } from 'date-fns'; // Added addDays
import { ptBR } from 'date-fns/locale';
import AppointmentCard from './AppointmentCard';
import BlockedTimeCard from './BlockedTimeCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils'; // Added cn import

interface Technician {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Appointment {
  id: string;
  appointment_date: string; // ISO string
  status: string;
  clients: { first_name: string; last_name: string }[] | null;
  technicians: { name: string }[] | null; // Assuming this is the technician assigned to the appointment
  services: { name: string; price: number }[] | null;
  // Mocked data for now, will be fetched from DB later
  phone_number?: string;
  order_number?: string;
  is_favorite?: boolean;
}

interface BlockedTime {
  id: string;
  technician_id: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  reason: string;
  is_recurring: boolean;
}

interface AppointmentCalendarGridProps {
  selectedDate: Date;
  technicians: Technician[];
  appointments: Appointment[];
  blockedTimes: BlockedTime[];
  hideBlockedTimes: boolean;
  selectedBarberId: string; // 'all' or specific technician ID
}

const AppointmentCalendarGrid: React.FC<AppointmentCalendarGridProps> = ({
  selectedDate,
  technicians,
  appointments,
  blockedTimes,
  hideBlockedTimes,
  selectedBarberId,
}) => {
  const timeSlots = [];
  const startHour = 8; // 8:00 AM
  const endHour = 20; // 8:00 PM
  const intervalMinutes = 10; // 10-minute intervals

  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      const time = setMinutes(setHours(selectedDate, h), m);
      timeSlots.push(time);
    }
  }

  const filteredTechnicians = selectedBarberId === 'all'
    ? technicians
    : technicians.filter(tech => tech.id === selectedBarberId);

  // Calculate the height of a 10-minute slot in pixels (e.g., 20px per 10 min)
  const slotHeightPx = 20; // This can be adjusted for visual density

  const getPositionAndHeight = (startIso: string, endIso: string) => {
    const start = parseISO(startIso);
    const end = parseISO(endIso);

    // Ensure start and end are on the selected date for correct positioning
    const startOnSelectedDate = setMinutes(setHours(selectedDate, start.getHours()), start.getMinutes());
    const endOnSelectedDate = setMinutes(setHours(selectedDate, end.getHours()), end.getMinutes());

    const totalMinutes = (endOnSelectedDate.getTime() - startOnSelectedDate.getTime()) / (1000 * 60);
    const offsetMinutes = (startOnSelectedDate.getTime() - setMinutes(setHours(selectedDate, startHour), 0).getTime()) / (1000 * 60);

    const top = (offsetMinutes / intervalMinutes) * slotHeightPx;
    const height = (totalMinutes / intervalMinutes) * slotHeightPx;

    return { top, height };
  };

  return (
    <div className="flex flex-grow overflow-auto bg-gray-900 text-gray-300 border border-gray-700 rounded-lg">
      {/* Time Axis */}
      <div className="w-20 flex-shrink-0 border-r border-gray-700 sticky left-0 bg-gray-900 z-10">
        {timeSlots.map((time, index) => (
          <div
            key={index}
            className="h-[20px] text-xs flex items-start justify-end pr-2" // Adjust height to match slotHeightPx
            style={{ height: `${slotHeightPx}px` }}
          >
            {time.getMinutes() === 0 && (
              <span className="mt-[-6px]">{format(time, 'HH:mm')}</span>
            )}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-grow">
        {/* Technician Headers */}
        <div className="flex w-full sticky top-0 bg-gray-900 z-20 border-b border-gray-700">
          {filteredTechnicians.map(tech => (
            <div key={tech.id} className="flex-1 p-2 text-center border-r border-gray-700 last:border-r-0">
              <Avatar className="mx-auto h-10 w-10 mb-1">
                <AvatarImage src={tech.avatar_url || "/placeholder.svg"} alt={tech.name} />
                <AvatarFallback>{tech.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">{tech.name}</span>
            </div>
          ))}
        </div>

        {/* Appointment Slots */}
        <div className="absolute top-[60px] left-20 right-0 bottom-0 flex"> {/* Adjust top offset for header */}
          {filteredTechnicians.map(tech => (
            <div key={tech.id} className="flex-1 border-r border-gray-700 last:border-r-0 relative">
              {/* Time slot lines */}
              {timeSlots.map((time, index) => (
                <div
                  key={index}
                  className={cn(
                    "border-b border-gray-800",
                    time.getMinutes() === 0 ? "border-b-gray-700" : ""
                  )}
                  style={{ height: `${slotHeightPx}px` }}
                />
              ))}

              {/* Render Appointments */}
              {appointments
                .filter(app =>
                  isSameDay(parseISO(app.appointment_date), selectedDate) &&
                  app.technicians?.[0]?.name === tech.name // Assuming technician is linked by name for now, ideally by ID
                )
                .map(app => {
                  const { top, height } = getPositionAndHeight(app.appointment_date, format(addDays(parseISO(app.appointment_date), 0, /* assuming 1 hour duration for now */), 'yyyy-MM-dd HH:mm', { locale: ptBR })); // Placeholder for end time
                  return (
                    <div key={app.id} style={{ top: `${top}px`, height: `${height}px` }}>
                      <AppointmentCard
                        clientName={app.clients?.[0] ? `${app.clients[0].first_name} ${app.clients[0].last_name}` : 'N/A'}
                        serviceName={app.services?.[0]?.name || 'N/A'}
                        startTime={format(parseISO(app.appointment_date), 'HH:mm')}
                        endTime={format(addDays(parseISO(app.appointment_date), 0, /* assuming 1 hour duration for now */), 'HH:mm')} // Placeholder for end time
                        phoneNumber={app.phone_number} // Assuming these fields exist or are mocked
                        orderNumber={app.order_number}
                        isFavorite={app.is_favorite}
                        status={app.status}
                      />
                    </div>
                  );
                })}

              {/* Render Blocked Times */}
              {!hideBlockedTimes &&
                blockedTimes
                  .filter(block =>
                    isSameDay(parseISO(block.start_time), selectedDate) &&
                    block.technician_id === tech.id
                  )
                  .map(block => {
                    const { top, height } = getPositionAndHeight(block.start_time, block.end_time);
                    return (
                      <div key={block.id} style={{ top: `${top}px`, height: `${height}px` }}>
                        <BlockedTimeCard
                          reason={block.reason || 'Motivo não especificado'}
                          startTime={format(parseISO(block.start_time), 'HH:mm')}
                          endTime={format(parseISO(block.end_time), 'HH:mm')}
                          isRecurring={block.is_recurring}
                        />
                      </div>
                    );
                  })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendarGrid;