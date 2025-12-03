"use client";

import React from 'react';
import { format, parseISO, setHours, setMinutes, isSameDay, addDays } from 'date-fns'; // Removed isWithinInterval as it's not used here
import { ptBR } from 'date-fns/locale';
import AppointmentCard from './AppointmentCard';
import BlockedTimeCard from './BlockedTimeCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils'; // Added cn import

interface Technician {
  id: string;
  name: string;
  avatar_url?: string;
  color?: string;
}

interface Appointment {
  id: string;
  appointment_date: string; // ISO string
  status: string;
  client_id: string;
  technician_id: string;
  clients: { first_name: string; last_name: string; phone?: string } | null;
  technician: { id: string; name: string } | null;
  services: { name: string; price: number; duration_minutes?: number } | null;
  notes?: string;
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
  onDeleteAppointment?: (id: string) => void;
}

const AppointmentCalendarGrid: React.FC<AppointmentCalendarGridProps> = ({
  selectedDate,
  technicians,
  appointments,
  blockedTimes,
  hideBlockedTimes,
  selectedBarberId,
  onDeleteAppointment,
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

  // Calculate the height of a 10-minute slot in pixels (e.g., 25px per 10 min)
  const slotHeightPx = 25; // This can be adjusted for visual density

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
    <div className="flex flex-col flex-grow overflow-hidden bg-gray-800 text-gray-300 border border-gray-700 rounded-xl shadow-2xl">
      {/* Technician Headers - Fixed at top */}
      <div className="flex bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
        <div className="w-16 flex-shrink-0 border-r border-gray-700"></div>
        {filteredTechnicians.map(tech => (
          <div key={tech.id} className="flex-1 p-3 text-center border-r border-gray-700 last:border-r-0">
            <Avatar className="mx-auto h-12 w-12 mb-2 ring-2 ring-gray-700">
              <AvatarImage src={tech.avatar_url || "/placeholder.svg"} alt={tech.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                {tech.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm text-white">{tech.name}</span>
          </div>
        ))}
      </div>

      {/* Scrollable Calendar Grid */}
      <div className="flex flex-grow overflow-y-auto">
        {/* Time Axis */}
        <div className="w-16 flex-shrink-0 border-r border-gray-700 bg-gray-800">
          {timeSlots.map((time, index) => (
            <div
              key={index}
              className="text-xs flex items-start justify-end pr-2 text-gray-500 leading-none"
              style={{ height: `${slotHeightPx}px` }}
            >
              <span className="mt-[-6px] font-medium">{format(time, 'HH:mm')}</span>
            </div>
          ))}
        </div>

        {/* Appointment Slots */}
        <div className="flex flex-grow">
          {filteredTechnicians.map(tech => (
            <div key={tech.id} className="flex-1 border-r border-gray-700 last:border-r-0 relative bg-gray-850">
              {/* Time slot lines */}
              {timeSlots.map((time, index) => (
                <div
                  key={index}
                  className={cn(
                    "border-b",
                    time.getMinutes() === 0 ? "border-b-gray-700" : "border-b-gray-800/50"
                  )}
                  style={{ height: `${slotHeightPx}px` }}
                />
              ))}

              {/* Render Appointments */}
              {appointments
                .filter(app =>
                  isSameDay(parseISO(app.appointment_date), selectedDate) &&
                  app.technician_id === tech.id
                )
                .map(app => {
                  const startDate = parseISO(app.appointment_date);
                  const durationMinutes = app.services?.duration_minutes || 60; // Default to 60 minutes if not specified
                  const endDate = new Date(startDate.getTime() + durationMinutes * 60000); // Add duration in milliseconds
                  
                  const { top, height } = getPositionAndHeight(app.appointment_date, endDate.toISOString());
                  return (
                    <div key={app.id} className="absolute w-full" style={{ top: `${top}px`, height: `${height}px` }}>
                      <AppointmentCard
                        clientName={app.clients ? `${app.clients.first_name} ${app.clients.last_name}` : 'N/A'}
                        serviceName={app.services?.name || 'N/A'}
                        startTime={format(startDate, 'HH:mm')}
                        endTime={format(endDate, 'HH:mm')}
                        phoneNumber={app.clients?.phone}
                        status={app.status}
                        technicianColor={tech.color}
                        appointmentId={app.id}
                        onDelete={onDeleteAppointment}
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
                      <div key={block.id} className="absolute w-full" style={{ top: `${top}px`, height: `${height}px` }}>
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