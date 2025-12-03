import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Users,
  TrendingUp,
  Search,
  Download,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WalkInClient {
  id: string;
  name: string;
  totalAppointments: number;
  averageFrequency: number;
  frequencyDescription: string;
}

const WalkInClientReport = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [unitFilter, setUnitFilter] = useState("all");
  const [barberFilter, setBarberFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Mock data
  const mockStats = {
    totalAppointments: 108,
    totalClients: 20,
    averageFrequency: 5.40,
  };

  const mockClients: WalkInClient[] = [
    {
      id: "1",
      name: "Cliente Esporadico",
      totalAppointments: 88,
      averageFrequency: 0,
      frequencyDescription: "Retorna em média a cada 0 dias",
    },
    {
      id: "2",
      name: "Enzo Coelho Lopes",
      totalAppointments: 2,
      averageFrequency: 15,
      frequencyDescription: "Retorna em média a cada 15 dias",
    },
    {
      id: "3",
      name: "Ricardo Garcia",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
    {
      id: "4",
      name: "Joao Bento",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
    {
      id: "5",
      name: "Joao Matheus Moraes",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
    {
      id: "6",
      name: "Diogo Serra",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
    {
      id: "7",
      name: "Alex Perroud",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
    {
      id: "8",
      name: "Arthur Quintanilha",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
    {
      id: "9",
      name: "Iran Nobre",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
    {
      id: "10",
      name: "Pedro Herminio Piccolo",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
    {
      id: "11",
      name: "Elisângela Ruppenthal",
      totalAppointments: 1,
      averageFrequency: 30,
      frequencyDescription: "Retorna em média a cada 30 dias",
    },
  ];

  const [clients, setClients] = useState<WalkInClient[]>(mockClients);
  const [filteredClients, setFilteredClients] = useState<WalkInClient[]>(mockClients);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, clients]);

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  };

  const handleExport = () => {
    toast({
      title: t("export_completed"),
      description: t("file_downloaded"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t("walk_in_client_frequency_report")}
          </h1>
          <p className="text-gray-400 mt-2">
            {t("walk_in_report_description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              {t("total_appointments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-500">
              {mockStats.totalAppointments}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t("appointments_at_barbershop")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              {t("total_clients")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-500">
              {mockStats.totalClients}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t("unique_clients_served")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              {t("frequency_rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-cyan-500">
              {mockStats.averageFrequency.toFixed(2)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t("frequency_per_client")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Mês */}
            <div className="space-y-2">
              <Label htmlFor="month" className="text-gray-300">
                {t("month")}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="month"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => date && setSelectedMonth(date)}
                    initialFocus
                    locale={ptBR}
                    className="bg-gray-800"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Unidade */}
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-gray-300">
                {t("unit")}
              </Label>
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger
                  id="unit"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">{t("all")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Barbeiro */}
            <div className="space-y-2">
              <Label htmlFor="barber" className="text-gray-300">
                {t("barber")}
              </Label>
              <Select value={barberFilter} onValueChange={setBarberFilter}>
                <SelectTrigger
                  id="barber"
                  className="bg-gray-700 border-gray-600 text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">{t("all")}</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-gray-300">
                {t("search_by_subscriber")}
              </Label>
              <Input
                id="search"
                placeholder={t("search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Clientes */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            {t("client_list")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold uppercase text-sm">
                    {t("customer")}
                  </th>
                  <th className="text-center py-4 px-4 text-gray-300 font-semibold uppercase text-sm">
                    {t("total_appointments")}
                  </th>
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold uppercase text-sm">
                    {t("average_frequency")}
                  </th>
                  <th className="text-right py-4 px-4 text-gray-300 font-semibold uppercase text-sm">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="text-white font-medium">{client.name}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-white font-semibold text-lg">
                        {client.totalAppointments}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-300">
                        {client.frequencyDescription}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {t("no_clients_found")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalkInClientReport;
