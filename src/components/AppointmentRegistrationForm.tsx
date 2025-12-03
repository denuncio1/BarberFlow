"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  client_id: z.string().min(1, { message: "Selecione um cliente." }),
  service_id: z.string().min(1, { message: "Selecione um serviço." }),
  technician_id: z.string().min(1, { message: "Selecione um barbeiro." }),
  appointment_date: z.date({ required_error: "Selecione uma data." }),
  appointment_time: z.string().min(1, { message: "Selecione um horário." }),
  notes: z.string().optional().or(z.literal('')),
  status: z.string().default('scheduled'),
});

interface AppointmentRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  technicians: { id: string; name: string }[];
  selectedDate?: Date;
}

const AppointmentRegistrationForm: React.FC<AppointmentRegistrationFormProps> = ({ 
  onSuccess, 
  onCancel, 
  technicians,
  selectedDate 
}) => {
  const { user } = useSession();
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [conflictDialog, setConflictDialog] = useState<{
    open: boolean;
    clientName: string;
    time: string;
  }>({ open: false, clientName: '', time: '' });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: "",
      service_id: "",
      technician_id: "",
      appointment_date: selectedDate || new Date(),
      appointment_time: "",
      notes: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchServices();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('user_id', user?.id)
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      showError('Erro ao carregar clientes');
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, duration_minutes')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      console.log('Serviços carregados:', data);
      setServices(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar serviços:', error);
      showError('Erro ao carregar serviços');
    } finally {
      setLoadingServices(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError('Usuário não autenticado');
      return;
    }

    try {
      // Combine date and time
      const appointmentDateTime = new Date(values.appointment_date);
      const [hours, minutes] = values.appointment_time.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // ⚠️ VALIDAÇÃO DE CONFLITO DE HORÁRIO (Verificação de Sobreposição)
      
      try {
        // 1. Buscar duração do serviço selecionado
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('duration_minutes')
          .eq('id', values.service_id)
          .single();

        if (serviceError) {
          console.warn("Erro ao buscar duração do serviço:", serviceError);
        }

        const serviceDuration = serviceData?.duration_minutes || 60; // Default 60min
        const appointmentEndTime = new Date(appointmentDateTime.getTime() + serviceDuration * 60000);

        // 2. Buscar todos os agendamentos do técnico no mesmo dia
        const dayStart = new Date(values.appointment_date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(values.appointment_date);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: existingAppointments, error: checkError } = await supabase
          .from('appointments')
          .select('id, client_id, appointment_date, service_id')
          .eq('technician_id', values.technician_id)
          .gte('appointment_date', dayStart.toISOString())
          .lte('appointment_date', dayEnd.toISOString())
          .neq('status', 'cancelled');

        if (checkError) {
          console.error("Erro ao verificar conflitos:", checkError);
          console.error("Query params:", {
            technician_id: values.technician_id,
            dayStart: dayStart.toISOString(),
            dayEnd: dayEnd.toISOString()
          });
          // Continuar com a criação mesmo com erro na validação
          console.warn("Continuando sem validação de conflito...");
        }

      // 3. Verificar sobreposição de intervalos
      if (existingAppointments && existingAppointments.length > 0) {
        for (const existing of existingAppointments) {
          const existingStart = new Date(existing.appointment_date);
          
          // Buscar duração do serviço do agendamento existente
          const { data: existingServiceData } = await supabase
            .from('services')
            .select('duration_minutes')
            .eq('id', existing.service_id)
            .single();

          const existingDuration = existingServiceData?.duration_minutes || 60;
          const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);

          // Verificar se há sobreposição:
          // Novo agendamento começa durante um existente OU
          // Novo agendamento termina durante um existente OU
          // Novo agendamento engloba um existente
          const hasOverlap = 
            (appointmentDateTime >= existingStart && appointmentDateTime < existingEnd) ||
            (appointmentEndTime > existingStart && appointmentEndTime <= existingEnd) ||
            (appointmentDateTime <= existingStart && appointmentEndTime >= existingEnd);

          if (hasOverlap) {
            // Buscar nome do cliente do agendamento existente
            const { data: clientData } = await supabase
              .from('clients')
              .select('first_name, last_name')
              .eq('id', existing.client_id)
              .single();

            const clientName = clientData 
              ? `${clientData.first_name} ${clientData.last_name}`
              : "outro cliente";

            const existingTime = existingStart.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            // Mostrar dialog de conflito
            setConflictDialog({
              open: true,
              clientName,
              time: `${existingTime} (duração: ${existingDuration}min)`,
            });
            return; // Bloqueia a criação
          }
        }
        }
      } catch (validationError) {
        console.error("Erro na validação de conflito:", validationError);
        // Continuar com a criação mesmo se houver erro na validação
      }

      const appointmentData = {
        user_id: user.id,
        client_id: values.client_id,
        service_id: values.service_id,
        technician_id: values.technician_id,
        appointment_date: appointmentDateTime.toISOString(),
        status: values.status,
        notes: values.notes || null,
      };

      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (error) throw error;

      showSuccess('Agendamento criado com sucesso!');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      showError('Erro ao criar agendamento: ' + error.message);
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-100">Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 text-gray-100 border-gray-600">
                    <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione um cliente"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-100">Serviço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 text-gray-100 border-gray-600">
                    <SelectValue placeholder={loadingServices ? "Carregando..." : "Selecione um serviço"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)} ({service.duration_minutes}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="technician_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-100">Barbeiro</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 text-gray-100 border-gray-600">
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointment_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-gray-100">Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-gray-700 text-gray-100 border-gray-600",
                        !field.value && "text-gray-400"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointment_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-100">Horário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 text-gray-100 border-gray-600">
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 text-gray-100 border-gray-700 max-h-[200px]">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-100">Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações sobre o agendamento..." 
                  {...field} 
                  className="bg-gray-700 text-gray-100 border-gray-600" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="bg-gray-700 hover:bg-gray-600 text-gray-100">
              Cancelar
            </Button>
          )}
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Criar Agendamento
          </Button>
        </div>
      </form>

      {/* Dialog de Conflito de Horário */}
      <AlertDialog open={conflictDialog.open} onOpenChange={(open) => setConflictDialog({ ...conflictDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <AlertDialogTitle className="text-xl">Horário Indisponível</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base space-y-3">
              <p>
                Este profissional já possui um agendamento às{' '}
                <strong className="text-orange-600 dark:text-orange-400">{conflictDialog.time}</strong>
                {' '}com{' '}
                <strong className="text-orange-600 dark:text-orange-400">{conflictDialog.clientName}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Por favor, escolha <strong>outro horário</strong> ou <strong>outro profissional</strong> para continuar.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setConflictDialog({ open: false, clientName: '', time: '' })}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
};

export default AppointmentRegistrationForm;
