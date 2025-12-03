import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, Search, TrendingUp, TrendingDown, Users, Package, Calendar as CalendarLucide, Clock, ArrowRight, Percent, Award } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";

interface ClientBehavior {
  id: string;
  name: string;
  phone: string;
  totalAppointments: number;
  signatureAppointments: number;
  packageAppointments: number;
  normalAppointments: number;
  preferredType: "Assinatura" | "Pacote" | "Normal";
  preferredBarber: string;
  preferredService: string;
  lastAppointmentDate: string;
  averageInterval: number; // days between appointments
  loyalty: "Alto" | "Médio" | "Baixo";
}

interface BehaviorStats {
  totalClients: number;
  signaturePreference: number;
  signaturePercentage: number;
  packagePreference: number;
  packagePercentage: number;
  normalPreference: number;
  normalPercentage: number;
  highLoyalty: number;
  mediumLoyalty: number;
  lowLoyalty: number;
}

export default function AppointmentBehaviorReport() {
  const { t } = useTranslation();
  const { session } = useSession();
  const [clients, setClients] = useState<ClientBehavior[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientBehavior[]>([]);
  const [stats, setStats] = useState<BehaviorStats>({
    totalClients: 0,
    signaturePreference: 0,
    signaturePercentage: 0,
    packagePreference: 0,
    packagePercentage: 0,
    normalPreference: 0,
    normalPercentage: 0,
    highLoyalty: 0,
    mediumLoyalty: 0,
    lowLoyalty: 0,
  });
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);

  // Filters
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedBarber, setSelectedBarber] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedLoyalty, setSelectedLoyalty] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (session?.user?.id) {
      fetchBarbers();
      fetchBehaviorData();
    }
  }, [session, startDate, endDate]);

  useEffect(() => {
    applyFilters();
  }, [clients, selectedBarber, selectedType, selectedLoyalty, searchTerm]);

  const fetchBarbers = async () => {
    if (!session?.user?.id) return;
    
    const { data, error } = await supabase
      .from("technicians")
      .select("id, name")
      .eq("user_id", session.user.id)
      .order("name");

    if (error) {
      console.error("Error fetching barbers:", error);
      return;
    }

    setBarbers(data || []);
  };

  const calculateLoyalty = (totalAppointments: number, averageInterval: number): "Alto" | "Médio" | "Baixo" => {
    // High loyalty: 10+ appointments or visits every 30 days or less
    if (totalAppointments >= 10 || averageInterval <= 30) return "Alto";
    // Medium loyalty: 5-9 appointments or visits every 30-60 days
    if (totalAppointments >= 5 || averageInterval <= 60) return "Médio";
    // Low loyalty: less than 5 appointments or visits every 60+ days
    return "Baixo";
  };

  const fetchBehaviorData = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);

      const start = startDate ? format(startDate, "yyyy-MM-dd") : null;
      const end = endDate ? format(endDate, "yyyy-MM-dd") : null;

      // Fetch all appointments in the period
      let appointmentsQuery = supabase
        .from("appointments")
        .select(`
          id,
          client_id,
          technician_id,
          service_id,
          appointment_date,
          signature_used
        `)
        .eq("status", "completed")
        .eq("user_id", session.user.id);

      if (start) appointmentsQuery = appointmentsQuery.gte("appointment_date", start);
      if (end) appointmentsQuery = appointmentsQuery.lte("appointment_date", end);

      const { data: appointments, error } = await appointmentsQuery;

      if (error) throw error;

      // Fetch clients separately
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, first_name, last_name, phone")
        .eq("user_id", session.user.id);

      const clientsMap = (clientsData || []).reduce((acc: any, client: any) => {
        acc[client.id] = {
          name: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
          phone: client.phone
        };
        return acc;
      }, {});

      // Fetch technicians separately
      const { data: techniciansData } = await supabase
        .from("technicians")
        .select("id, name")
        .eq("user_id", session.user.id);

      const techniciansMap = (techniciansData || []).reduce((acc: any, tech: any) => {
        acc[tech.id] = tech.name;
        return acc;
      }, {});

      // Fetch services separately
      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name")
        .eq("user_id", session.user.id);

      const servicesMap = (servicesData || []).reduce((acc: any, service: any) => {
        acc[service.id] = service.name;
        return acc;
      }, {});

      // Group appointments by client
      const clientMap = new Map<string, any>();

      appointments?.forEach((apt: any) => {
        const clientId = apt.client_id;
        const clientInfo = clientsMap[clientId] || { name: "Desconhecido", phone: "" };
        
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: clientInfo.name,
            phone: clientInfo.phone,
            appointments: [],
            signatureCount: 0,
            packageCount: 0,
            normalCount: 0,
            barbers: new Map<string, number>(),
            services: new Map<string, number>(),
          });
        }

        const client = clientMap.get(clientId);
        client.appointments.push(apt);

        // Count appointment types
        if (apt.signature_used) {
          client.signatureCount++;
        } else if (apt.package_used) {
          client.packageCount++;
        } else {
          client.normalCount++;
        }

        // Track barber frequency
        const barberName = techniciansMap[apt.technician_id] || "Desconhecido";
        client.barbers.set(barberName, (client.barbers.get(barberName) || 0) + 1);

        // Track service frequency
        const serviceName = servicesMap[apt.service_id] || "Desconhecido";
        client.services.set(serviceName, (client.services.get(serviceName) || 0) + 1);
      });

      // Process client data
      const clientBehaviors: ClientBehavior[] = [];
      let signatureCount = 0;
      let packageCount = 0;
      let normalCount = 0;
      let highLoyaltyCount = 0;
      let mediumLoyaltyCount = 0;
      let lowLoyaltyCount = 0;

      clientMap.forEach((client) => {
        const totalAppointments = client.appointments.length;

        // Determine preferred type
        let preferredType: "Assinatura" | "Pacote" | "Normal" = "Normal";
        if (client.signatureCount >= client.packageCount && client.signatureCount >= client.normalCount) {
          preferredType = "Assinatura";
          signatureCount++;
        } else if (client.packageCount >= client.normalCount) {
          preferredType = "Pacote";
          packageCount++;
        } else {
          normalCount++;
        }

        // Find most frequent barber
        let maxBarberCount = 0;
        let preferredBarber = "Nenhum";
        client.barbers.forEach((count: number, barber: string) => {
          if (count > maxBarberCount) {
            maxBarberCount = count;
            preferredBarber = barber;
          }
        });

        // Find most frequent service
        let maxServiceCount = 0;
        let preferredService = "Nenhum";
        client.services.forEach((count: number, service: string) => {
          if (count > maxServiceCount) {
            maxServiceCount = count;
            preferredService = service;
          }
        });

        // Calculate average interval between appointments
        const sortedAppointments = client.appointments.sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let totalDays = 0;
        for (let i = 1; i < sortedAppointments.length; i++) {
          const prevDate = new Date(sortedAppointments[i - 1].date);
          const currentDate = new Date(sortedAppointments[i].date);
          totalDays += Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        const averageInterval = sortedAppointments.length > 1 ? Math.round(totalDays / (sortedAppointments.length - 1)) : 0;

        const loyalty = calculateLoyalty(totalAppointments, averageInterval);
        if (loyalty === "Alto") highLoyaltyCount++;
        else if (loyalty === "Médio") mediumLoyaltyCount++;
        else lowLoyaltyCount++;

        clientBehaviors.push({
          id: client.id,
          name: client.name,
          phone: client.phone,
          totalAppointments,
          signatureAppointments: client.signatureCount,
          packageAppointments: client.packageCount,
          normalAppointments: client.normalCount,
          preferredType,
          preferredBarber,
          preferredService,
          lastAppointmentDate: sortedAppointments[sortedAppointments.length - 1]?.date || "",
          averageInterval,
          loyalty,
        });
      });

      // Sort by total appointments (most active first)
      clientBehaviors.sort((a, b) => b.totalAppointments - a.totalAppointments);

      const total = clientBehaviors.length;

      setStats({
        totalClients: total,
        signaturePreference: signatureCount,
        signaturePercentage: total > 0 ? (signatureCount / total) * 100 : 0,
        packagePreference: packageCount,
        packagePercentage: total > 0 ? (packageCount / total) * 100 : 0,
        normalPreference: normalCount,
        normalPercentage: total > 0 ? (normalCount / total) * 100 : 0,
        highLoyalty: highLoyaltyCount,
        mediumLoyalty: mediumLoyaltyCount,
        lowLoyalty: lowLoyaltyCount,
      });

      setClients(clientBehaviors);
    } catch (error) {
      console.error("Error fetching behavior data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Filter by barber
    if (selectedBarber !== "all") {
      const barberName = barbers.find((b) => b.id === selectedBarber)?.name;
      filtered = filtered.filter((client) => client.preferredBarber === barberName);
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((client) => client.preferredType === selectedType);
    }

    // Filter by loyalty
    if (selectedLoyalty !== "all") {
      filtered = filtered.filter((client) => client.loyalty === selectedLoyalty);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          client.phone.includes(term)
      );
    }

    setFilteredClients(filtered);
  };

  const handleSearch = () => {
    applyFilters();
  };

  const exportToExcel = () => {
    const headers = [
      "Cliente",
      "Telefone",
      "Total Agendamentos",
      "Agend. Assinatura",
      "Agend. Pacote",
      "Agend. Normais",
      "Tipo Preferido",
      "Barbeiro Preferido",
      "Serviço Preferido",
      "Último Agendamento",
      "Intervalo Médio (dias)",
      "Fidelidade",
    ];

    const rows = filteredClients.map((client) => [
      client.name,
      client.phone,
      client.totalAppointments,
      client.signatureAppointments,
      client.packageAppointments,
      client.normalAppointments,
      client.preferredType,
      client.preferredBarber,
      client.preferredService,
      client.lastAppointmentDate ? format(parseISO(client.lastAppointmentDate), "dd/MM/yyyy", { locale: pt }) : "",
      client.averageInterval,
      client.loyalty,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `comportamento_agendamentos_${format(new Date(), "dd-MM-yyyy")}.csv`;
    link.click();

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Assinatura":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      case "Pacote":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50";
    }
  };

  const getLoyaltyColor = (loyalty: string) => {
    switch (loyalty) {
      case "Alto":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "Médio":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      default:
        return "bg-red-500/20 text-red-300 border-red-500/50";
    }
  };

  const getLoyaltyIcon = (loyalty: string) => {
    switch (loyalty) {
      case "Alto":
        return <Award className="h-4 w-4" />;
      case "Médio":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Comportamento de Agendamento dos Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise detalhada de preferências e padrões de comportamento
            </p>
          </div>
          <Button onClick={exportToExcel} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <Download className="mr-2 h-4 w-4" />
            Exportar em Excel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">Clientes ativos no período</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-400" />
                Preferência por Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-purple-400">{stats.signaturePreference}</div>
                <div className="text-lg font-semibold text-purple-400">
                  ({stats.signaturePercentage.toFixed(1)}%)
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Clientes que preferem assinatura</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                Preferência por Pacote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-blue-400">{stats.packagePreference}</div>
                <div className="text-lg font-semibold text-blue-400">
                  ({stats.packagePercentage.toFixed(1)}%)
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Clientes que preferem pacotes</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarLucide className="h-4 w-4 text-gray-400" />
                Agendamentos Normais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-gray-400">{stats.normalPreference}</div>
                <div className="text-lg font-semibold text-gray-400">
                  ({stats.normalPercentage.toFixed(1)}%)
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Clientes com agendamentos normais</p>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-green-400" />
                Fidelidade Alta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-green-400">{stats.highLoyalty}</div>
                <div className="text-lg font-semibold text-green-400">
                  ({stats.totalClients > 0 ? ((stats.highLoyalty / stats.totalClients) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">10+ agendamentos ou visitas a cada 30 dias</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                Fidelidade Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-yellow-400">{stats.mediumLoyalty}</div>
                <div className="text-lg font-semibold text-yellow-400">
                  ({stats.totalClients > 0 ? ((stats.mediumLoyalty / stats.totalClients) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">5-9 agendamentos ou visitas a cada 30-60 dias</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                Fidelidade Baixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-red-400">{stats.lowLoyalty}</div>
                <div className="text-lg font-semibold text-red-400">
                  ({stats.totalClients > 0 ? ((stats.lowLoyalty / stats.totalClients) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Menos de 5 agendamentos ou visitas espaçadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-white">Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: pt }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-white">Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: pt }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Barber Filter */}
              <div className="space-y-2">
                <Label className="text-white">Barbeiro</Label>
                <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os barbeiros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os barbeiros</SelectItem>
                    {barbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label className="text-white">Tipo Preferido</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="Assinatura">Assinatura</SelectItem>
                    <SelectItem value="Pacote">Pacote</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loyalty Filter */}
              <div className="space-y-2">
                <Label className="text-white">Fidelidade</Label>
                <Select value={selectedLoyalty} onValueChange={setSelectedLoyalty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Alto">Alta</SelectItem>
                    <SelectItem value="Médio">Média</SelectItem>
                    <SelectItem value="Baixo">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label className="text-white">Buscar Cliente</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome ou telefone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} size="icon" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-white">Cliente</th>
                    <th className="text-center p-4 text-sm font-semibold text-white">Total Agend.</th>
                    <th className="text-center p-4 text-sm font-semibold text-white">Assinatura</th>
                    <th className="text-center p-4 text-sm font-semibold text-white">Pacote</th>
                    <th className="text-center p-4 text-sm font-semibold text-white">Normal</th>
                    <th className="text-center p-4 text-sm font-semibold text-white">Tipo Preferido</th>
                    <th className="text-left p-4 text-sm font-semibold text-white">Barbeiro Preferido</th>
                    <th className="text-left p-4 text-sm font-semibold text-white">Serviço Preferido</th>
                    <th className="text-center p-4 text-sm font-semibold text-white">Intervalo Médio</th>
                    <th className="text-center p-4 text-sm font-semibold text-white">Fidelidade</th>
                    <th className="text-center p-4 text-sm font-semibold text-white"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center p-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Nenhum cliente encontrado com os filtros aplicados</p>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-white">{client.name}</div>
                            <div className="text-sm text-yellow-500">{client.phone}</div>
                          </div>
                        </td>
                        <td className="text-center p-4">
                          <div className="font-semibold text-white">{client.totalAppointments}</div>
                        </td>
                        <td className="text-center p-4">
                          <div className="font-medium text-purple-400">{client.signatureAppointments}</div>
                        </td>
                        <td className="text-center p-4">
                          <div className="font-medium text-blue-400">{client.packageAppointments}</div>
                        </td>
                        <td className="text-center p-4">
                          <div className="font-medium text-gray-400">{client.normalAppointments}</div>
                        </td>
                        <td className="text-center p-4">
                          <Badge className={`${getTypeColor(client.preferredType)} border`}>
                            {client.preferredType}
                          </Badge>
                        </td>
                        <td className="p-4 text-white">{client.preferredBarber}</td>
                        <td className="p-4 text-white">{client.preferredService}</td>
                        <td className="text-center p-4">
                          <div className="flex items-center justify-center gap-1 text-white">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{client.averageInterval}</span>
                            <span className="text-xs text-muted-foreground">dias</span>
                          </div>
                        </td>
                        <td className="text-center p-4">
                          <Badge className={`${getLoyaltyColor(client.loyalty)} border flex items-center gap-1 w-fit mx-auto`}>
                            {getLoyaltyIcon(client.loyalty)}
                            {client.loyalty}
                          </Badge>
                        </td>
                        <td className="text-center p-4">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>
      </div>
    </div>
  );
}
