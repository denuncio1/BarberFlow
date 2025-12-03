"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BlockedTimeRegistrationForm from '@/components/BlockedTimeRegistrationForm';
import AppointmentRegistrationForm from '@/components/AppointmentRegistrationForm';

// Interfaces for data fetched from Supabase
interface Technician {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Client {
  first_name: string;
  last_name: string;
  phone?: string;
}

interface Service {
  name: string;
  price: number;
  duration_minutes?: number;
}

interface Appointment {
  id: string;
  appointment_date: string; // ISO string
  status: string;
  client_id: string;
  technician_id: string;
  service_id: string;
  clients: Client | null;
  technician: Technician | null;
  services: Service | null;
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

const Appointments = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [hideBlockedTimes, setHideBlockedTimes] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBlockTimeDialogOpen, setIsBlockTimeDialogOpen] = useState<boolean>(false);
  const [isNewAppointmentDialogOpen, setIsNewAppointmentDialogOpen] = useState<boolean>(false);

  const fetchAppointmentsData = async () => {
    if (!user) return;

    setLoadingData(true);
    setError(null);

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');

    try {
      // Fetch Technicians
      const { data: techniciansData, error: techError } = await supabase
        .from('technicians')
        .select('id, name, avatar_url, color')
        .eq('user_id', user.id);

      if (techError) throw techError;
      setTechnicians(techniciansData || []);

      // Fetch Appointments for the selected date with service details
      const { data: appointmentsData, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client_id,
          technician_id,
          service_id,
          notes,
          user_id,
          clients!appointments_client_id_fkey(first_name, last_name, phone),
          services!appointments_service_id_fkey(name, price, duration_minutes),
          technician:technicians!appointments_technician_id_fkey(id, name)
        `)
        .eq('user_id', user.id)
        .gte('appointment_date', formattedDate + 'T00:00:00.000Z')
        .lt('appointment_date', format(addDays(selectedDate, 1), 'yyyy-MM-dd') + 'T00:00:00.000Z');

      if (apptError) throw apptError;
      setAppointments(appointmentsData || []);

      // Fetch Blocked Times for the selected date (non-recurring)
      const { data: blockedTimesData, error: blockedError } = await supabase
        .from('blocked_times')
        .select('id, technician_id, start_time, end_time, reason, is_recurring')
        .eq('user_id', user.id)
        .eq('is_recurring', false)
        .gte('start_time', formattedDate + 'T00:00:00.000Z')
        .lt('start_time', format(addDays(selectedDate, 1), 'yyyy-MM-dd') + 'T00:00:00.000Z');

      if (blockedError) throw blockedError;

      // Fetch Recurring Blocked Times
      const { data: recurringBlockedData, error: recurringError } = await supabase
        .from('blocked_times')
        .select('id, technician_id, start_time, end_time, reason, is_recurring')
        .eq('user_id', user.id)
        .eq('is_recurring', true);

      if (recurringError) throw recurringError;

      // Apply recurring blocks to the selected date
      const recurringBlocksForToday = (recurringBlockedData || []).map(block => {
        const originalStart = new Date(block.start_time);
        const originalEnd = new Date(block.end_time);
        
        // Create new dates with selected date but original time
        const newStart = new Date(selectedDate);
        newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
        
        const newEnd = new Date(selectedDate);
        newEnd.setHours(originalEnd.getHours(), originalEnd.getMinutes(), 0, 0);

        return {
          ...block,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
        };
      });

      setBlockedTimes([...(blockedTimesData || []), ...recurringBlocksForToday]);

    } catch (err: any) {
      console.error('Error fetching appointments data:', err);
      showError('Erro ao carregar dados de agendamentos: ' + err.message);
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleBlockTime = () => {
    setIsBlockTimeDialogOpen(true);
  };

  const handleNewProductSale = () => {
    navigate('/sales');
  };

  const handleNewAppointment = () => {
    setIsNewAppointmentDialogOpen(true);
  };

  const handleOtherAction = (action: string) => {
    if (action === 'bulk_appointment') {
      showSuccess('Funcionalidade "Agendamento avulso clube" em desenvolvimento!');
    } else if (action === 'recurring_appointment') {
      showSuccess('Funcionalidade "Agendamento recorrente" em desenvolvimento!');
    } else {
      showSuccess(`Ação "${action}" em desenvolvimento!`);
    }
  };

  const handleCallClient = () => {
    showSuccess('Funcionalidade "Ver/Ligar para Cliente" em desenvolvimento!');
  };

  const handleBlockTimeSuccess = () => {
    setIsBlockTimeDialogOpen(false);
    fetchAppointmentsData();
  };

  const handleNewAppointmentSuccess = () => {
    setIsNewAppointmentDialogOpen(false);
    fetchAppointmentsData();
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
      
      showSuccess('Agendamento cancelado com sucesso!');
      fetchAppointmentsData();
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      showError('Erro ao cancelar agendamento: ' + error.message);
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

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-8 text-white">Agendamentos</h1>

      {/* Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
        <AppointmentActions
          onBlockTime={handleBlockTime}
          onNewProductSale={handleNewProductSale}
          onNewAppointment={handleNewAppointment}
          onOtherAction={handleOtherAction}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={handleCallClient} className="bg-transparent text-yellow-400 hover:bg-yellow-500/10 border-yellow-500">
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver/Ligar para Cliente</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 relative z-10">
        <CalendarNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
        <AppointmentFilters
          barbers={technicians}
          selectedBarber={selectedBarberId}
          onBarberChange={setSelectedBarberId}
          hideBlockedTimes={hideBlockedTimes}
          onHideBlockedTimesChange={setHideBlockedTimes}
        />
        <Button variant="outline" onClick={fetchAppointmentsData} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-blue-500/50">
          <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
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
          onDeleteAppointment={handleDeleteAppointment}
        />
      )}

      {/* Block Time Dialog */}
      <Dialog open={isBlockTimeDialogOpen} onOpenChange={setIsBlockTimeDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Bloquear Horário</DialogTitle>
          </DialogHeader>
          <BlockedTimeRegistrationForm 
            onSuccess={handleBlockTimeSuccess} 
            onCancel={() => setIsBlockTimeDialogOpen(false)}
            technicians={technicians}
          />
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={isNewAppointmentDialogOpen} onOpenChange={setIsNewAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Novo Agendamento</DialogTitle>
          </DialogHeader>
          <AppointmentRegistrationForm 
            onSuccess={handleNewAppointmentSuccess} 
            onCancel={() => setIsNewAppointmentDialogOpen(false)}
            technicians={technicians}
            selectedDate={selectedDate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;