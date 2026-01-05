"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, DollarSign, Users, Target, Percent } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cake, Bell, PieChart } from 'lucide-react';
import { DashboardCharts } from "@/components/DashboardCharts";

// Ajustando a interface Appointment para corresponder aos dados buscados no Dashboard
interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  client_id: string; // Adicionado client_id, pois é o que está sendo selecionado
  services: { name: string; price: number }[] | null;
  // 'clients' e 'technicians' não são selecionados nesta query do Dashboard, então foram removidos da interface aqui.
}

interface TeamGoalSummary {
  total_goals: number;
  total_current_value: number;
  total_max_value: number;
  goals_count: number;
  progress_percentage: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [occupancyRate, setOccupancyRate] = useState<number>(0);
  const [averageTicket, setAverageTicket] = useState<number>(0);
  const [clientFrequency, setClientFrequency] = useState<number>(0);
  const [teamGoalsSummary, setTeamGoalsSummary] = useState<TeamGoalSummary | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedRangeOption, setSelectedRangeOption] = useState('this_month');





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
      setLoadingMetrics(true);

      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          client_id,
          technician_id,
          signature_used,
          service_id
        `)
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

      // Fetch service prices for completed appointments
      const serviceIds = completedAppointments.map(app => app.service_id).filter(Boolean);
      let servicePrices: Record<string, number> = {};
      
      if (serviceIds.length > 0) {
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, price')
          .in('id', serviceIds);
        
        servicePrices = (servicesData || []).reduce((acc: Record<string, number>, service: any) => {
          acc[service.id] = service.price || 0;
          return acc;
        }, {});
      }

      // Calculate Average Ticket
      const totalRevenue = completedAppointments.reduce((sum, app: any) => {
        const servicePrice = servicePrices[app.service_id] || 0;
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

      // Fetch Team Goals Summary
      await fetchTeamGoalsSummary(completedAppointments, servicePrices);

      setLoadingMetrics(false);
    };

    fetchMetrics();
  }, [dateRange]);

  const fetchTeamGoalsSummary = async (appointments: any[], servicePrices: Record<string, number> = {}) => {
    const currentMonth = dateRange.from.getMonth() + 1;
    const currentYear = dateRange.from.getFullYear();

    try {
      // Fetch all goals for the current period
      const { data: goalsData, error: goalsError } = await supabase
        .from('team_goals')
        .select('*')
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (goalsError) throw goalsError;

      if (!goalsData || goalsData.length === 0) {
        setTeamGoalsSummary(null);
        return;
      }

      // Calculate progress for each goal
      let totalCurrentValue = 0;
      let totalMaxValue = 0;

      for (const goal of goalsData) {
        // Filter appointments by technician and goal type
        const techAppointments = appointments.filter(apt => {
          if (apt.technician_id !== goal.technician_id) return false;
          
          // Filter by goal type
          if (goal.goal_type === 'services_unsigned' && apt.signature_used) return false;
          if (goal.goal_type === 'services_signed' && !apt.signature_used) return false;
          if (goal.goal_type === 'general_unsigned' && apt.signature_used) return false;
          if (goal.goal_type === 'general_signed' && !apt.signature_used) return false;
          
          return true;
        });

        const currentValue = techAppointments.reduce((sum, apt: any) => {
          const servicePrice = servicePrices[apt.service_id] || 0;
          return sum + servicePrice;
        }, 0);
        totalCurrentValue += currentValue;
        totalMaxValue += goal.max_expected_value;
      }

      const progressPercentage = totalMaxValue > 0 ? (totalCurrentValue / totalMaxValue) * 100 : 0;

      setTeamGoalsSummary({
        total_goals: goalsData.length,
        total_current_value: totalCurrentValue,
        total_max_value: totalMaxValue,
        goals_count: goalsData.length,
        progress_percentage: progressPercentage,
      });
    } catch (error) {
      console.error('Error fetching team goals summary:', error);
      setTeamGoalsSummary(null);
    }
  };

  const displayDateRange = `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`;

  return (
    <>
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
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/dashboard/occupancy-rate')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Baseado em uma capacidade hipotética de 50 agendamentos.</p>
                <Button 
                  variant="link" 
                  className="text-yellow-500 hover:text-yellow-600 p-0 h-auto mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/dashboard/occupancy-rate');
                  }}
                >
                  Ver análise completa →
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/dashboard/average-ticket')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {averageTicket.toFixed(2).replace('.', ',')}</div>
                <p className="text-xs text-muted-foreground">Média por agendamento finalizado.</p>
                <Button 
                  variant="link" 
                  className="text-yellow-500 hover:text-yellow-600 p-0 h-auto mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/dashboard/average-ticket');
                  }}
                >
                  Ver análise completa →
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/dashboard/client-frequency')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Frequência de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientFrequency}</div>
                <p className="text-xs text-muted-foreground">Clientes únicos no período.</p>
                <Button 
                  variant="link" 
                  className="text-yellow-500 hover:text-yellow-600 p-0 h-auto mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/dashboard/client-frequency');
                  }}
                >
                  Ver análise completa →
                </Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/reports/team-goals')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metas da Equipe</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {teamGoalsSummary ? (
                  <>
                    <div className="text-2xl font-bold">
                      R$ {teamGoalsSummary.total_current_value.toFixed(2).replace('.', ',')}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      de R$ {teamGoalsSummary.total_max_value.toFixed(2).replace('.', ',')} 
                      {' '}({teamGoalsSummary.progress_percentage.toFixed(1)}%)
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          teamGoalsSummary.progress_percentage >= 100 
                            ? 'bg-green-500' 
                            : teamGoalsSummary.progress_percentage >= 50 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(teamGoalsSummary.progress_percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {teamGoalsSummary.goals_count} {teamGoalsSummary.goals_count === 1 ? 'meta ativa' : 'metas ativas'}
                    </p>
                    <Button 
                      variant="link" 
                      className="text-yellow-500 hover:text-yellow-600 p-0 h-auto mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/reports/team-goals');
                      }}
                    >
                      Ver detalhes completos →
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-400">--</div>
                    <p className="text-xs text-muted-foreground mb-2">Nenhuma meta cadastrada</p>
                    <Button 
                      variant="link" 
                      className="text-yellow-500 hover:text-yellow-600 p-0 h-auto mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/reports/team-goals');
                      }}
                    >
                      Criar metas →
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {/* Card Ranking de Profissionais */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ranking de Profissionais</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xs font-bold mb-2">Top 3 do mês</div>
              <ul className="space-y-1">
                <li className="flex items-center justify-between">
                  <span className="font-semibold">João Silva</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">120 atendimentos</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-semibold">Maria Souza</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">110 atendimentos</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-semibold">Carlos Lima</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">98 atendimentos</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Card Aniversariantes do Mês */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aniversariantes do Mês</CardTitle>
              <Cake className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                <li className="flex items-center justify-between">
                  <span className="font-semibold">Ana Paula</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">08/12</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-semibold">Rafael Costa</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">15/12</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-semibold">Juliana Alves</span>
                  <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">22/12</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Card Campanhas de Marketing */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas de Marketing</CardTitle>
              <Bell className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xs font-bold mb-2">Ativas</div>
              <ul className="space-y-1">
                <li className="flex items-center justify-between">
                  <span className="font-semibold">Promoção Fim de Ano</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">WhatsApp</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-semibold">Indique e Ganhe</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">SMS</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Card Gamificação */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gamificação</CardTitle>
              <PieChart className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xs font-bold mb-2">Seu progresso</div>
              <div className="flex items-center space-x-2">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Nível 3</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Badge: Fidelidade</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 transition-all" style={{ width: '70%' }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Complete mais 3 agendamentos para subir de nível!</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <DashboardCharts />
        </div>

        {/* <div className="mt-8 text-center">
          <Button onClick={handleLogout} className="mt-4">
            Sair
          </Button>
        </div> */}
    </>
  );
};

export default Dashboard;