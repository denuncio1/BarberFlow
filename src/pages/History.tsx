"use client";

import React, { useState, useEffect } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { cn } from '@/lib/utils'; // Import 'cn' utility

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  clients: { first_name: string; last_name: string } | null; // Corrected to single object
  technicians: { name: string } | null; // Corrected to single object
  services: { name: string; price: number } | null; // Corrected to single object
  payment_value: number;
  points_earned: number;
}

const HistoryPage = () => {
  const { user } = useSession();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterBarber, setFilterBarber] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect<dyad-problem-report summary="1 problems">
<problem file="src/pages/History.tsx" line="121" column="25" code="2352">Conversion of type '{ payment_value: any; points_earned: number; id: any; appointment_date: any; status: any; clients: { first_name: any; last_name: any; }[]; technicians: { name: any; }[]; services: { name: any; price: any; }[]; }[]' to type 'Appointment[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ payment_value: any; points_earned: number; id: any; appointment_date: any; status: any; clients: { first_name: any; last_name: any; }[]; technicians: { name: any; }[]; services: { name: any; price: any; }[]; }' is not comparable to type 'Appointment'.
    Types of property 'technicians' are incompatible.
      Property 'name' is missing in type '{ name: any; }[]' but required in type '{ name: string; }'.</problem>
</dyad-problem-report><think>**Reviewing the Type Error**

I'm seeing the same TypeScript error again, specifically about the 'name' property. It seems the `Appointment` interface still expects `technicians` to be an array of objects where `name` is a string, but the data is giving me an array of objects where `name` can be anything. This discrepancy needs to be addressed for the code to compile correctly.


**Refining the Technician Mapping**

I've re-examined the type error related to the 'name' property within the `technicians` array.  It appears the `select` query in `History.tsx` is misinterpreting the Supabase relationship. Although the schema indicates a many-to-one relationship from appointments to technicians, the query is treating the `technicians` data as an array when it should be a single object. I need to adjust the query or data mapping to reflect this.


**Troubleshooting the Supabase Response**

I'm back to the TypeScript error with `name` again. It seems the Supabase response for `technicians` is being incorrectly interpreted as an array. Although the database has a many-to-one relationship, the query isn't giving the expected single object. I'll check how the query treats joined tables.


**Pinpointing the Supabase Response**

I'm back to the TypeScript issue with the 'name' property again. The problem stems from how Supabase returns the 'technicians' data. It looks like the data is being treated as an array of objects, which doesn't match the `Appointment` interface's expectation of a single object. I need to figure out why Supabase is interpreting a many-to-one relationship this way. I think the  issue lies in how I'm handling the data after the Supabase query. The solution now seems to be casting the data appropriately, or adjusting the `Appointment` interface.


**Addressing the Data Mapping**

I'm now certain the type error stems from how Supabase returns related data. It looks like my `select` queries always return related tables (like `technicians`) as arrays, even for a many-to-one relationship. So, I need to adjust the `Appointment` interface back to expecting arrays for `clients`, `technicians`, and `services`. This aligns with the data I'm actually receiving and should resolve the type mismatch. I'll test this change to ensure the fix is consistent.


**Adjusting the Return Type**

I've re-examined the type error and noticed a pattern. The Supabase `select` query returns related tables, even those with many-to-one relationships, as arrays. Therefore, I'm now modifying the `Appointment` interface back to expecting arrays for `clients`, `technicians`, and `services`. This change should resolve the consistent type mismatches I've encountered.

</think>Peço desculpas pela confusão e por não ter resolvido isso completamente na primeira tentativa. O erro indica que o TypeScript ainda está inferindo `technicians` como um array de objetos (`{ name: any; }[]`) vindo do Supabase, enquanto a interface `Appointment` espera um único objeto (`{ name: string; }`).

Isso geralmente acontece quando a query `select` do Supabase, mesmo para relacionamentos de "muitos para um", retorna os dados aninhados dentro de um array. Para ser consistente com o que o Supabase provavelmente está retornando e com a correção anterior para `services`, vamos definir `clients`, `technicians` e `services` como **arrays de objetos** na interface `Appointment` e ajustar a forma como acessamos esses dados na tabela.

Aqui está a correção para `src/pages/History.tsx`:

<dyad-write path="src/pages/History.tsx" description="Fixing TypeScript error by consistently defining related entities as arrays in the Appointment interface and adjusting data access.">
"use client";

import React, { useState, useEffect } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { cn } from '@/lib/utils'; // Import 'cn' utility

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  clients: { first_name: string; last_name: string }[] | null; // Changed to array
  technicians: { name: string }[] | null; // Changed to array
  services: { name: string; price: number }[] | null; // Changed to array
  payment_value: number;
  points_earned: number;
}

const HistoryPage = () => {
  const { user } = useSession();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterBarber, setFilterBarber] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchBarbersAndCustomers = async () => {
      if (!user) return;

      const { data: barbersData, error: barbersError } = await supabase
        .from('technicians')
        .select('id, name')
        .eq('user_id', user.id); // Assuming technicians are linked to the current user

      if (barbersError) {
        console.error('Error fetching barbers:', barbersError);
      } else {
        setBarbers(barbersData || []);
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('user_id', user.id); // Assuming clients are linked to the current user

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
      } else {
        setCustomers(clientsData?.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })) || []);
      }
    };

    fetchBarbersAndCustomers();
  }, [user]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      let query = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          clients (first_name, last_name),
          technicians (name),
          services (name, price)
        `)
        .eq('user_id', user.id)
        .gte('appointment_date', format(selectedDate, 'yyyy-MM-dd') + 'T00:00:00.000Z')
        .lt('appointment_date', format(addDays(selectedDate, 1), 'yyyy-MM-dd') + 'T00:00:00.000Z')
        .order('appointment_date', { ascending: true });

      if (!showCancelled) {
        query = query.neq('status', 'cancelled');
      }

      if (filterBarber !== 'all') {
        query = query.eq('technician_id', filterBarber);
      }

      if (filterCustomer !== 'all') {
        query = query.eq('client_id', filterCustomer);
      }

      // Filter by type (e.g., 'completed', 'pending', 'no-show')
      if (filterType !== 'all' && filterType !== 'Todos os Agendamentos') {
        query = query.eq('status', filterType.toLowerCase().replace(' ', '-'));
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching appointments:', fetchError);
        setError('Erro ao carregar agendamentos.');
        setAppointments([]);
      } else {
        // Mock payment_value and points_earned for now, as they are not in the current schema
        const appointmentsWithMockData = data?.map(app => ({
          ...app,
          payment_value: app.services?.[0]?.price || 0, // Access price from the first service in the array
          points_earned: app.status === 'finalized' ? 60 : (app.status === 'no-show' ? 40 : 0), // Example logic
        })) || [];
        setAppointments(appointmentsWithMockData as Appointment[]);
      }
      setLoading(false);
    };

    fetchAppointments();
  }, [selectedDate, showCancelled, filterBarber, filterCustomer, filterType, user]);

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'text-green-500';
      case 'no-show':
        return 'text-yellow-500';
      case 'pending':
        return 'text-orange-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      case 'no-show': return 'Cliente Faltou';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  return (
    <div className="p-4 bg-background text-foreground min-h-full">
      <h1 className="text-3xl font-bold mb-6">Histórico</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-lg">
            {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select onValueChange={setFilterType} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo: Todos os Agendamentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Agendamentos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="completed">Finalizados</SelectItem>
            <SelectItem value="no-show">Cliente Faltou</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterBarber} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Barbeiro: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {barbers.map(barber => (
              <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterCustomer} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cliente: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2 ml-auto">
          <Checkbox
            id="showCancelled"
            checked={showCancelled}
            onCheckedChange={(checked) => setShowCancelled(checked as boolean)}
          />
          <label
            htmlFor="showCancelled"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Exibir agendamentos cancelados
          </label>
        </div>
      </div>

      {loading ? (
        <p>Carregando histórico...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">HORA</TableHead>
                <TableHead>CLIENTE</TableHead>
                <TableHead>BARBEIRO</TableHead>
                <TableHead>SERVIÇO</TableHead>
                <TableHead>PAGAMENTO</TableHead>
                <TableHead className="text-right">VALOR</TableHead>
                <TableHead className="text-right">PONTOS</TableHead>
                <TableHead className="text-center">STATUS</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {format(new Date(appointment.appointment_date), 'HH:mm', { locale: ptBR })} - {format(addDays(new Date(appointment.appointment_date), 0, /* assuming 1 hour duration for now */), 'HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{appointment.clients?.[0] ? `${appointment.clients[0].first_name} ${appointment.clients[0].last_name}` : 'N/A'}</TableCell>
                    <TableCell>{appointment.technicians?.[0]?.name || 'N/A'}</TableCell>
                    <TableCell>{appointment.services?.[0]?.name || 'N/A'}</TableCell>
                    <TableCell>Pagamento pendente</TableCell> {/* Placeholder */}
                    <TableCell className="text-right">R$ {appointment.payment_value.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell className="text-right">{appointment.points_earned}</TableCell>
                    <TableCell className={cn("text-center font-medium", getStatusColor(appointment.status))}>
                      {formatStatus(appointment.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Nenhum agendamento encontrado para esta data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;