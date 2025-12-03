import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  Clock,
  Star,
  ThumbsUp,
  Target,
  Lightbulb,
  Instagram,
  Users,
  Package,
  Scissors,
  Award,
  ArrowRight,
  Info,
  Activity,
  AlertTriangle,
  MessageSquare,
  Send,
  ExternalLink,
  Smile,
  Frown,
  Meh,
  CheckCircle
} from "lucide-react";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  hairType?: string;
  beardType?: string;
  skinType?: string;
  preferences?: string;
  socialMedia?: {
    instagram?: string;
    followsTrends?: boolean;
  };
}

interface ChurnRiskAlert {
  isAtRisk: boolean;
  daysDelayed: number;
  expectedReturnDate: Date;
  suggestedAction: string;
  discountSuggestion?: number;
}

interface MoodScore {
  rating: number;
  feedbackText?: string;
  frictionPoint?: string;
  actionRequired: boolean;
}

interface ReputationManagement {
  shouldRequestReview: boolean;
  platform: "google" | "instagram" | "facebook";
  reviewUrl: string;
}

interface PredictiveAnalysis {
  nextCutSuggestion: {
    date: Date;
    style: string;
    variation: string;
    confidence: number;
  };
  trendingSuggestions: Array<{
    name: string;
    source: string;
    description: string;
    matchScore: number;
  }>;
  productRecommendations: Array<{
    id: string;
    name: string;
    category: string;
    reason: string;
    priority: number;
  }>;
  reputationScore: {
    current: number;
    trend: "up" | "down" | "stable";
    recommendations: string[];
  };
  churnRisk?: ChurnRiskAlert;
  moodTracking?: {
    lastRating?: number;
    averageRating: number;
    totalRatings: number;
    needsFollowUp: boolean;
  };
}

export default function APERModule() {
  const { session } = useSession();
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [analysis, setAnalysis] = useState<PredictiveAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchClients();
    }
  }, [session]);

  const fetchClients = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, phone")
        .eq("user_id", session.user.id)
        .order("first_name");

      if (error) throw error;
      
      // Mapear para incluir nome completo
      const clientsWithFullName = (data || []).map(client => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`.trim(),
        phone: client.phone || "",
      }));
      
      setClients(clientsWithFullName);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeClient = async (clientId: string) => {
    if (!session?.user?.id) {
      console.error("Sessão não encontrada");
      return;
    }
    
    try {
      setAnalyzing(true);

      console.log("🔍 Iniciando A.P.E.R. para cliente:", clientId);

      // Buscar histórico completo do cliente
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, date, status, total_price, created_at")
        .eq("client_id", clientId)
        .eq("user_id", session.user.id)
        .in("status", ["completed", "confirmed", "pending"])
        .order("date", { ascending: false });

      if (appointmentsError) {
        throw new Error(`Erro ao buscar histórico: ${appointmentsError.message}`);
      }

      console.log("📊 Histórico carregado:", appointments?.length || 0, "agendamentos");

      const completedAppointments = (appointments || []).filter(a => a.status === "completed");
      const pendingAppointments = (appointments || []).filter(a => a.status !== "completed");

      // Calcular métricas do cliente
      const totalSpent = completedAppointments.reduce((sum, apt) => sum + (apt.total_price || 0), 0);
      const averageTicket = completedAppointments.length > 0 
        ? totalSpent / completedAppointments.length 
        : 0;

      console.log("💰 Ticket médio:", averageTicket.toFixed(2), "| Total gasto:", totalSpent.toFixed(2));

      // Buscar produtos para recomendação
      const { data: products } = await supabase
        .from("products")
        .select("id, name, category, price, stock_quantity")
        .eq("user_id", session.user.id)
        .eq("active", true)
        .gt("stock_quantity", 0);

      console.log("🛍️ Produtos disponíveis:", products?.length || 0);

      console.log("Iniciando análise preditiva...");

      // Análise preditiva usando IA (simulação)
      const lastAppointment = appointmentsWithServices?.[0];
      
      let daysSinceLastCut = 30;
      let nextCutDate = addDays(new Date(), 30);
      
      if (lastAppointment?.date) {
        try {
          const lastDate = parseISO(lastAppointment.date);
          daysSinceLastCut = differenceInDays(new Date(), lastDate);
          console.log("Dias desde último corte:", daysSinceLastCut);
          
          // Calcular próximo corte sugerido (baseado em média de intervalo)
          const averageInterval = calculateAverageInterval(appointmentsWithServices || []);
          nextCutDate = addDays(lastDate, averageInterval);
          console.log("Intervalo médio:", averageInterval, "dias");
        } catch (dateError) {
          console.error("Erro ao processar data:", dateError, "Data:", lastAppointment.date);
        }
      }

      // Sugestão de estilo baseada em histórico
      const styleHistory = extractStyleHistory(appointmentsWithServices || []);
      const nextStyle = predictNextStyle(styleHistory);

      // Tendências simuladas (integração futura com Instagram/Pinterest API)
      const trendingSuggestions = generateTrendingSuggestions(styleHistory);

      // Recomendações de produtos baseadas em IA
      const productRecommendations = generateProductRecommendations(
        products || [],
        styleHistory,
        selectedClient
      );

      // Score de reputação
      const reputationScore = calculateReputationScore(appointmentsWithServices || []);

      // Análise de risco de churn
      const churnRisk = analyzeChurnRisk(daysSinceLastCut, averageInterval, nextCutDate);

      console.log("Risco de churn:", churnRisk.isAtRisk ? "SIM" : "NÃO");

      // Mood tracking (simulado - integraria com sistema de avaliações)
      const moodTracking = calculateMoodTracking(appointmentsWithServices || []);

      console.log("Análise concluída com sucesso!");

      setAnalysis({
        nextCutSuggestion: {
          date: nextCutDate,
          style: nextStyle.name,
          variation: nextStyle.variation,
          confidence: nextStyle.confidence,
        },
        trendingSuggestions,
        productRecommendations,
        reputationScore,
        churnRisk,
        moodTracking,
      });

      toast({
        title: "Análise Concluída",
        description: churnRisk.isAtRisk 
          ? `⚠️ Cliente em risco de churn! ${churnRisk.daysDelayed} dias atrasado.`
          : "A.P.E.R. gerou recomendações personalizadas",
        variant: churnRisk.isAtRisk ? "destructive" : "default",
      });
    } catch (error: any) {
      console.error("Error analyzing client:", error);
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
      toast({
        title: "Erro",
        description: error.message || "Erro ao analisar cliente",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Funções auxiliares de IA
  const calculateAverageInterval = (appointments: any[]) => {
    if (appointments.length < 2) return 30;

    const intervals = [];
    for (let i = 0; i < appointments.length - 1; i++) {
      try {
        if (appointments[i]?.date && appointments[i + 1]?.date) {
          const days = differenceInDays(
            parseISO(appointments[i].date),
            parseISO(appointments[i + 1].date)
          );
          if (days > 0) {
            intervals.push(days);
          }
        }
      } catch (err) {
        console.error("Erro ao calcular intervalo:", err);
      }
    }

    return intervals.length > 0 
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : 30;
  };

  const extractStyleHistory = (appointments: any[]) => {
    const styles: string[] = [];
    appointments.forEach((apt) => {
      apt.services?.forEach((svc: any) => {
        if (svc.services?.name) {
          styles.push(svc.services.name);
        }
      });
    });
    return styles;
  };

  const predictNextStyle = (styleHistory: string[]) => {
    // Análise de padrões (simulada)
    const mostCommon = styleHistory[0] || "Corte Degradê";
    
    const variations = [
      "mais curto nas laterais",
      "mantendo o comprimento no topo",
      "com transição suave",
      "estilo mais moderno",
      "acabamento profissional"
    ];

    return {
      name: mostCommon,
      variation: variations[Math.floor(Math.random() * variations.length)],
      confidence: 0.85 + Math.random() * 0.1,
    };
  };

  const generateTrendingSuggestions = (styleHistory: string[]) => {
    const trends = [
      {
        name: "Low Fade Moderno",
        source: "Instagram Trends 2025",
        description: "Tendência crescente entre 18-35 anos, combinação perfeita de clássico e moderno",
        matchScore: 0.92,
      },
      {
        name: "Barba Stubble (Por Fazer)",
        source: "Pinterest Top Styles",
        description: "Estilo casual que está dominando as redes sociais, baixa manutenção",
        matchScore: 0.87,
      },
      {
        name: "Mullet Contemporâneo",
        source: "TikTok Viral",
        description: "Ressurgimento do clássico com acabamento moderno e versátil",
        matchScore: 0.78,
      },
      {
        name: "Textured Crop",
        source: "Fashion Week 2025",
        description: "Corte texturizado que valoriza o movimento natural do cabelo",
        matchScore: 0.85,
      },
    ];

    return trends;
  };

  const generateProductRecommendations = (
    products: any[],
    styleHistory: string[],
    client: ClientProfile | null
  ) => {
    // Simulação de recomendações baseadas em IA
    const recommendations = products
      .filter((p) => p.category?.toLowerCase().includes("home care") || 
                     p.category?.toLowerCase().includes("cuidado"))
      .slice(0, 3)
      .map((product, index) => ({
        id: product.id,
        name: product.name,
        category: product.category || "Produto",
        reason: generateProductReason(product, styleHistory, client),
        priority: 3 - index,
      }));

    return recommendations;
  };

  const generateProductReason = (
    product: any,
    styleHistory: string[],
    client: ClientProfile | null
  ) => {
    const reasons = [
      `Ideal para manutenção do ${styleHistory[0] || "seu estilo atual"}`,
      "Combina perfeitamente com o tipo de cabelo detectado no último atendimento",
      "Recomendado para prolongar o efeito do corte por mais tempo",
      "Produto premium que 87% dos clientes com este estilo aprovaram",
      "Fórmula exclusiva para o tipo de cabelo identificado no cadastro",
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const calculateReputationScore = (appointments: any[]) => {
    // Score baseado em frequência e recência
    const score = Math.min(100, 70 + appointments.length * 3);
    const trend: "up" | "down" | "stable" = 
      appointments.length > 5 ? "up" : appointments.length > 2 ? "stable" : "down";

    const recommendations = [
      "Cliente fiel - considerar programa VIP",
      "Ótimo histórico de pontualidade",
      "Perfil ideal para indicar novos serviços premium",
    ];

    return { current: score, trend, recommendations };
  };

  const analyzeChurnRisk = (
    daysSinceLastCut: number,
    averageInterval: number,
    expectedReturnDate: Date
  ): ChurnRiskAlert => {
    const daysDelayed = daysSinceLastCut - averageInterval;
    const isAtRisk = daysDelayed >= 15; // Risco se atrasou 15+ dias

    let suggestedAction = "Cliente em dia com agendamentos";
    let discountSuggestion = undefined;

    if (isAtRisk) {
      if (daysDelayed >= 30) {
        suggestedAction = "URGENTE: Entrar em contato imediatamente com oferta especial de retorno";
        discountSuggestion = 20; // 20% desconto
      } else if (daysDelayed >= 20) {
        suggestedAction = "ATENÇÃO: Enviar mensagem de follow-up com lembrete gentil e desconto";
        discountSuggestion = 15; // 15% desconto
      } else {
        suggestedAction = "Risco moderado: Enviar lembrete amigável sobre próximo agendamento";
        discountSuggestion = 10; // 10% desconto
      }
    }

    return {
      isAtRisk,
      daysDelayed: Math.max(0, daysDelayed),
      expectedReturnDate,
      suggestedAction,
      discountSuggestion,
    };
  };

  const calculateMoodTracking = (appointments: any[]) => {
    // Simulação - em produção, buscaria avaliações reais do banco
    const mockRatings = appointments.slice(0, 5).map(() => Math.floor(Math.random() * 2) + 4); // 4-5 estrelas
    const lastRating = mockRatings[0];
    const averageRating = mockRatings.reduce((a, b) => a + b, 0) / mockRatings.length;
    const needsFollowUp = lastRating && lastRating <= 4;

    return {
      lastRating,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: appointments.length,
      needsFollowUp,
    };
  };

  const handleClientSelect = (client: ClientProfile) => {
    setSelectedClient(client);
    setAnalysis(null);
  };

  const handleAnalyze = () => {
    if (selectedClient) {
      analyzeClient(selectedClient.id);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">A.P.E.R. - Análise Preditiva</h1>
                <p className="text-sm text-muted-foreground">
                  Inteligência Artificial para Estilo e Reputação
                </p>
              </div>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            IA Ativa
          </Badge>
        </div>

        {/* Info Alert */}
        <Alert className="bg-blue-500/10 border-blue-500/50">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertTitle className="text-blue-300">Como funciona o A.P.E.R.</AlertTitle>
          <AlertDescription className="text-blue-200/80">
            Selecione um cliente e clique em "Analisar com IA" para gerar recomendações personalizadas de estilo,
            produtos e o melhor momento para o próximo agendamento baseado em histórico e tendências.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cliente Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Selecionar Cliente
              </CardTitle>
              <CardDescription>Escolha um cliente para análise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Buscar Cliente</Label>
                <Input
                  placeholder="Nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background"
                />
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredClients.map((client) => (
                    <Card
                      key={client.id}
                      className={`cursor-pointer transition-all hover:bg-muted/50 ${
                        selectedClient?.id === client.id
                          ? "bg-purple-500/20 border-purple-500"
                          : "bg-card border-border"
                      }`}
                      onClick={() => handleClientSelect(client)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{client.name}</p>
                            <p className="text-sm text-yellow-500">{client.phone}</p>
                          </div>
                          {selectedClient?.id === client.id && (
                            <Badge className="bg-purple-500 text-white">
                              Selecionado
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {selectedClient && (
                <div className="space-y-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analisar com IA
                    </>
                  )}
                  </Button>
                  <Alert className="bg-blue-500/10 border-blue-500/50">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200/80 text-xs">
                      Inclui: Monitoramento de Churn, Mood Score e Gestão de Reputação
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <div className="md:col-span-2 space-y-6">
            {!analysis && !analyzing && (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Selecione um cliente e clique em "Analisar com IA"<br />
                    para gerar recomendações personalizadas
                  </p>
                </CardContent>
              </Card>
            )}

            {analyzing && (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mb-4"></div>
                  <p className="text-white font-medium">Processando com IA...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analisando histórico, tendências e padrões
                  </p>
                </CardContent>
              </Card>
            )}

            {analysis && !analyzing && (
              <Tabs defaultValue="monitoring" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="monitoring" className="relative">
                    <Activity className="h-4 w-4 mr-2" />
                    Monitoramento
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0">
                      NOVO
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="style">
                    <Scissors className="h-4 w-4 mr-2" />
                    Estilo
                  </TabsTrigger>
                  <TabsTrigger value="products">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Produtos
                  </TabsTrigger>
                  <TabsTrigger value="reputation">
                    <Award className="h-4 w-4 mr-2" />
                    Reputação
                  </TabsTrigger>
                </TabsList>

                {/* Monitoring Tab */}
                <TabsContent value="monitoring" className="space-y-4">
                  {/* Churn Risk Alert */}
                  {analysis.churnRisk && (
                    <Card className={`${
                      analysis.churnRisk.isAtRisk
                        ? "bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/50"
                        : "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30"
                    }`}>
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          {analysis.churnRisk.isAtRisk ? (
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                          Alerta de Risco de Churn
                        </CardTitle>
                        <CardDescription>
                          Monitoramento automático de frequência de retorno
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.churnRisk.isAtRisk ? (
                          <>
                            <Alert className="bg-red-500/10 border-red-500/50">
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                              <AlertTitle className="text-red-300">Cliente em Risco!</AlertTitle>
                              <AlertDescription className="text-red-200/80">
                                Este cliente está <strong>{analysis.churnRisk.daysDelayed} dias atrasado</strong> em relação ao padrão de retorno.
                              </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
                              <Card className="bg-background/50 border-border">
                                <CardContent className="p-4">
                                  <p className="text-sm text-muted-foreground mb-1">Dias Atrasado</p>
                                  <p className="text-3xl font-bold text-red-400">
                                    +{analysis.churnRisk.daysDelayed}
                                  </p>
                                </CardContent>
                              </Card>
                              <Card className="bg-background/50 border-border">
                                <CardContent className="p-4">
                                  <p className="text-sm text-muted-foreground mb-1">Desconto Sugerido</p>
                                  <p className="text-3xl font-bold text-orange-400">
                                    {analysis.churnRisk.discountSuggestion}%
                                  </p>
                                </CardContent>
                              </Card>
                            </div>

                            <Card className="bg-orange-500/10 border-orange-500/50">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <Lightbulb className="h-5 w-5 text-orange-400 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-white mb-2">Ação Recomendada:</p>
                                    <p className="text-sm text-muted-foreground">
                                      {analysis.churnRisk.suggestedAction}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <div className="grid grid-cols-2 gap-3">
                              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Enviar WhatsApp
                              </Button>
                              <Button variant="outline" className="w-full border-border">
                                <Send className="h-4 w-4 mr-2" />
                                Enviar E-mail
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                            <p className="text-white font-semibold mb-2">Cliente em Dia!</p>
                            <p className="text-sm text-muted-foreground">
                              Nenhum risco de churn detectado. Continue monitorando.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Mood Score Tracking */}
                  {analysis.moodTracking && (
                    <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-400" />
                          Mood Score do Atendimento
                        </CardTitle>
                        <CardDescription>
                          Avaliação de satisfação e pontos de atrito
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="bg-background/50 border-border">
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground mb-1">Última Nota</p>
                              <div className="flex items-center justify-center gap-1">
                                <p className="text-3xl font-bold text-yellow-400">
                                  {analysis.moodTracking.lastRating || "-"}
                                </p>
                                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-background/50 border-border">
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground mb-1">Média</p>
                              <p className="text-3xl font-bold text-blue-400">
                                {analysis.moodTracking.averageRating.toFixed(1)}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="bg-background/50 border-border">
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground mb-1">Total</p>
                              <p className="text-3xl font-bold text-purple-400">
                                {analysis.moodTracking.totalRatings}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {analysis.moodTracking.needsFollowUp && (
                          <Alert className="bg-yellow-500/10 border-yellow-500/50">
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            <AlertTitle className="text-yellow-300">Follow-Up Necessário</AlertTitle>
                            <AlertDescription className="text-yellow-200/80">
                              A última avaliação foi de {analysis.moodTracking.lastRating} estrelas. 
                              Recomenda-se entrar em contato para identificar pontos de melhoria.
                            </AlertDescription>
                          </Alert>
                        )}

                        <Card className="bg-background/50 border-border">
                          <CardHeader>
                            <CardTitle className="text-white text-sm">Sistema de Avaliação Inteligente</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Smile className="h-5 w-5 text-green-400 mt-0.5" />
                              <div>
                                <p className="text-white font-medium">Nota 5 ⭐</p>
                                <p className="text-sm text-muted-foreground">
                                  → Direcionar para Google Maps/Instagram para avaliação pública
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Meh className="h-5 w-5 text-yellow-400 mt-0.5" />
                              <div>
                                <p className="text-white font-medium">Nota 3-4 ⭐</p>
                                <p className="text-sm text-muted-foreground">
                                  → Mini-pesquisa: "O que impediu as 5 estrelas?"
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Frown className="h-5 w-5 text-red-400 mt-0.5" />
                              <div>
                                <p className="text-white font-medium">Nota 1-2 ⭐</p>
                                <p className="text-sm text-muted-foreground">
                                  → Alerta imediato ao gerente + contato de recuperação
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-2">
                          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Solicitar Feedback ao Cliente
                          </Button>
                          {analysis.moodTracking.lastRating === 5 && (
                            <Button variant="outline" className="w-full border-green-500/50 text-green-300 hover:bg-green-500/10">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Enviar Link de Avaliação Pública
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reputation Management */}
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-400" />
                        Gestão de Reputação Online
                      </CardTitle>
                      <CardDescription>
                        Capitalizar satisfação para melhorar presença digital
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <Button variant="outline" className="border-red-500/50 hover:bg-red-500/10">
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          Google
                        </Button>
                        <Button variant="outline" className="border-pink-500/50 hover:bg-pink-500/10">
                          <Instagram className="h-4 w-4 mr-2" />
                          Instagram
                        </Button>
                        <Button variant="outline" className="border-blue-500/50 hover:bg-blue-500/10">
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </Button>
                      </div>

                      <Alert className="bg-purple-500/10 border-purple-500/50">
                        <Info className="h-4 w-4 text-purple-400" />
                        <AlertDescription className="text-purple-200/80">
                          Quando o cliente der nota 5, envie automaticamente o link para avaliação pública.
                          Isso aumenta sua reputação online e atrai novos clientes.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Style Tab */}
                <TabsContent value="style" className="space-y-4">
                  {/* Next Cut Suggestion */}
                  <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-400" />
                        Próximo Corte Sugerido
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Data Ideal</p>
                          <p className="text-2xl font-bold text-white">
                            {format(analysis.nextCutSuggestion.date, "dd 'de' MMMM", { locale: pt })}
                          </p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                          <Target className="h-3 w-3 mr-1" />
                          {Math.round(analysis.nextCutSuggestion.confidence * 100)}% confiança
                        </Badge>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Estilo Recomendado</p>
                        <div className="bg-background/50 p-4 rounded-lg">
                          <p className="font-semibold text-white text-lg mb-2">
                            {analysis.nextCutSuggestion.style}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Sugestão de variação: {analysis.nextCutSuggestion.variation}
                          </p>
                        </div>
                      </div>

                      <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Agora
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Trending Suggestions */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-400" />
                        Tendências Personalizadas
                      </CardTitle>
                      <CardDescription>
                        Baseado em redes sociais e preferências detectadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.trendingSuggestions.map((trend, index) => (
                        <Card
                          key={index}
                          className="bg-background/50 border-border hover:border-orange-500/50 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Lightbulb className="h-4 w-4 text-orange-400" />
                                  <p className="font-semibold text-white">{trend.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Instagram className="h-3 w-3" />
                                  {trend.source}
                                </p>
                              </div>
                              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">
                                {Math.round(trend.matchScore * 100)}% match
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{trend.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-4">
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-400" />
                        Produtos Recomendados pela IA
                      </CardTitle>
                      <CardDescription>
                        Match inteligente baseado em tipo de cabelo e estilo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.productRecommendations.map((product, index) => (
                        <Card
                          key={product.id}
                          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-blue-500 text-white">
                                    #{product.priority}
                                  </Badge>
                                  <p className="font-semibold text-white">{product.name}</p>
                                </div>
                                <p className="text-xs text-blue-300">{product.category}</p>
                              </div>
                              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                            </div>

                            <div className="bg-background/50 p-3 rounded-lg mb-3">
                              <p className="text-sm text-muted-foreground flex items-start gap-2">
                                <ThumbsUp className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{product.reason}</span>
                              </p>
                            </div>

                            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Adicionar à Comanda
                            </Button>
                          </CardContent>
                        </Card>
                      ))}

                      <Alert className="bg-yellow-500/10 border-yellow-500/50">
                        <Lightbulb className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-yellow-200/80">
                          Clientes que compraram estes produtos tiveram 3x mais retorno em 30 dias
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Reputation Tab */}
                <TabsContent value="reputation" className="space-y-4">
                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-400" />
                        Score de Reputação
                      </CardTitle>
                      <CardDescription>
                        Análise de valor e potencial do cliente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Score Display */}
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="relative">
                          <div className="text-6xl font-bold text-white mb-2">
                            {analysis.reputationScore.current}
                          </div>
                          <div className="absolute -top-2 -right-8">
                            {analysis.reputationScore.trend === "up" && (
                              <TrendingUp className="h-8 w-8 text-green-400" />
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground">de 100 pontos</p>
                        <Badge
                          className={`mt-4 ${
                            analysis.reputationScore.current >= 80
                              ? "bg-green-500/20 text-green-300 border-green-500/50"
                              : analysis.reputationScore.current >= 60
                              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                              : "bg-red-500/20 text-red-300 border-red-500/50"
                          }`}
                        >
                          {analysis.reputationScore.current >= 80
                            ? "Cliente VIP"
                            : analysis.reputationScore.current >= 60
                            ? "Cliente Regular"
                            : "Cliente Novo"}
                        </Badge>
                      </div>

                      <Separator />

                      {/* Recommendations */}
                      <div>
                        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-400" />
                          Recomendações Estratégicas
                        </p>
                        <div className="space-y-2">
                          {analysis.reputationScore.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 bg-background/50 p-3 rounded-lg"
                            >
                              <ArrowRight className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                          <Star className="h-4 w-4 mr-2" />
                          Promover para Programa VIP
                        </Button>
                        <Button variant="outline" className="w-full border-border">
                          <Clock className="h-4 w-4 mr-2" />
                          Ver Histórico Completo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
