"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, DollarSign, Users, Target, Percent } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Ajustando a interface Appointment para corresponder aos dados buscados no Dashboard
interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  client_id: string; // Adicionado client_id, pois é o que está sendo selecionado
  services: { name: string; price: number }[] | null;
  // 'clients' e 'technicians' não são selecionados nesta query do Dashboard, então foram removidos da interface aqui.
}

const Dashboard = () => {
  const { session, isLoading, user } = useSession();
  const [occupancyRate, setOccupancyRate] = useState<number>(0);
  const [averageTicket, setAverageTicket] = useState<number>(0);
  const [clientFrequency, setClientFrequency] = useState<number>(0);
  const [teamGoals, setTeamGoals] = useState<number>(10000); // Mock value for team goals
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedRangeOption, setSelectedRangeOption] = useState('this_month');

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const updateDateRange = (option: string) => {
    const today = new Date();
    let from = today;
    let to = today;

    switch (option) {
      case 'today':
        from = today;
        to = today;
        break;
      case 'yesterday':
        from = subDays(today, 1);
        to = subDays(today, 1);
        break;
      case 'this_week':
        from = startOfWeek(today, { locale: ptBR });
        to = endOfWeek(today, { locale: ptBR });
        break;
      case 'last_week':
        from = startOfWeek(subDays(today, 7), { locale: ptBR });
        to = endOfWeek(subDays(today, 7), { locale: ptBR });
        break;
      case 'this_month':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'last_month':
        from = startOfMonth(subDays(today, 30));
        to = endOfMonth(subDays(today, 30));
        break;
      default:
        break;
    }
    setDateRange({ from, to });
    setSelectedRangeOption(option);
  };

  useEffect(() => {
    updateDateRange('this_month'); // Set default to this month on initial load
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return;

      setLoadingMetrics(true);

      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client_id,
          services (name, price)
        `)
        .eq('user_id', user.id)
        .gte('appointment_date', format(dateRange.from, 'yyyy-MM-dd') + 'T00:00:00.000Z')
        .lte('appointment_date', format(dateRange.to, 'yyyy-MM-dd') + 'T23:59:59.999Z');

      if (error) {
        console.error('Error fetching appointments for metrics:', error);
        setLoadingMetrics(false);
        return;
      }

      const completedAppointments = appointmentsData?.filter(
        (app) => app.status === 'completed' && isWithinInterval(parseISO(app.appointment_date), { start: dateRange.from, end: dateRange.to })
      ) || [];

      // Calculate Average Ticket
      const totalRevenue = completedAppointments.reduce((sum, app) => {
        const servicePrice = app.services?.[0]?.price || 0;
        return sum + servicePrice;
      }, 0);
      setAverageTicket(completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0);

      // Calculate Client Frequency (unique clients)
      const uniqueClients = new Set(completedAppointments.map(app => app.client_id));
      setClientFrequency(uniqueClients.size);

      // Calculate Occupancy Rate (simplified: completed appointments vs. a hypothetical capacity)
      // Let's assume a hypothetical capacity of 50 appointments per period for demonstration
      const hypotheticalCapacity = 50; // This would ideally come from a more complex calculation (e.g., barbers * working hours * avg_appt_duration)
      setOccupancyRate((completedAppointments.length / hypotheticalCapacity) * 100);

      setLoadingMetrics(false);
    };

    fetchMetrics();
  }, [user, dateRange]);

  const displayDateRange = `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <main className="flex-grow flex flex-col p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <div className="flex items-center space-x-2">
            <Select onValueChange={updateDateRange} defaultValue={selectedRangeOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecionar Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="this_week">Esta Semana</SelectItem>
                <SelectItem value="last_week">Semana Passada</SelectItem>
                <SelectItem value="this_month">Este Mês</SelectItem>
                <SelectItem value="last_month">Mês Passado</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-[280px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {displayDateRange}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                      setSelectedRangeOption('custom');
                    }
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {loadingMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium bg-gray-200 dark:bg-gray-700 h-4 w-1/2 rounded"></CardTitle>
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-gray-200 dark:bg-gray-700 h-8 w-3/4 rounded"></div>
                  <p className="text-xs text-muted-foreground bg-gray-200 dark:bg-gray-700 h-3 w-1/3 rounded mt-1"></p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Baseado em uma capacidade hipotética de 50 agendamentos.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {averageTicket.toFixed(2).replace('.', ',')}</div>
                <p className="text-xs text-muted-foreground">Média por agendamento finalizado.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Frequência de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientFrequency}</div>
                <p className="text-xs text-muted-foreground">Clientes únicos no período.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metas da Equipe</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {teamGoals.toFixed(2).replace('.', ',')}</div>
                <p className="text-xs text-muted-foreground">Meta de faturamento para o período.</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button onClick={handleLogout} className="mt-4">
            Sair
          </Button>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;