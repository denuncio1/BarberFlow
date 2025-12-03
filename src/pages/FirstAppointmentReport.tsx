import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, Search, UserPlus, MessageCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface FirstAppointmentClient {
  id: string;
  name: string;
  phone: string;
  registrationDate: string;
  firstAppointmentDate: string;
  barber: string;
  service: string;
}

export default function FirstAppointmentReport() {
  const { t } = useTranslation();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<FirstAppointmentClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<FirstAppointmentClient[]>([]);
  
  // Filters
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [searchName, setSearchName] = useState('');
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchFirstAppointmentReport();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [clients, dateRange, selectedBarber, searchName]);

  const fetchFirstAppointmentReport = async () => {
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
        .order('appointment_date', { ascending: true });
      
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

      // Process clients with first appointments
      const clientsWithFirstAppointment = (clientsData || [])
        .map((client: any) => {
          const clientApts = (appointments || [])
            .filter((apt: any) => apt.client_id === client.id)
            .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

          if (clientApts.length === 0) return null;

          const firstApt = clientApts[0];

          return {
            id: client.id,
            name: client.name,
            phone: client.phone || '',
            registrationDate: client.created_at,
            firstAppointmentDate: firstApt.appointment_date,
            barber: techMap[firstApt.technician_id] || 'N/A',
            service: serviceMap[firstApt.service_id] || 'N/A',
          };
        })
        .filter((client): client is FirstAppointmentClient => client !== null);

      setClients(clientsWithFirstAppointment);
      setFilteredClients(clientsWithFirstAppointment);
    } catch (error) {
      console.error('Error fetching first appointment report:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Filter by date range
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
      ['DADOS DO CLIENTE', 'DATA DE CADASTRO', '1º AGENDAMENTO', 'BARBEIRO', 'SERVIÇOS'].join(','),
      ...filteredClients.map(client => [
        `"${client.name} ${client.phone}"`,
        format(parseISO(client.registrationDate), 'dd/MM/yyyy'),
        format(parseISO(client.firstAppointmentDate), 'dd/MM/yyyy'),
        client.barber,
        client.service
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `primeiro_agendamento_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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
            <UserPlus className="h-8 w-8" />
            Relatório de primeiro agendamento
          </h1>
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">DADOS DO CLIENTE</TableHead>
                  <TableHead className="font-bold">DATA DE CADASTRO</TableHead>
                  <TableHead className="font-bold">1º AGENDAMENTO</TableHead>
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
                    <TableCell>{format(parseISO(client.firstAppointmentDate), 'dd/MM/yyyy')}</TableCell>
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
