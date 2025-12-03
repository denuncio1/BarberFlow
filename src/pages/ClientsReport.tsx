import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, parseISO, differenceInDays, isWithinInterval, addDays, isSameDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarIcon, Download, Users, UserPlus, TrendingUp, DollarSign, Gift, Clock, Calendar as CalendarCheck, CreditCard, Phone, Mail, MapPin, Cake, MessageCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { BirthdayWhatsAppDialog } from '@/components/BirthdayWhatsAppDialog';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  birth_date: string;
  address: string;
  created_at: string;
  balance: number;
  totalAppointments: number;
  totalSpent: number;
  lastVisit: string;
  avgTicket: number;
  daysAsClient: number;
  preferredService: string;
  appointmentFrequency: number;
}

interface BirthdayClient {
  id: string;
  name: string;
  phone: string;
  birth_date: string;
  daysUntilBirthday: number;
  age: number;
  lastVisit: string;
  totalAppointments: number;
}

interface NewClient {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  firstAppointment: string;
  hasAppointment: boolean;
  daysAsClient: number;
}

interface AppointmentBehavior {
  hour: number;
  count: number;
  dayOfWeek: string;
  weekdayCount: number;
  weekendCount: number;
  preferredTechnician: string;
}

export default function ClientsReport() {
  const { t } = useTranslation();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [birthdayClients, setBirthdayClients] = useState<BirthdayClient[]>([]);
  const [newClients, setNewClients] = useState<NewClient[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [newClientsCount, setNewClientsCount] = useState(0);
  const [avgLifetimeValue, setAvgLifetimeValue] = useState(0);
  
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [weekdayData, setWeekdayData] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  
  // WhatsApp Dialog State
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [selectedBirthdayClient, setSelectedBirthdayClient] = useState<BirthdayClient | undefined>();

  useEffect(() => {
    console.log('useEffect triggered - session:', session?.user?.id, 'dateRange:', dateRange);
    if (session?.user?.id) {
      fetchClientsReport();
    } else {
      console.log('No session or user ID, setting loading to false');
      setLoading(false);
    }
  }, [session, dateRange]);

  const fetchClientsReport = async () => {
    if (!session?.user?.id) {
      console.log('No session user ID, skipping fetch');
      return;
    }
    
    console.log('Starting fetchClientsReport...');
    setLoading(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      console.log('Date range:', startDate, 'to', endDate);

      // Fetch all clients
      console.log('Fetching clients...');
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (clientsError) {
        console.error('Clients error:', clientsError);
        throw clientsError;
      }
      console.log('Clients fetched:', clientsData?.length);

      // Fetch all appointments
      console.log('Fetching appointments...');
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['completed', 'confirmed']);
      
      if (aptError) {
        console.error('Appointments error:', aptError);
        throw aptError;
      }
      console.log('Appointments fetched:', appointments?.length);

      // Fetch services for pricing
      console.log('Fetching services...');
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, price')
        .eq('user_id', session.user.id);
      
      if (servicesError) {
        console.error('Services error:', servicesError);
        throw servicesError;
      }
      console.log('Services fetched:', services?.length);

      const servicePrices = (services || []).reduce((acc: Record<string, any>, service: any) => {
        acc[service.id] = service;
        return acc;
      }, {});

      // Fetch technicians
      const { data: technicians, error: techError } = await supabase
        .from('technicians')
        .select('id, name')
        .eq('user_id', session.user.id);
      
      if (techError) throw techError;

      const techNames = (technicians || []).reduce((acc: Record<string, string>, tech: any) => {
        acc[tech.id] = tech.name;
        return acc;
      }, {});

      // Process clients data
      const processedClients = (clientsData || []).map((client: any) => {
        const clientApts = (appointments || []).filter((apt: any) => apt.client_id === client.id);
        const completedApts = clientApts.filter((apt: any) => apt.status === 'completed');
        
        const totalSpent = completedApts.reduce((sum: number, apt: any) => {
          const service = servicePrices[apt.service_id];
          return sum + (service?.price || 0);
        }, 0);

        const serviceCounts = completedApts.reduce((acc: Record<string, number>, apt: any) => {
          const service = servicePrices[apt.service_id];
          if (service) {
            acc[service.name] = (acc[service.name] || 0) + 1;
          }
          return acc;
        }, {});

        const preferredService = Object.entries(serviceCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '-';
        
        const lastVisit = completedApts.length > 0 
          ? completedApts.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0].appointment_date
          : null;

        const daysAsClient = differenceInDays(new Date(), parseISO(client.created_at));
        const appointmentFrequency = daysAsClient > 0 ? (completedApts.length / daysAsClient) * 30 : 0;

        return {
          id: client.id,
          name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Nome não informado',
          phone: client.phone,
          email: client.email,
          birth_date: client.birth_date,
          address: client.address,
          created_at: client.created_at,
          balance: client.balance || 0,
          totalAppointments: completedApts.length,
          totalSpent,
          lastVisit: lastVisit || '-',
          avgTicket: completedApts.length > 0 ? totalSpent / completedApts.length : 0,
          daysAsClient,
          preferredService,
          appointmentFrequency,
        };
      });

      // Birthday clients (next 30 days)
      const today = new Date();
      const birthdayList = (clientsData || [])
        .filter((client: any) => client.birth_date)
        .map((client: any) => {
          const birthDate = parseISO(client.birth_date);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
          
          const nextBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
          const daysUntil = differenceInDays(nextBirthday, today);
          const age = today.getFullYear() - birthDate.getFullYear();

          const clientApts = (appointments || []).filter((apt: any) => apt.client_id === client.id && apt.status === 'completed');
          const lastVisit = clientApts.length > 0 
            ? clientApts.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0].appointment_date
            : null;

          return {
            id: client.id,
            name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Nome não informado',
            phone: client.phone,
            birth_date: client.birth_date,
            daysUntilBirthday: daysUntil,
            age,
            lastVisit: lastVisit || '-',
            totalAppointments: clientApts.length,
          };
        })
        .filter((client: any) => client.daysUntilBirthday >= 0 && client.daysUntilBirthday <= 30)
        .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

      // New clients in period
      const newClientsList = (clientsData || [])
        .filter((client: any) => {
          const createdDate = parseISO(client.created_at);
          return isWithinInterval(createdDate, { start: dateRange.from, end: dateRange.to });
        })
        .map((client: any) => {
          const clientApts = (appointments || []).filter((apt: any) => apt.client_id === client.id);
          const firstApt = clientApts.length > 0 
            ? clientApts.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0].appointment_date
            : null;

          return {
            id: client.id,
            name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Nome não informado',
            phone: client.phone,
            created_at: client.created_at,
            firstAppointment: firstApt || '-',
            hasAppointment: clientApts.length > 0,
            daysAsClient: differenceInDays(new Date(), parseISO(client.created_at)),
          };
        });

      // Appointment behavior analysis
      const hourCounts: Record<number, number> = {};
      const dayCounts: Record<string, number> = {};
      const techCounts: Record<string, number> = {};

      (appointments || []).forEach((apt: any) => {
        const aptDate = parseISO(apt.appointment_date);
        const hour = aptDate.getHours();
        const dayOfWeek = aptDate.getDay();
        
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        
        const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek];
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;

        if (apt.technician_id) {
          techCounts[apt.technician_id] = (techCounts[apt.technician_id] || 0) + 1;
        }
      });

      const hourlyChartData = Object.entries(hourCounts).map(([hour, count]) => ({
        hour: `${hour}:00`,
        agendamentos: count,
      })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      const weekdayChartData = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => ({
        dia: day,
        agendamentos: dayCounts[day] || 0,
      }));

      // Retention analysis (clients by appointment count)
      const retentionRanges = [
        { range: '1-2 visitas', min: 1, max: 2, count: 0 },
        { range: '3-5 visitas', min: 3, max: 5, count: 0 },
        { range: '6-10 visitas', min: 6, max: 10, count: 0 },
        { range: '11-20 visitas', min: 11, max: 20, count: 0 },
        { range: '21+ visitas', min: 21, max: Infinity, count: 0 },
      ];

      processedClients.forEach((client: Client) => {
        const range = retentionRanges.find(r => client.totalAppointments >= r.min && client.totalAppointments <= r.max);
        if (range) range.count++;
      });

      // Set states
      setClients(processedClients);
      setBirthdayClients(birthdayList);
      setNewClients(newClientsList);
      setTotalClients(clientsData?.length || 0);
      setActiveClients(processedClients.filter(c => c.totalAppointments > 0).length);
      setNewClientsCount(newClientsList.length);
      
      const totalLifetimeValue = processedClients.reduce((sum, c) => sum + c.totalSpent, 0);
      setAvgLifetimeValue(processedClients.length > 0 ? totalLifetimeValue / processedClients.length : 0);

      setHourlyData(hourlyChartData);
      setWeekdayData(weekdayChartData);
      setRetentionData(retentionRanges);

      console.log('All data processed successfully, setting loading to false');
    } catch (error) {
      console.error('Error fetching clients report:', error);
      // Even if there's an error, stop loading to show the UI
    } finally {
      console.log('Finally block - setting loading to false');
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const menuItems = [
    { id: 'general', label: t('general') || 'Geral', icon: Users },
    { id: 'birthdays', label: t('birthdays') || 'Aniversariantes', icon: Cake },
    { id: 'new_clients', label: t('new_clients') || 'Novos clientes', icon: UserPlus },
    { id: 'first_appointment', label: t('first_appointment') || 'Primeiro agendamento', icon: CalendarCheck },
    { id: 'last_appointment', label: t('last_appointment') || 'Último agendamento', icon: Clock },
    { id: 'behavior', label: t('behavior') || 'Comportamento de Agendamento', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-foreground">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Menu */}
      <div className="w-64 border-r p-4 space-y-2 flex-shrink-0">
        <div className="mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('clients_report_title') || 'Clients'}
          </h2>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                console.log('Changing tab to:', item.id);
                setActiveTab(item.id);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                {menuItems.find(m => m.id === activeTab)?.label || t('clients_report_title')}
              </h1>
              <p className="text-muted-foreground">{t('clients_report_description')}</p>
            </div>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              {t('export_excel')}
            </Button>
          </div>

          {/* Date Filter - Only show on general tab */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('analysis_period')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('start_date')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[200px] justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(dateRange.from, 'dd/MM/yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('end_date')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[200px] justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(dateRange.to, 'dd/MM/yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

      {/* Summary Cards */}
      {activeTab === 'general' && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('total_clients')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">{activeClients} {t('active_clients')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newClientsCount}</div>
            <p className="text-xs text-muted-foreground">{t('in_selected_period')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio Vitalício</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {avgLifetimeValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Receita média por cliente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aniversariantes</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{birthdayClients.length}</div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>
      </div>
      )}

          {/* General Tab - Client Breakdown */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Title Section */}
            <div>
              <h2 className="text-2xl font-bold">Client breakdown</h2>
              <p className="text-sm text-muted-foreground">Unidade: SELECT BARBER CLUB</p>
            </div>

            {/* Summary Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {clients.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Product sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {clients.reduce((sum, c) => sum + (c.totalSpent * 0.1), 0).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Comandas no total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.reduce((sum, c) => sum + c.totalAppointments, 0)}</div>
                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-xs">🟡 {Math.floor(clients.reduce((sum, c) => sum + c.totalAppointments, 0) * 0.07)} comandas Awaiting</p>
                    <p className="text-xs">🔴 {Math.floor(clients.reduce((sum, c) => sum + c.totalAppointments, 0) * 0.002)} comandas Pending</p>
                    <p className="text-xs">🔵 0 comandas Confirmadas</p>
                    <p className="text-xs">🟢 {Math.floor(clients.reduce((sum, c) => sum + c.totalAppointments, 0) * 0.92)} comandas Finalizadas</p>
                    <p className="text-xs">⚫ {Math.floor(clients.reduce((sum, c) => sum + c.totalAppointments, 0) * 0.04)} comandas Cliente faltante</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Sales of services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {clients.reduce((sum, c) => sum + (c.totalSpent * 0.9), 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-normal text-muted-foreground">Clientes distintos em {clients.reduce((sum, c) => sum + c.totalAppointments, 0)} comandas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Novos clientes cadastrados e {clients.filter(c => c.totalAppointments > 0).length} deles agendaram
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('new_clients')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{newClientsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {t('new_registered')} {newClients.filter(c => c.hasAppointment).length} {t('scheduled')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart and Filters Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Client breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={clients.slice(0, 30).map(c => ({
                        name: c.name.split(' ')[0],
                        value: c.totalSpent,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={0}
                    >
                      {clients.slice(0, 30).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start</label>
                    <Input type="date" defaultValue={format(dateRange.from, 'yyyy-MM-dd')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End</label>
                    <Input type="date" defaultValue={format(dateRange.to, 'yyyy-MM-dd')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status das comandas</label>
                    <select className="w-full h-10 px-3 border rounded-md bg-background">
                      <option>All</option>
                      <option>Awaiting</option>
                      <option>Pending</option>
                      <option>Confirmadas</option>
                      <option>Finalizadas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo das comandas</label>
                    <select className="w-full h-10 px-3 border rounded-md bg-background">
                      <option>Agendamentos</option>
                      <option>Produtos</option>
                      <option>Serviços</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ordenar por</label>
                    <select className="w-full h-10 px-3 border rounded-md bg-background">
                      <option>Valor total</option>
                      <option>Quantidade</option>
                      <option>Nome</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">
                      🔍 Pesquisar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead></TableHead>
                    <TableHead className="font-semibold">CUSTOMER</TableHead>
                    <TableHead className="text-center font-semibold">AGENDAMENTOS</TableHead>
                    <TableHead className="text-right font-semibold">TOTAL AMOUNT OF PRODUCTS</TableHead>
                    <TableHead className="text-right font-semibold">TOTAL AMOUNT SERVICES</TableHead>
                    <TableHead className="text-right font-semibold">DISCOUNTS OFFERED</TableHead>
                    <TableHead className="text-right font-semibold">TOTAL</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .map((client) => {
                      const productTotal = client.totalSpent * 0.15; // Simulação de produtos
                      const serviceTotal = client.totalSpent * 0.85; // Simulação de serviços
                      const discount = client.totalSpent * 0.05; // Simulação de desconto
                      const isOnline = client.totalAppointments > 0;
                      
                      return (
                        <TableRow key={client.id} className="hover:bg-muted/50">
                          <TableCell className="w-4">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              isOnline ? "bg-green-500" : "bg-yellow-500"
                            )} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md bg-yellow-500 flex items-center justify-center">
                                <Users className="h-5 w-5 text-yellow-900" />
                              </div>
                              <div>
                                <p className="font-medium">{client.name}</p>
                                <p className="text-xs text-muted-foreground">{client.phone}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-medium">{client.totalAppointments}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {productTotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {serviceTotal.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-500">
                            R$ {discount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            R$ {client.totalSpent.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              →
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Birthdays Tab */}
        {activeTab === 'birthdays' && (
          <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Aniversariantes - Próximos 30 Dias</CardTitle>
                <CardDescription>Clientes que fazem aniversário em breve</CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setSelectedBirthdayClient(undefined);
                  setWhatsappDialogOpen(true);
                }}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar Mensagens em Massa
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data Aniversário</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Dias até Aniversário</TableHead>
                    <TableHead>Total Visitas</TableHead>
                    <TableHead>Última Visita</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {birthdayClients.map((client) => (
                    <TableRow key={client.id} className={client.daysUntilBirthday === 0 ? 'bg-yellow-50 dark:bg-yellow-950' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Cake className="h-4 w-4 text-pink-500" />
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{format(parseISO(client.birth_date), 'dd/MM')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.age} anos</Badge>
                      </TableCell>
                      <TableCell>
                        {client.daysUntilBirthday === 0 ? (
                          <Badge className="bg-yellow-500">Hoje!</Badge>
                        ) : client.daysUntilBirthday === 1 ? (
                          <Badge variant="destructive">Amanhã</Badge>
                        ) : (
                          <span>{client.daysUntilBirthday} dias</span>
                        )}
                      </TableCell>
                      <TableCell>{client.totalAppointments}</TableCell>
                      <TableCell>
                        {client.lastVisit !== '-' ? format(parseISO(client.lastVisit), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedBirthdayClient(client);
                            setWhatsappDialogOpen(true);
                          }}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Enviar Mensagem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </div>
        )}

        {/* New Clients Tab */}
        {activeTab === 'new_clients' && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Novos Clientes no Período</CardTitle>
              <CardDescription>Clientes cadastrados entre {format(dateRange.from, 'dd/MM/yyyy')} e {format(dateRange.to, 'dd/MM/yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Dias como Cliente</TableHead>
                    <TableHead>Primeiro Agendamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>{format(parseISO(client.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{client.daysAsClient} dias</Badge>
                      </TableCell>
                      <TableCell>
                        {client.firstAppointment !== '-' 
                          ? format(parseISO(client.firstAppointment), 'dd/MM/yyyy HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {client.hasAppointment ? (
                          <Badge className="bg-green-500">Com Agendamento</Badge>
                        ) : (
                          <Badge variant="secondary">Sem Agendamento</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </div>
        )}

        {/* First Appointment Tab */}
        {activeTab === 'first_appointment' && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Aguardando Primeiro Agendamento</CardTitle>
              <CardDescription>Clientes cadastrados mas sem agendamentos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Dias Aguardando</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients
                    .filter(c => c.totalAppointments === 0)
                    .map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell>{format(parseISO(client.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={client.daysAsClient > 7 ? 'destructive' : 'outline'}>
                            {client.daysAsClient} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <CalendarCheck className="h-4 w-4 mr-1" />
                            Agendar Visita
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Last Appointment Tab */}
        {activeTab === 'last_appointment' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Último Agendamento por Cliente</CardTitle>
                <CardDescription>Histórico da última visita de cada cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Última Visita</TableHead>
                      <TableHead>Dias Desde Última Visita</TableHead>
                      <TableHead>Serviço Preferido</TableHead>
                      <TableHead>Total de Visitas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients
                      .sort((a, b) => {
                        const dateA = a.lastVisit !== '-' ? new Date(a.lastVisit).getTime() : 0;
                        const dateB = b.lastVisit !== '-' ? new Date(b.lastVisit).getTime() : 0;
                        return dateB - dateA;
                      })
                      .map((client) => {
                        const daysSinceLastVisit = client.lastVisit !== '-' 
                          ? differenceInDays(new Date(), parseISO(client.lastVisit))
                          : null;
                        
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.phone}</TableCell>
                            <TableCell>
                              {client.lastVisit !== '-' ? format(parseISO(client.lastVisit), 'dd/MM/yyyy') : 'Nunca'}
                            </TableCell>
                            <TableCell>
                              {daysSinceLastVisit !== null ? (
                                <Badge variant={daysSinceLastVisit > 60 ? 'destructive' : daysSinceLastVisit > 30 ? 'secondary' : 'default'}>
                                  {daysSinceLastVisit} dias
                                </Badge>
                              ) : (
                                <Badge variant="outline">N/A</Badge>
                              )}
                            </TableCell>
                            <TableCell>{client.preferredService}</TableCell>
                            <TableCell>
                              <Badge>{client.totalAppointments}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Behavior Tab */}
        {activeTab === 'behavior' && (
          <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Horário</CardTitle>
                <CardDescription>Preferência de horário dos clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="agendamentos" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Dia da Semana</CardTitle>
                <CardDescription>Dias mais movimentados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="agendamentos" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Padrões de Comportamento</CardTitle>
              <CardDescription>Análise detalhada de frequência</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total Visitas</TableHead>
                    <TableHead className="text-right">Frequência Mensal</TableHead>
                    <TableHead>Última Visita</TableHead>
                    <TableHead>Serviço Preferido</TableHead>
                    <TableHead>Padrão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients
                    .filter(c => c.totalAppointments > 0)
                    .sort((a, b) => b.appointmentFrequency - a.appointmentFrequency)
                    .slice(0, 20)
                    .map((client) => {
                      let pattern = '';
                      let patternVariant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
                      
                      if (client.appointmentFrequency >= 4) {
                        pattern = 'Muito Frequente';
                        patternVariant = 'default';
                      } else if (client.appointmentFrequency >= 2) {
                        pattern = 'Frequente';
                        patternVariant = 'secondary';
                      } else if (client.appointmentFrequency >= 1) {
                        pattern = 'Regular';
                        patternVariant = 'outline';
                      } else {
                        pattern = 'Esporádico';
                        patternVariant = 'destructive';
                      }

                      return (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell className="text-right">{client.totalAppointments}</TableCell>
                          <TableCell className="text-right">{client.appointmentFrequency.toFixed(1)}x/mês</TableCell>
                          <TableCell>
                            {client.lastVisit !== '-' ? format(parseISO(client.lastVisit), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{client.preferredService}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={patternVariant}>{pattern}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total em Créditos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {clients.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {clients.filter(c => c.balance > 0).length} clientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total em Débitos</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {Math.abs(clients.filter(c => c.balance < 0).reduce((sum, c) => sum + c.balance, 0)).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {clients.filter(c => c.balance < 0).length} clientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {clients.reduce((sum, c) => sum + c.balance, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Créditos - Débitos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Clientes com Créditos/Débitos</CardTitle>
              <CardDescription>Saldos pendentes de acerto</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Total Visitas</TableHead>
                    <TableHead className="text-right">Total Gasto</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Última Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients
                    .filter(c => c.balance !== 0)
                    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                    .map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell className="text-right">{client.totalAppointments}</TableCell>
                        <TableCell className="text-right">R$ {client.totalSpent.toFixed(2)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-bold",
                          client.balance > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          R$ {client.balance.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.balance > 0 ? 'default' : 'destructive'}>
                            {client.balance > 0 ? 'Crédito' : 'Débito'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.lastVisit !== '-' ? format(parseISO(client.lastVisit), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Fallback - Debug */}
        {!['general', 'birthdays', 'new_clients', 'first_appointment', 'last_appointment', 'behavior', 'balance'].includes(activeTab) && (
          <Card>
            <CardContent className="p-6">
              <p>Aba selecionada: {activeTab}</p>
              <p>Esta aba ainda não foi implementada.</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* WhatsApp Birthday Dialog */}
      <BirthdayWhatsAppDialog
        open={whatsappDialogOpen}
        onOpenChange={setWhatsappDialogOpen}
        clients={birthdayClients}
        selectedClient={selectedBirthdayClient}
      />
    </div>
  );
}
