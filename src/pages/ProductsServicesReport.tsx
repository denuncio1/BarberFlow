import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Download, TrendingUp, TrendingDown, DollarSign, Package, Users, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ServiceStats {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  totalSales: number;
  totalRevenue: number;
  discounts: number;
  netRevenue: number;
  uniqueClients: number;
  avgUsagePerClient: number;
  percentageOfTotal: number;
  signatureUsage: number;
  regularUsage: number;
}

interface ProductStats {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  totalSold: number;
  totalRevenue: number;
  percentageOfTotal: number;
  profitMargin: number;
}

interface TechnicianPerformance {
  id: string;
  name: string;
  totalServices: number;
  totalRevenue: number;
  topService: string;
  avgTicket: number;
}

export default function ProductsServicesReport() {
  const { t } = useTranslation();
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  const [services, setServices] = useState<ServiceStats[]>([]);
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianPerformance[]>([]);
  
  const [filterType, setFilterType] = useState<'all' | 'service' | 'product'>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'name'>('revenue');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');

  // Summary metrics
  const [totalServiceRevenue, setTotalServiceRevenue] = useState(0);
  const [totalProductRevenue, setTotalProductRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      fetchReportData();
    }
  }, [session, dateRange, technicianFilter]);

  const fetchReportData = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      // Fetch appointments with services
      let appointmentsQuery = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          service_id,
          technician_id,
          client_id,
          signature_used
        `)
        .eq('user_id', session.user.id)
        .gte('appointment_date', `${startDate}T00:00:00`)
        .lte('appointment_date', `${endDate}T23:59:59`)
        .in('status', ['completed', 'confirmed']);

      if (technicianFilter !== 'all') {
        appointmentsQuery = appointmentsQuery.eq('technician_id', technicianFilter);
      }

      const { data: appointments, error: aptError } = await appointmentsQuery;
      if (aptError) throw aptError;

      // Fetch all services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (servicesError) throw servicesError;

      // Fetch all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (productsError) throw productsError;

      // Fetch technicians
      const { data: techniciansData, error: techError } = await supabase
        .from('technicians')
        .select('id, name')
        .eq('user_id', session.user.id);
      
      if (techError) throw techError;

      // Process services statistics
      const serviceStatsMap = new Map<string, ServiceStats>();
      let totalServiceRev = 0;
      let totalAppointments = 0;

      (appointments || []).forEach((apt: any) => {
        const service = servicesData?.find(s => s.id === apt.service_id);
        if (!service) return;

        totalAppointments++;
        const revenue = service.price || 0;
        totalServiceRev += revenue;

        if (!serviceStatsMap.has(service.id)) {
          serviceStatsMap.set(service.id, {
            id: service.id,
            name: service.name,
            category: service.category || 'Sem categoria',
            price: service.price,
            duration: service.duration,
            totalSales: 0,
            totalRevenue: 0,
            discounts: 0,
            netRevenue: 0,
            uniqueClients: 0,
            avgUsagePerClient: 0,
            percentageOfTotal: 0,
            signatureUsage: 0,
            regularUsage: 0,
          });
        }

        const stats = serviceStatsMap.get(service.id)!;
        stats.totalSales++;
        stats.totalRevenue += revenue;
        stats.netRevenue += revenue;
        
        if (apt.signature_used) {
          stats.signatureUsage++;
        } else {
          stats.regularUsage++;
        }
      });

      // Calculate percentages and unique clients
      const servicesArray = Array.from(serviceStatsMap.values()).map(stat => {
        const serviceAppointments = (appointments || []).filter((apt: any) => apt.service_id === stat.id);
        const uniqueClientIds = new Set(serviceAppointments.map((apt: any) => apt.client_id));
        
        return {
          ...stat,
          percentageOfTotal: totalServiceRev > 0 ? (stat.totalRevenue / totalServiceRev) * 100 : 0,
          uniqueClients: uniqueClientIds.size,
          avgUsagePerClient: uniqueClientIds.size > 0 ? stat.totalSales / uniqueClientIds.size : 0,
        };
      });

      // Process technician performance
      const techPerformanceMap = new Map<string, any>();
      
      (appointments || []).forEach((apt: any) => {
        const service = servicesData?.find(s => s.id === apt.service_id);
        if (!service || !apt.technician_id) return;

        if (!techPerformanceMap.has(apt.technician_id)) {
          const tech = techniciansData?.find(t => t.id === apt.technician_id);
          techPerformanceMap.set(apt.technician_id, {
            id: apt.technician_id,
            name: tech?.name || 'Unknown',
            totalServices: 0,
            totalRevenue: 0,
            services: new Map<string, number>(),
          });
        }

        const techData = techPerformanceMap.get(apt.technician_id);
        techData.totalServices++;
        techData.totalRevenue += service.price || 0;
        
        const serviceCount = techData.services.get(service.name) || 0;
        techData.services.set(service.name, serviceCount + 1);
      });

      const techniciansArray = Array.from(techPerformanceMap.values()).map(tech => {
        const topServiceEntry = Array.from(tech.services.entries()).sort((a, b) => b[1] - a[1])[0];
        return {
          id: tech.id,
          name: tech.name,
          totalServices: tech.totalServices,
          totalRevenue: tech.totalRevenue,
          topService: topServiceEntry ? topServiceEntry[0] : '-',
          avgTicket: tech.totalServices > 0 ? tech.totalRevenue / tech.totalServices : 0,
        };
      });

      // Set states
      setServices(servicesArray);
      setProducts([]); // Products would need appointment_products junction table
      setTechnicians(techniciansArray);
      setTotalServiceRevenue(totalServiceRev);
      setTotalProductRevenue(0);
      setTotalOrders(totalAppointments);
      setAvgTicket(totalAppointments > 0 ? totalServiceRev / totalAppointments : 0);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedServices = [...services].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.totalRevenue - a.totalRevenue;
      case 'quantity':
        return b.totalSales - a.totalSales;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

  const pieChartData = sortedServices.slice(0, 8).map(service => ({
    name: service.name,
    value: service.totalRevenue,
    percentage: service.percentageOfTotal,
  }));

  const categoryData = services.reduce((acc: any[], service) => {
    const existing = acc.find(item => item.category === service.category);
    if (existing) {
      existing.revenue += service.totalRevenue;
      existing.count += service.totalSales;
    } else {
      acc.push({
        category: service.category,
        revenue: service.totalRevenue,
        count: service.totalSales,
      });
    }
    return acc;
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatório de Produtos e Serviços</h1>
          <p className="text-muted-foreground">Análise detalhada de vendas e performance</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar em Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
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
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por</label>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Total em vendas</SelectItem>
                  <SelectItem value="quantity">Quantidade</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por barbeiro</label>
              <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalServiceRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor total bruto subtraídos os descontos oferecidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bruto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalServiceRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor total sem considerar os descontos oferecidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Descontos Oferecidos</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Valor total descontos inseridos nas comandas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comandas no Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {services.reduce((sum, s) => sum + s.totalSales, 0)} serviços lançados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Vendas</CardTitle>
            <CardDescription>Distribuição de receita por serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por Categoria</CardTitle>
            <CardDescription>Comparação entre categorias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="technicians">Performance dos Barbeiros</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Serviços</CardTitle>
              <CardDescription>Métricas detalhadas por serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Lançamentos</TableHead>
                    <TableHead className="text-right">Clientes Únicos</TableHead>
                    <TableHead className="text-right">Média/Cliente</TableHead>
                    <TableHead className="text-right">Total Bruto</TableHead>
                    <TableHead className="text-right">Descontos</TableHead>
                    <TableHead className="text-right">Total Líquido</TableHead>
                    <TableHead className="text-right">% Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          {service.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{service.totalSales}</TableCell>
                      <TableCell className="text-right">{service.uniqueClients}</TableCell>
                      <TableCell className="text-right">{service.avgUsagePerClient.toFixed(1)}</TableCell>
                      <TableCell className="text-right">R$ {service.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-500">-R$ {service.discounts.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">R$ {service.netRevenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{service.percentageOfTotal.toFixed(1)}%</span>
                          <Progress value={service.percentageOfTotal} className="w-16" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Barbeiro</CardTitle>
              <CardDescription>Análise individual de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barbeiro</TableHead>
                    <TableHead className="text-right">Total Serviços</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead>Serviço Mais Vendido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicians.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-medium">{tech.name}</TableCell>
                      <TableCell className="text-right">{tech.totalServices}</TableCell>
                      <TableCell className="text-right">R$ {tech.totalRevenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {tech.avgTicket.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge>{tech.topService}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
