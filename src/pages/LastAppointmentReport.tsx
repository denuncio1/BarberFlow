import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, Search, Clock, MessageCircle, ArrowRight, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface LastAppointmentClient {
  id: string;
  name: string;
  phone: string;
  registrationDate: string;
  lastAppointmentDate: string;
  daysSinceLastAppointment: number;
  barber: string;
  service: string;
  status: 'urgent' | 'warning' | 'recent' | 'active';
}

export default function LastAppointmentReport() {
  const { t } = useTranslation();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<LastAppointmentClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<LastAppointmentClient[]>([]);
  
  // Filters
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    warning: 0,
    recent: 0,
    active: 0
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchLastAppointmentReport();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [clients, dateRange, selectedBarber, searchName, statusFilter]);

  const getClientStatus = (daysSince: number): 'urgent' | 'warning' | 'recent' | 'active' => {
    if (daysSince > 90) return 'urgent';
    if (daysSince > 60) return 'warning';
    if (daysSince > 30) return 'recent';
    return 'active';
  };

  const fetchLastAppointmentReport = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (clientsError) throw clientsError;

      // Fetch appointments
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });
      
      if (aptError) throw aptError;

      // Fetch technicians
      const { data: technicians, error: techError } = await supabase
        .from('technicians')
        .select('id, name')
        .eq('user_id', session.user.id);
      
      if (techError) throw techError;

      setBarbers(technicians || []);

      // Fetch services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name')
        .eq('user_id', session.user.id);
      
      if (servicesError) throw servicesError;

      // Create lookup maps
      const techMap = (technicians || []).reduce((acc: Record<string, string>, tech: any) => {
        acc[tech.id] = tech.name;
        return acc;
      }, {});

      const serviceMap = (services || []).reduce((acc: Record<string, string>, service: any) => {
        acc[service.id] = service.name;
        return acc;
      }, {});

      // Process clients with last appointments
      const today = new Date();
      const clientsWithLastAppointment = (clientsData || [])
        .map((client: any) => {
          const clientApts = (appointments || [])
            .filter((apt: any) => apt.client_id === client.id)
            .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

          if (clientApts.length === 0) return null;

          const lastApt = clientApts[0];
          const daysSince = differenceInDays(today, parseISO(lastApt.appointment_date));

          return {
            id: client.id,
            name: client.name,
            phone: client.phone || '',
            registrationDate: client.created_at,
            lastAppointmentDate: lastApt.appointment_date,
            daysSinceLastAppointment: daysSince,
            barber: techMap[lastApt.technician_id] || 'N/A',
            service: serviceMap[lastApt.service_id] || 'N/A',
            status: getClientStatus(daysSince),
          };
        })
        .filter((client): client is LastAppointmentClient => client !== null)
        .sort((a, b) => b.daysSinceLastAppointment - a.daysSinceLastAppointment);

      setClients(clientsWithLastAppointment);
      setFilteredClients(clientsWithLastAppointment);

      // Calculate stats
      const newStats = {
        total: clientsWithLastAppointment.length,
        urgent: clientsWithLastAppointment.filter(c => c.status === 'urgent').length,
        warning: clientsWithLastAppointment.filter(c => c.status === 'warning').length,
        recent: clientsWithLastAppointment.filter(c => c.status === 'recent').length,
        active: clientsWithLastAppointment.filter(c => c.status === 'active').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching last appointment report:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Filter by date range (registration date)
    if (dateRange.from) {
      filtered = filtered.filter(client => {
        const regDate = new Date(client.registrationDate);
        return regDate >= dateRange.from!;
      });
    }
    if (dateRange.to) {
      filtered = filtered.filter(client => {
        const regDate = new Date(client.registrationDate);
        return regDate <= dateRange.to!;
      });
    }

    // Filter by barber
    if (selectedBarber !== 'all') {
      filtered = filtered.filter(client => client.barber === selectedBarber);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Filter by name
    if (searchName.trim()) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  };

  const handleSearch = () => {
    applyFilters();
  };

  const exportToExcel = () => {
    const csvContent = [
      ['DADOS DO CLIENTE', 'DATA DE CADASTRO', 'ÚLTIMO AGENDAMENTO', 'DIAS DESDE ÚLTIMO', 'STATUS', 'BARBEIRO', 'SERVIÇOS'].join(','),
      ...filteredClients.map(client => [
        `"${client.name} ${client.phone}"`,
        format(parseISO(client.registrationDate), 'dd/MM/yyyy'),
        format(parseISO(client.lastAppointmentDate), 'dd/MM/yyyy'),
        client.daysSinceLastAppointment,
        client.status === 'urgent' ? 'Urgente (>90 dias)' : 
        client.status === 'warning' ? 'Atenção (60-90 dias)' : 
        client.status === 'recent' ? 'Recente (30-60 dias)' : 'Ativo (<30 dias)',
        client.barber,
        client.service
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ultimo_agendamento_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string, days: number) => {
    switch (status) {
      case 'urgent':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Urgente ({days} dias)
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Atenção ({days} dias)
          </Badge>
        );
      case 'recent':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <Clock className="h-3 w-3 mr-1" />
            Recente ({days} dias)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativo ({days} dias)
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-foreground">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Relatório de último agendamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise de inatividade e reengajamento de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-yellow-500 text-black hover:bg-yellow-600">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send notification
          </Button>
          <Button variant="outline" className="bg-yellow-500 text-black hover:bg-yellow-600" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar em excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgente</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground">&gt;90 dias sem visita</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.warning}</div>
            <p className="text-xs text-muted-foreground">60-90 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.recent}</div>
            <p className="text-xs text-muted-foreground">30-60 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativo</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <p className="text-xs text-muted-foreground">&lt;30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "01/11/2025"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">End</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "30/11/2025"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter by Barber */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por barbeiro</label>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.name}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="urgent">Urgente (&gt;90 dias)</SelectItem>
                  <SelectItem value="warning">Atenção (60-90 dias)</SelectItem>
                  <SelectItem value="recent">Recente (30-60 dias)</SelectItem>
                  <SelectItem value="active">Ativo (&lt;30 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search by Client Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por nome do cliente</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do cliente"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} className="bg-yellow-500 text-black hover:bg-yellow-600">
                  <Search className="h-4 w-4" />
                  Pesquisar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">DADOS DO CLIENTE</TableHead>
                  <TableHead className="font-bold">DATA DE CADASTRO</TableHead>
                  <TableHead className="font-bold">ÚLTIMO AGENDAMENTO</TableHead>
                  <TableHead className="font-bold">STATUS</TableHead>
                  <TableHead className="font-bold">BARBEIRO</TableHead>
                  <TableHead className="font-bold">SERVIÇOS</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{client.name}</div>
                        {client.phone && (
                          <div className="text-sm text-yellow-500">{client.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{format(parseISO(client.registrationDate), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{format(parseISO(client.lastAppointmentDate), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {getStatusBadge(client.status, client.daysSinceLastAppointment)}
                    </TableCell>
                    <TableCell>{client.barber}</TableCell>
                    <TableCell>{client.service}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Footer with count */}
      {filteredClients.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>
      )}
    </div>
  );
}
