import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Star,
  MessageSquare,
  Gift,
  Award,
  History,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  UserPlus,
  Activity,
  ShoppingBag,
  Scissors,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email?: string | null;
  created_at: string;
  notes?: string;
  date_of_birth?: string | null;
  address?: string;
  totalAppointments?: number;
  totalRevenue?: number;
  lastAppointment?: string;
  status?: "active" | "inactive" | "at_risk";
  loyaltyPoints?: number;
}

interface ClientDetail extends Client {
  appointmentHistory?: any[];
  preferredServices?: string[];
  preferredBarber?: string;
  averageInterval?: number;
  averageTicket?: number;
}

export default function ClientManagement() {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    atRisk: 0,
    totalRevenue: 0,
    averageTicket: 0,
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchClients();
    }
  }, [session]);

  useEffect(() => {
    filterClients();
  }, [searchTerm, statusFilter, clients]);

  const fetchClients = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);

      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", session.user.id)
        .order("first_name");

      if (clientsError) {
        console.error("Error fetching clients:", clientsError);
        throw new Error(`Erro ao buscar clientes: ${clientsError.message}`);
      }

      // Buscar agendamentos para cada cliente (todos os status)
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, client_id, appointment_date, status")
        .eq("user_id", session.user.id);

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        // Continuar mesmo sem appointments
      }

      console.log("Total appointments found:", appointments?.length || 0);
      console.log("Sample appointment:", appointments?.[0]);

      // Processar dados
      const processedClients = (clientsData || []).map((client) => {
        const clientAppointments = appointments?.filter((apt) => apt.client_id === client.id) || [];
        const totalAppointments = clientAppointments.length;
        const totalRevenue = 0; // Não temos total_price na tabela appointments
        const lastAppointment = clientAppointments.length > 0
          ? clientAppointments.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0].appointment_date
          : null;

        const daysSinceLastAppointment = lastAppointment
          ? differenceInDays(new Date(), parseISO(lastAppointment))
          : 999;

        let status: "active" | "inactive" | "at_risk";
        if (daysSinceLastAppointment <= 30) {
          status = "active";
        } else if (daysSinceLastAppointment <= 60) {
          status = "at_risk";
        } else {
          status = "inactive";
        }

        // Log para debug - remover depois
        if (client.first_name === "Nilson" || client.last_name === "Denuncio") {
          console.log("=== DEBUG CLIENTE NILSON ===");
          console.log("Client ID:", client.id);
          console.log("Total appointments:", totalAppointments);
          console.log("Last appointment:", lastAppointment);
          console.log("Days since last:", daysSinceLastAppointment);
          console.log("Status:", status);
          console.log("Client appointments:", clientAppointments);
          console.log("All appointments with client_id:", appointments?.filter(a => a.client_id).map(a => ({ id: a.id, client_id: a.client_id })));
        }

        return {
          ...client,
          totalAppointments,
          totalRevenue,
          lastAppointment: lastAppointment || undefined,
          status,
          loyaltyPoints: totalAppointments * 10,
        };
      });

      setClients(processedClients);

      // Calcular estatísticas
      const active = processedClients.filter((c) => c.status === "active").length;
      const inactive = processedClients.filter((c) => c.status === "inactive").length;
      const atRisk = processedClients.filter((c) => c.status === "at_risk").length;
      const totalRevenue = processedClients.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
      const averageTicket = processedClients.length > 0 ? totalRevenue / processedClients.length : 0;

      setStats({
        total: processedClients.length,
        active,
        inactive,
        atRisk,
        totalRevenue,
        averageTicket,
      });
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar clientes",
        variant: "destructive",
      });
      // Definir dados vazios em caso de erro
      setClients([]);
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        atRisk: 0,
        totalRevenue: 0,
        averageTicket: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getFullName(client).toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone?.includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  };

  const handleViewClient = async (client: Client) => {
    if (!session?.user?.id) return;
    
    try {
      console.log("Fetching details for client:", client.id);
      
      // Buscar detalhes completos - primeiro apenas appointments
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", client.id)
        .eq("user_id", session.user.id)
        .order("appointment_date", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
        throw error;
      }

      console.log("Appointments found:", appointments?.length || 0);

      // Processar serviços preferidos - simplificado (sem relacionamentos por enquanto)
      const preferredServices: string[] = [];

      // Barbeiro preferido - simplificado (sem relacionamentos por enquanto)
      const preferredBarber = undefined;

      // Intervalo médio
      let averageInterval = 0;
      if (appointments && appointments.length > 1) {
        const intervals = [];
        for (let i = 0; i < appointments.length - 1; i++) {
          const date1 = appointments[i].appointment_date;
          const date2 = appointments[i + 1].appointment_date;
          if (date1 && date2) {
            intervals.push(
              differenceInDays(parseISO(date1), parseISO(date2))
            );
          }
        }
        if (intervals.length > 0) {
          averageInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
        }
      }

      setSelectedClient({
        ...client,
        appointmentHistory: appointments || [],
        preferredServices,
        preferredBarber,
        averageInterval,
        averageTicket: client.totalRevenue && client.totalAppointments && client.totalAppointments > 0
          ? client.totalRevenue / client.totalAppointments
          : 0,
      });
      setShowClientDialog(true);
      console.log("Client dialog opened successfully");
    } catch (error: any) {
      console.error("Error fetching client details:", error);
      console.error("Error details:", error.message, error.code);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar detalhes do cliente",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        );
      case "at_risk":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Em Risco
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
            <XCircle className="h-3 w-3 mr-1" />
            Inativo
          </Badge>
        );
      default:
        return null;
    }
  };

  const getFullName = (client: Client) => {
    return `${client.first_name} ${client.last_name}`.trim();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Gestão de Clientes (CRM)</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie seus clientes, histórico e preferências
                </p>
              </div>
            </div>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Risco</p>
                  <p className="text-2xl font-bold text-white">{stats.atRisk}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inativos</p>
                  <p className="text-2xl font-bold text-white">{stats.inactive}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita</p>
                  <p className="text-lg font-bold text-white">
                    R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-lg font-bold text-white">
                    R$ {stats.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="at_risk">Em Risco</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-border">
                <Download className="h-4 w-4 mr-2" />
                Exportar Lista
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Clientes
            </CardTitle>
            <CardDescription>
              {filteredClients.length} cliente(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredClients.map((client) => (
                    <Card
                      key={client.id}
                      className="bg-background/50 border-border hover:border-blue-500/50 transition-all cursor-pointer"
                      onClick={() => handleViewClient(client)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-12 w-12 bg-blue-500/20 border-2 border-blue-500/50">
                              <AvatarFallback className="text-blue-300 font-semibold">
                                {getInitials(client.first_name, client.last_name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-white">{getFullName(client)}</p>
                                {getStatusBadge(client.status)}
                                {client.loyaltyPoints && client.loyaltyPoints >= 100 && (
                                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                                    <Star className="h-3 w-3 mr-1 fill-yellow-300" />
                                    VIP
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {client.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {client.phone}
                                  </span>
                                )}
                                {client.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {client.email}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Scissors className="h-3 w-3" />
                                  {client.totalAppointments || 0} atendimentos
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  R$ {(client.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {client.lastAppointment && (
                              <div className="text-right text-sm">
                                <p className="text-muted-foreground">Último atendimento</p>
                                <p className="text-white font-medium">
                                  {format(parseISO(client.lastAppointment), "dd/MM/yyyy")}
                                </p>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClient(client);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Detail Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-blue-500/20 border-2 border-blue-500/50">
                <AvatarFallback className="text-blue-300 font-semibold text-lg">
                  {selectedClient && getInitials(selectedClient.first_name, selectedClient.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl">{selectedClient && getFullName(selectedClient)}</p>
                <p className="text-sm text-muted-foreground font-normal">
                  Cliente desde {selectedClient?.created_at && format(parseISO(selectedClient.created_at), "MMMM 'de' yyyy", { locale: pt })}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">
                  <Activity className="h-4 w-4 mr-2" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Preferências
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-background border-border">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Atendimentos</p>
                      <p className="text-2xl font-bold text-white">{selectedClient.totalAppointments}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-border">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Receita Total</p>
                      <p className="text-xl font-bold text-white">
                        R$ {(selectedClient.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-border">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Ticket Médio</p>
                      <p className="text-xl font-bold text-white">
                        R$ {(selectedClient.averageTicket || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-border">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Pontos</p>
                      <p className="text-2xl font-bold text-yellow-400">{selectedClient.loyaltyPoints}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-background border-border">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Informações de Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedClient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-400" />
                          <span className="text-white">{selectedClient.phone}</span>
                        </div>
                      )}
                      {selectedClient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-400" />
                          <span className="text-white">{selectedClient.email}</span>
                        </div>
                      )}
                      {selectedClient.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-400" />
                          <span className="text-white">{selectedClient.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-background border-border">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Status do Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge(selectedClient.status)}
                      </div>
                      {selectedClient.lastAppointment && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Último atendimento:</span>
                            <span className="text-white">
                              {format(parseISO(selectedClient.lastAppointment), "dd/MM/yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Dias desde último:</span>
                            <span className="text-white">
                              {differenceInDays(new Date(), parseISO(selectedClient.lastAppointment))} dias
                            </span>
                          </div>
                        </>
                      )}
                      {selectedClient.averageInterval && selectedClient.averageInterval > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Intervalo médio:</span>
                          <span className="text-white">{selectedClient.averageInterval} dias</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {selectedClient.appointmentHistory?.map((appointment) => (
                      <Card key={appointment.id} className="bg-background border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span className="text-white font-medium">
                                {format(parseISO(appointment.appointment_date), "dd/MM/yyyy 'às' HH:mm")}
                              </span>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                              {appointment.status || 'Agendado'}
                            </Badge>
                          </div>
                          {appointment.technicians && (
                            <p className="text-sm text-muted-foreground">
                              Barbeiro: {appointment.technicians.name}
                            </p>
                          )}
                          {appointment.services && appointment.services.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {appointment.services.map((svc: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {svc.services?.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-4">
                <Card className="bg-background border-border">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Serviços Preferidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedClient.preferredServices && selectedClient.preferredServices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.preferredServices.map((service, idx) => (
                          <Badge key={idx} className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                            <Scissors className="h-3 w-3 mr-1" />
                            {service}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum serviço registrado ainda</p>
                    )}
                  </CardContent>
                </Card>

                {selectedClient.preferredBarber && (
                  <Card className="bg-background border-border">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Barbeiro Preferido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedClient.preferredBarber}
                      </Badge>
                    </CardContent>
                  </Card>
                )}

                {selectedClient.notes && (
                  <Card className="bg-background border-border">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white">{selectedClient.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}