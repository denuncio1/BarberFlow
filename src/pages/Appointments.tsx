"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, addDays } from 'date-fns';
import CalendarNavigation from '@/components/CalendarNavigation';
import AppointmentFilters from '@/components/AppointmentFilters';
import AppointmentActions from '@/components/AppointmentActions';
import AppointmentCalendarGrid from '@/components/AppointmentCalendarGrid';
import { RefreshCcw, Phone } from 'lucide-react'; // Import Phone icon
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components

// Interfaces for data fetched from Supabase
interface Technician {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Client {
  first_name: string;
  last_name: string;
}

interface Service {
  name: string;
  price: number;
}

interface Appointment {
  id: string;
  appointment_date: string; // ISO string
  status: string;
  client_id: string;
  technician_id: string;
  service_id: string;
  clients: Client[] | null; // Corrected to array
  technicians: Technician[] | null; // Corrected to array
  services: Service[] | null; // Corrected to array
  // Add any other fields needed for the card, e.g., phone_number, order_number, is_favorite
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

const Appointments = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [hideBlockedTimes, setHideBlockedTimes] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointmentsData = async () => {
    if (!user) return;

    setLoadingData(true);
    setError(null);

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    try {
      // Fetch Technicians
      const { data: techniciansData, error: techError } = await supabase
        .from('technicians')
        .select('id, name, avatar_url')
        .eq('user_id', user.id);

      if (techError) throw techError;
      setTechnicians(techniciansData || []);

      // Fetch Appointments for the selected date
      const { data: appointmentsData, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client_id,
          technician_id,
          service_id,
          clients (first_name, last_name),
          technicians (id, name),
          services (name, price)
        `)
        .eq('user_id', user.id)
        .gte('appointment_date', formattedDate + 'T00:00:00.000Z')
        .lt('appointment_date', format(addDays(selectedDate, 1), 'yyyy-MM-dd') + 'T00:00:00.000Z');

      if (apptError) throw apptError;
      setAppointments(appointmentsData || []);

      // Fetch Blocked Times for the selected date
      const { data: blockedTimesData, error: blockedError } = await supabase
        .from('blocked_times')
        .select('id, technician_id, start_time, end_time, reason, is_recurring')
        .eq('user_id', user.id)
        .gte('start_time', formattedDate + 'T00:00:00.000Z')
        .lt('start_time', format(addDays(selectedDate, 1), 'yyyy-MM-dd') + 'T00:00:00.000Z');

      if (blockedError) throw blockedError;
      setBlockedTimes(blockedTimesData || []);

    } catch (err: any) {
      console.error('Error fetching appointments data:', err);
      showError('Erro ao carregar dados de agendamentos: ' + err.message);
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointmentsData();
    }
  }, [user, selectedDate]);

  if (isSessionLoading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">Carregando agendamentos...</div>;
  }

  const handleBlockTime = () => {
    showSuccess('Funcionalidade "Bloquear horário" em desenvolvimento!');
  };

  const handleNewProductSale = () => {
    showSuccess('Funcionalidade "Nova venda de produtos" em desenvolvimento!');
  };

  const handleNewAppointment = () => {
    showSuccess('Funcionalidade "Novo agendamento" em desenvolvimento!');
  };

  const handleOtherAction = (action: string) => {
    showSuccess(`Ação "${action}" em desenvolvimento!`);
  };

  const handleCallClient = () => {
    showSuccess('Funcionalidade "Ver/Ligar para Cliente" em desenvolvimento!');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Agendamentos</h1>

      {/* Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <CalendarNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <AppointmentFilters
          barbers={technicians}
          selectedBarber={selectedBarberId}
          onBarberChange={setSelectedBarberId}
          hideBlockedTimes={hideBlockedTimes}
          onHideBlockedTimesChange={setHideBlockedTimes}
        />
        <Button variant="outline" onClick={fetchAppointmentsData} className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600">
          <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
        <AppointmentActions
          onBlockTime={handleBlockTime}
          onNewProductSale={handleNewProductSale}
          onNewAppointment={handleNewAppointment}
          onOtherAction={handleOtherAction}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={handleCallClient} className="bg-gray-800 text-yellow-500 hover:bg-gray-700 border-yellow-500">
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver/Ligar para Cliente</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main Calendar Grid */}
      {error ? (
        <div className="flex-grow flex items-center justify-center text-red-500 text-lg">
          <p>{error}</p>
        </div>
      ) : (
        <AppointmentCalendarGrid
          selectedDate={selectedDate}
          technicians={technicians}
          appointments={appointments}
          blockedTimes={blockedTimes}
          hideBlockedTimes={hideBlockedTimes}
          selectedBarberId={selectedBarberId}
        />
      )}
    </div>
  );
};

export default Appointments;