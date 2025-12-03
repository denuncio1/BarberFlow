import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Cake, Phone, Gift, MessageCircle, Download } from 'lucide-react';
import { BirthdayWhatsAppDialog } from '@/components/BirthdayWhatsAppDialog';

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

export default function BirthdayReport() {
  const { t } = useTranslation();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [birthdayClients, setBirthdayClients] = useState<BirthdayClient[]>([]);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [selectedBirthdayClient, setSelectedBirthdayClient] = useState<BirthdayClient | undefined>();

  useEffect(() => {
    if (session?.user?.id) {
      fetchBirthdayClients();
    }
  }, [session]);

  const fetchBirthdayClients = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      // Fetch all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .order('first_name');
      
      if (clientsError) throw clientsError;
      
      // Filter only clients with birth_date (if column exists)
      const clientsWithBirthDate = (clientsData || []).filter((c: any) => c.birth_date);

      // Fetch all appointments
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'completed');
      
      if (aptError) throw aptError;

      // Birthday clients (next 30 days)
      const today = new Date();
      const birthdayList = clientsWithBirthDate
        .map((client: any) => {
          const birthDate = parseISO(client.birth_date);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
          
          const nextBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
          const daysUntil = differenceInDays(nextBirthday, today);
          const age = today.getFullYear() - birthDate.getFullYear();

          const clientApts = (appointments || []).filter((apt: any) => apt.client_id === client.id);
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

      setBirthdayClients(birthdayList);
    } catch (error) {
      console.error('Error fetching birthday clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Preparar dados para exportação
    const csvContent = [
      ['Cliente', 'Telefone', 'Data Aniversário', 'Idade', 'Dias até Aniversário', 'Total Visitas', 'Última Visita'].join(','),
      ...birthdayClients.map(client => [
        client.name,
        client.phone || '-',
        format(parseISO(client.birth_date), 'dd/MM'),
        client.age,
        client.daysUntilBirthday === 0 ? 'Hoje!' : client.daysUntilBirthday === 1 ? 'Amanhã' : `${client.daysUntilBirthday} dias`,
        client.totalAppointments,
        client.lastVisit !== '-' ? format(parseISO(client.lastVisit), 'dd/MM/yyyy') : '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aniversariantes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-foreground">Carregando aniversariantes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cake className="h-8 w-8 text-pink-500" />
            Relatório de Aniversariantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Clientes que fazem aniversário nos próximos 30 dias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aniversariantes</CardTitle>
            <Cake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{birthdayClients.length}</div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Gift className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {birthdayClients.filter(c => c.daysUntilBirthday === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Fazem aniversário hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Cake className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {birthdayClients.filter(c => c.daysUntilBirthday <= 7).length}
            </div>
            <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Cake className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{birthdayClients.length}</div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Birthday Clients Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Aniversariantes - Próximos 30 Dias</CardTitle>
            <CardDescription>Lista completa de clientes por ordem de aniversário</CardDescription>
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
          {birthdayClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cake className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum aniversariante nos próximos 30 dias</p>
            </div>
          ) : (
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
                  <TableRow 
                    key={client.id} 
                    className={client.daysUntilBirthday === 0 ? 'bg-yellow-50 dark:bg-yellow-950' : ''}
                  >
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
          )}
        </CardContent>
      </Card>

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
