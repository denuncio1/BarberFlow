import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle,
  Shield,
  DollarSign,
  Star,
  MessageSquare,
  Send,
  Phone,
  Mail,
  Instagram,
  Facebook,
  ExternalLink,
  Target,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Scissors,
  Users,
  Calendar
} from "lucide-react";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// ============= INTERFACES =============

interface ClientProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  lastVisit?: string;
  totalSpent: number;
  visitCount: number;
  averageTicket: number;
}

interface UpsellOpportunity {
  id: string;
  type: "product" | "service" | "combo";
  name: string;
  timing: "agora" | "próxima_visita" | "lembrete";
  reason: string;
  expectedRevenue: number;
  confidence: number;
  script: string; // O que o barbeiro deve falar
  priority: "high" | "medium" | "low";
}

interface NegativeFeedbackAlert {
  detected: boolean;
  severity: "critical" | "moderate" | "low";
  indicators: string[];
  riskOfPublicComplaint: number; // 0-100%
  suggestedAction: string;
  recoveryScript: string;
  compensationOffer?: string;
}

interface ChurnRiskAlert {
  isAtRisk: boolean;
  riskLevel: "low" | "moderate" | "high" | "critical";
  daysDelayed: number;
  lostRevenueProjection: number;
  recoveryAction: string;
  discountOffer: number;
  urgency: string;
  contactScript: string;
}

interface ReputationProtection {
  shouldRequestReview: boolean;
  platform: "google" | "instagram" | "facebook";
  timing: "immediate" | "after_service" | "next_day";
  incentive: string;
  reviewUrl: string;
  satisfactionScore: number;
}

interface PredictiveAnalysis {
  // Foco em Vendas
  upsellOpportunities: UpsellOpportunity[];
  nextVisitPrediction: {
    date: Date;
    confidence: number;
    suggestedReminder: string;
  };
  
  // Proteção de Reputação
  negativeFeedbackRisk: NegativeFeedbackAlert;
  reputationProtection: ReputationProtection;
  
  // Recuperação de Cliente
  churnRisk: ChurnRiskAlert;
  
  // Métricas de Impacto
  projectedRevenueLift: number;
  reputationRiskScore: number;
}

// ============= COMPONENT =============

const APERModule = () => {
  const { session } = useSession();
  const { t } = useTranslation();
  
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [analysis, setAnalysis] = useState<PredictiveAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ============= FETCH CLIENTS =============
  
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
        .select("id, first_name, last_name, phone, email")
        .eq("user_id", session.user.id)
        .order("first_name", { ascending: true });

      if (error) throw error;

      const clientsWithStats = await Promise.all(
        (data || []).map(async (client) => {
          const { data: appointments } = await supabase
            .from("appointments")
            .select("*")
            .eq("client_id", client.id)
            .eq("status", "completed");

          const totalSpent = appointments?.reduce((sum, apt) => sum + (apt.total_price || 0), 0) || 0;
          const visitCount = appointments?.length || 0;
          const averageTicket = visitCount > 0 ? totalSpent / visitCount : 0;
          const lastVisit = appointments?.[0]?.date || appointments?.[0]?.appointment_date || appointments?.[0]?.scheduled_at || appointments?.[0]?.created_at;

          return {
            id: client.id,
            name: `${client.first_name} ${client.last_name}`.trim(),
            phone: client.phone,
            email: client.email,
            lastVisit,
            totalSpent,
            visitCount,
            averageTicket,
          };
        })
      );

      setClients(clientsWithStats);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============= AI ANALYSIS FUNCTIONS =============

  const generateUpsellOpportunities = (
    appointments: any[],
    products: any[],
    averageTicket: number
  ): UpsellOpportunity[] => {
    const opportunities: UpsellOpportunity[] = [];

    // Calcular frequência do cliente
    const visitCount = appointments.length;
    const isFrequentClient = visitCount >= 5;
    const isNewClient = visitCount <= 2;
    
    // Produtos disponíveis para upsell
    const haircareProducts = products.filter(p => 
      p.category?.toLowerCase().includes('cabelo') || 
      p.category?.toLowerCase().includes('shampoo') ||
      p.category?.toLowerCase().includes('pomada')
    );
    
    const beardProducts = products.filter(p => 
      p.category?.toLowerCase().includes('barba') ||
      p.name?.toLowerCase().includes('barba')
    );

    // Oportunidade 1: Produtos específicos (se houver no estoque)
    if (haircareProducts.length > 0 && visitCount >= 2) {
      const randomProduct = haircareProducts[Math.floor(Math.random() * haircareProducts.length)];
      opportunities.push({
        id: `prod-${randomProduct.id}`,
        type: "product",
        name: randomProduct.name,
        timing: "agora",
        reason: isFrequentClient 
          ? `Cliente fiel com ${visitCount} visitas - alta chance de conversão`
          : "Cliente retornou, momento ideal para oferta",
        expectedRevenue: randomProduct.price || averageTicket * 0.4,
        confidence: isFrequentClient ? 85 : 65,
        script: isFrequentClient
          ? `"Você é cliente fiel aqui, então quero te mostrar nosso ${randomProduct.name}. Muitos clientes amaram e mantém o visual perfeito em casa!"`
          : `"Já que você gostou do resultado, temos o ${randomProduct.name} que ajuda a manter esse visual entre as visitas. Posso mostrar?"`,
        priority: "high",
      });
    }

    // Oportunidade 2: Produtos de barba (se houver)
    if (beardProducts.length > 0 && visitCount >= 1) {
      const randomBeardProduct = beardProducts[Math.floor(Math.random() * beardProducts.length)];
      opportunities.push({
        id: `prod-beard-${randomBeardProduct.id}`,
        type: "product",
        name: randomBeardProduct.name,
        timing: "agora",
        reason: "Complemento para cuidado com barba",
        expectedRevenue: randomBeardProduct.price || averageTicket * 0.3,
        confidence: 70,
        script: `"Para manter a barba sempre alinhada, recomendo o ${randomBeardProduct.name}. Faz toda diferença no dia a dia!"`,
        priority: "medium",
      });
    }

    // Oportunidade 3: Upgrade de Serviço baseado no ticket
    if (averageTicket < 60 && visitCount >= 1) {
      const upgradeValue = 60 - averageTicket;
      opportunities.push({
        id: "svc-upgrade",
        type: "service",
        name: "Upgrade: Pacote Premium",
        timing: "próxima_visita",
        reason: `Ticket atual R$ ${averageTicket.toFixed(2)} - potencial para serviços adicionais`,
        expectedRevenue: upgradeValue,
        confidence: isFrequentClient ? 75 : 55,
        script: isFrequentClient
          ? '"Como você é nosso cliente frequente, que tal experimentar nosso pacote premium na próxima? Tem tratamento completo com desconto especial para você!"'
          : '"Notei que você gosta de cuidar da aparência. Temos um pacote completo que muitos clientes adoram. Posso te explicar?"',
        priority: isFrequentClient ? "high" : "medium",
      });
    }

    // Oportunidade 4: Cliente novo - fidelização
    if (isNewClient) {
      opportunities.push({
        id: "loyalty-new",
        type: "combo",
        name: "Programa de Fidelidade",
        timing: "agora",
        reason: "Cliente novo - oportunidade de criar vínculo",
        expectedRevenue: averageTicket * 3, // Projeção de 3 visitas futuras
        confidence: 80,
        script: '"Como você é novo aqui, queria te contar sobre nosso programa de fidelidade. A cada 5 cortes, você ganha um desconto especial. Vou já te cadastrar!"',
        priority: "high",
      });
    }

    // Oportunidade 5: Combo sazonal personalizado
    const currentMonth = new Date().getMonth();
    const isSummer = currentMonth >= 11 || currentMonth <= 2; // Dez, Jan, Fev
    const isWinter = currentMonth >= 5 && currentMonth <= 8; // Jun, Jul, Ago
    
    if (isSummer) {
      opportunities.push({
        id: "combo-summer",
        type: "combo",
        name: "Combo Verão: Proteção Solar",
        timing: "agora",
        reason: "Temporada de verão - proteção capilar essencial",
        expectedRevenue: averageTicket * 0.5,
        confidence: 70,
        script: '"No verão o cabelo sofre com sol e praia. Nosso combo de proteção deixa saudável e brilhante. Aproveita que está aqui!"',
        priority: "high",
      });
    } else if (isWinter) {
      opportunities.push({
        id: "combo-winter",
        type: "combo",
        name: "Combo Inverno: Hidratação Profunda",
        timing: "agora",
        reason: "Temporada de inverno - hidratação essencial",
        expectedRevenue: averageTicket * 0.5,
        confidence: 70,
        script: '"No inverno o cabelo resseca muito. Nossa hidratação profunda deixa ele macio e saudável. Que tal fazer hoje?"',
        priority: "high",
      });
    }

    // Ordenar por prioridade e confiança
    return opportunities
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence;
      })
      .slice(0, 5); // Limitar a 5 oportunidades mais relevantes
  };

  const detectNegativeFeedback = (
    completed: any[],
    pending: any[]
  ): NegativeFeedbackAlert => {
    const indicators: string[] = [];
    let riskScore = 0;

    // Verificar estrutura do appointment
    if (completed.length > 0) {
      console.log("📋 Campos disponíveis no appointment:", Object.keys(completed[0]));
    }

    // Determinar campo de data
    const getDateField = (apt: any) => {
      return apt.date || apt.appointment_date || apt.scheduled_at || apt.created_at;
    };

    // Indicador 1: Cliente cancelou último agendamento
    if (pending.length === 0 && completed.length > 0) {
      const dateField = getDateField(completed[0]);
      if (dateField) {
        const daysSinceLast = differenceInDays(
          new Date(),
          parseISO(dateField)
        );
        if (daysSinceLast > 45) {
          indicators.push("Não retornou há mais de 45 dias");
          riskScore += 30;
        }
      }
    }

    // Indicador 2: Padrão de visita quebrado
    if (completed.length >= 3) {
      const intervals = [];
      for (let i = 0; i < completed.length - 1; i++) {
        const date1 = getDateField(completed[i]);
        const date2 = getDateField(completed[i + 1]);
        if (date1 && date2) {
          intervals.push(
            differenceInDays(
              parseISO(date1),
              parseISO(date2)
            )
          );
        }
      }
      if (intervals.length > 0) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const dateField = getDateField(completed[0]);
        if (dateField) {
          const daysSinceLast = differenceInDays(new Date(), parseISO(dateField));
          
          if (daysSinceLast > avgInterval * 1.5) {
            indicators.push("Padrão de visita irregular");
            riskScore += 25;
          }
        }
      }
    }

    // Indicador 3: Sem agendamento futuro
    if (pending.length === 0) {
      indicators.push("Sem agendamentos futuros");
      riskScore += 20;
    }

    const severity = riskScore >= 60 ? "critical" : riskScore >= 30 ? "moderate" : "low";

    return {
      detected: riskScore > 30,
      severity,
      indicators,
      riskOfPublicComplaint: Math.min(riskScore, 100),
      suggestedAction: riskScore >= 60
        ? "AÇÃO IMEDIATA: Ligar para o cliente HOJE"
        : "Enviar mensagem de check-in",
      recoveryScript: riskScore >= 60
        ? '"Olá! Notei que não está vindo há um tempo. Aconteceu algo que possamos melhorar? Sua opinião é muito importante pra gente!"'
        : '"Oi! Sentimos sua falta por aqui! Tudo bem com você? Podemos agendar um horário especial?"',
      compensationOffer: riskScore >= 60 ? "20% de desconto na próxima visita" : undefined,
    };
  };

  const analyzeChurnRisk = (
    appointments: any[],
    averageTicket: number
  ): ChurnRiskAlert => {
    // Helper para pegar campo de data
    const getDateField = (apt: any) => {
      return apt.date || apt.appointment_date || apt.scheduled_at || apt.created_at;
    };

    if (appointments.length === 0) {
      return {
        isAtRisk: true,
        riskLevel: "critical",
        daysDelayed: 999,
        lostRevenueProjection: 0,
        recoveryAction: "Cliente novo sem histórico",
        discountOffer: 0,
        urgency: "Baixa",
        contactScript: "Cliente ainda não retornou para primeira visita",
      };
    }

    const lastVisitDate = getDateField(appointments[0]);
    if (!lastVisitDate) {
      console.error("Data não encontrada no appointment:", appointments[0]);
      return {
        isAtRisk: false,
        riskLevel: "low",
        daysDelayed: 0,
        lostRevenueProjection: 0,
        recoveryAction: "Dados insuficientes",
        discountOffer: 0,
        urgency: "Normal",
        contactScript: "Erro ao processar dados do cliente",
      };
    }

    const lastVisit = parseISO(lastVisitDate);
    const daysSinceLast = differenceInDays(new Date(), lastVisit);

    // Calcular intervalo médio
    let avgInterval = 30;
    if (appointments.length >= 2) {
      const intervals = [];
      for (let i = 0; i < Math.min(appointments.length - 1, 5); i++) {
        const date1 = getDateField(appointments[i]);
        const date2 = getDateField(appointments[i + 1]);
        if (date1 && date2) {
          intervals.push(
            differenceInDays(
              parseISO(date1),
              parseISO(date2)
            )
          );
        }
      }
      if (intervals.length > 0) {
        avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
      }
    }

    const daysDelayed = Math.max(0, daysSinceLast - avgInterval);
    const isAtRisk = daysDelayed > 7;

    let riskLevel: "low" | "moderate" | "high" | "critical" = "low";
    let discountOffer = 0;
    let urgency = "Normal";

    if (daysDelayed >= 30) {
      riskLevel = "critical";
      discountOffer = 25;
      urgency = "URGENTE - Risco de perda permanente";
    } else if (daysDelayed >= 15) {
      riskLevel = "high";
      discountOffer = 20;
      urgency = "Alto - Agir nas próximas 48h";
    } else if (daysDelayed >= 7) {
      riskLevel = "moderate";
      discountOffer = 15;
      urgency = "Moderado - Contato esta semana";
    }

    const lostRevenueProjection = averageTicket * 12; // Estimativa de valor anual perdido

    return {
      isAtRisk,
      riskLevel,
      daysDelayed,
      lostRevenueProjection,
      recoveryAction: isAtRisk
        ? `Oferecer ${discountOffer}% de desconto + horário VIP`
        : "Manter contato regular",
      discountOffer,
      urgency,
      contactScript: isAtRisk
        ? `"Olá! Notamos que está há ${daysSinceLast} dias sem vir. Preparamos uma condição especial de ${discountOffer}% OFF pra você voltar! Quando podemos agendar?"`
        : `"Olá! Seu cabelo deve estar pedindo um retoque. Quer agendar para esta semana?"`,
    };
  };

  const calculateReputationProtection = (
    appointments: any[],
    feedbackRisk: NegativeFeedbackAlert
  ): ReputationProtection => {
    const shouldRequest = !feedbackRisk.detected && appointments.length >= 2;
    const satisfactionScore = feedbackRisk.detected ? 30 : 85;

    return {
      shouldRequestReview: shouldRequest,
      platform: "google",
      timing: shouldRequest ? "immediate" : "after_service",
      incentive: shouldRequest
        ? "10% de desconto no próximo corte ao deixar avaliação"
        : "Resolver problema antes de solicitar",
      reviewUrl: "https://g.page/r/[SEU-GOOGLE-BUSINESS]/review",
      satisfactionScore,
    };
  };

  const calculateAverageInterval = (appointments: any[]): number => {
    if (appointments.length < 2) return 30;

    const getDateField = (apt: any) => {
      return apt.date || apt.appointment_date || apt.scheduled_at || apt.created_at;
    };

    const intervals = [];
    for (let i = 0; i < Math.min(appointments.length - 1, 5); i++) {
      try {
        const date1 = getDateField(appointments[i]);
        const date2 = getDateField(appointments[i + 1]);
        if (date1 && date2) {
          const days = differenceInDays(
            parseISO(date1),
            parseISO(date2)
          );
          if (days > 0) intervals.push(days);
        }
      } catch (err) {
        console.error("Erro ao calcular intervalo:", err);
      }
    }

    return intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : 30;
  };

  // ============= MAIN ANALYSIS =============

  const analyzeClient = async (clientId: string) => {
    if (!session?.user?.id) return;
    
    try {
      setAnalyzing(true);

      console.log("🔍 A.P.E.R. - Iniciando análise inteligente...");

      // Buscar histórico completo
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", clientId)
        .eq("user_id", session.user.id);

      if (error) throw error;

      console.log("📋 Estrutura do appointment:", appointments?.[0]);

      const completed = (appointments || []).filter(a => a.status === "completed");
      const pending = (appointments || []).filter(a => a.status !== "completed");

      // Buscar produtos
      const { data: products } = await supabase
        .from("products")
        .select("id, name, category, price")
        .eq("user_id", session.user.id)
        .eq("active", true);

      const client = clients.find(c => c.id === clientId);
      const averageTicket = client?.averageTicket || 0;

      console.log("📊 Dados carregados - Iniciando IA...");

      // ANÁLISES PREDITIVAS
      const upsellOpportunities = generateUpsellOpportunities(
        completed,
        products || [],
        averageTicket
      );

      const negativeFeedbackRisk = detectNegativeFeedback(completed, pending);
      const churnRisk = analyzeChurnRisk(completed, averageTicket);
      const reputationProtection = calculateReputationProtection(
        completed,
        negativeFeedbackRisk
      );

      const averageInterval = calculateAverageInterval(completed);
      
      // Pegar campo de data do último appointment
      const getDateField = (apt: any) => {
        return apt?.date || apt?.appointment_date || apt?.scheduled_at || apt?.created_at;
      };
      
      const lastVisit = getDateField(completed[0]) || new Date().toISOString();
      const nextVisitDate = addDays(parseISO(lastVisit), averageInterval);

      const projectedRevenueLift = upsellOpportunities.reduce(
        (sum, opp) => sum + opp.expectedRevenue,
        0
      );

      console.log("✅ Análise concluída!");
      console.log("💰 Aumento projetado: R$", projectedRevenueLift.toFixed(2));
      console.log("🚨 Risco de churn:", churnRisk.riskLevel);
      console.log("⚠️ Risco de reclamação:", negativeFeedbackRisk.riskOfPublicComplaint + "%");

      setAnalysis({
        upsellOpportunities,
        nextVisitPrediction: {
          date: nextVisitDate,
          confidence: completed.length >= 3 ? 85 : 65,
          suggestedReminder: `Olá! Seu corte está em dia? Geralmente você retorna a cada ${averageInterval} dias. Que tal agendar?`,
        },
        negativeFeedbackRisk,
        reputationProtection,
        churnRisk,
        projectedRevenueLift,
        reputationRiskScore: negativeFeedbackRisk.riskOfPublicComplaint,
      });

      toast({
        title: "✅ Análise A.P.E.R. Concluída",
        description: `${upsellOpportunities.length} oportunidades identificadas`,
      });
    } catch (error: any) {
      console.error("Erro na análise:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao analisar cliente",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // ============= RENDER =============

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            A.P.E.R. - IA Preditiva
          </h1>
          <p className="text-muted-foreground">
            Análise Preditiva de Estilo e Reputação
          </p>
        </div>
        <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Zap className="h-4 w-4 mr-1" />
          IA Ativa
        </Badge>
      </div>

      {/* Intro Card */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertTitle>Como funciona o A.P.E.R.</AlertTitle>
        <AlertDescription>
          Selecione um cliente e clique em <strong>"Analisar com IA"</strong> para gerar:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Oportunidades de Venda:</strong> Produtos e serviços no momento certo</li>
            <li><strong>Proteção de Reputação:</strong> Detecta riscos de feedback negativo</li>
            <li><strong>Recuperação de Clientes:</strong> Previne churn e aumenta retenção</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cliente Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selecionar Cliente
            </CardTitle>
            <CardDescription>Escolha um cliente para análise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : filteredClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedClient?.id === client.id
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                          : "hover:border-gray-400"
                      }`}
                    >
                      <div className="font-semibold">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.phone}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {client.visitCount} visitas
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          R$ {client.averageTicket.toFixed(0)} médio
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {selectedClient && (
              <Button
                onClick={() => analyzeClient(selectedClient.id)}
                disabled={analyzing}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Brain className="h-4 w-4 mr-2" />
                {analyzing ? "Analisando..." : "Analisar com IA"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <div className="lg:col-span-2">
          {!analysis ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione um cliente e clique em "Analisar com IA"<br />
                  para gerar recomendações inteligentes
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="sales" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="sales">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Vendas
                </TabsTrigger>
                <TabsTrigger value="reputation">
                  <Shield className="h-4 w-4 mr-2" />
                  Reputação
                </TabsTrigger>
                <TabsTrigger value="recovery">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Recuperação
                </TabsTrigger>
              </TabsList>

              {/* TAB: VENDAS (UPSELL) */}
              <TabsContent value="sales" className="space-y-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <TrendingUp className="h-5 w-5" />
                      Aumento Projetado de Receita
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                      + R$ {analysis.projectedRevenueLift.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {analysis.upsellOpportunities.length} oportunidades identificadas pela IA
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {analysis.upsellOpportunities.map((opp) => (
                    <Card key={opp.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {opp.type === "product" && <ShoppingBag className="h-4 w-4" />}
                              {opp.type === "service" && <Scissors className="h-4 w-4" />}
                              {opp.type === "combo" && <Award className="h-4 w-4" />}
                              {opp.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{opp.reason}</p>
                          </div>
                          <Badge
                            variant={opp.priority === "high" ? "default" : "secondary"}
                            className={opp.priority === "high" ? "bg-green-600" : ""}
                          >
                            {opp.priority === "high" ? "Alta" : "Média"} Prioridade
                          </Badge>
                        </div>

                        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 mt-3">
                          <MessageSquare className="h-4 w-4" />
                          <AlertTitle>Script de Venda</AlertTitle>
                          <AlertDescription className="italic">
                            {opp.script}
                          </AlertDescription>
                        </Alert>

                        <div className="flex items-center justify-between mt-3 text-sm">
                          <span className="text-muted-foreground">
                            Receita esperada: <strong className="text-green-600">R$ {opp.expectedRevenue.toFixed(2)}</strong>
                          </span>
                          <Badge variant="outline">{opp.confidence}% confiança</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* TAB: REPUTAÇÃO */}
              <TabsContent value="reputation" className="space-y-4">
                {/* Feedback Negativo */}
                {analysis.negativeFeedbackRisk.detected && (
                  <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-5 w-5" />
                        ⚠️ Alerta: Risco de Feedback Negativo
                      </CardTitle>
                      <CardDescription>
                        Risco de reclamação pública: <strong>{analysis.negativeFeedbackRisk.riskOfPublicComplaint}%</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">Indicadores detectados:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysis.negativeFeedbackRisk.indicators.map((ind, i) => (
                            <li key={i}>{ind}</li>
                          ))}
                        </ul>
                      </div>

                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Ação Sugerida</AlertTitle>
                        <AlertDescription>
                          {analysis.negativeFeedbackRisk.suggestedAction}
                        </AlertDescription>
                      </Alert>

                      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                        <MessageSquare className="h-4 w-4" />
                        <AlertTitle>Script de Recuperação</AlertTitle>
                        <AlertDescription className="italic">
                          {analysis.negativeFeedbackRisk.recoveryScript}
                        </AlertDescription>
                      </Alert>

                      {analysis.negativeFeedbackRisk.compensationOffer && (
                        <Badge className="bg-orange-600">
                          Oferecer: {analysis.negativeFeedbackRisk.compensationOffer}
                        </Badge>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Ligar Agora
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Send className="h-4 w-4 mr-2" />
                          Enviar WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Solicitar Avaliação */}
                {analysis.reputationProtection.shouldRequestReview && (
                  <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <Star className="h-5 w-5" />
                        ⭐ Momento Ideal para Pedir Avaliação
                      </CardTitle>
                      <CardDescription>
                        Score de satisfação: <strong>{analysis.reputationProtection.satisfactionScore}%</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">
                        <strong>Incentivo:</strong> {analysis.reputationProtection.incentive}
                      </p>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                          <Star className="h-4 w-4 mr-2" />
                          Google Reviews
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Instagram className="h-4 w-4 mr-2" />
                          Instagram
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Facebook className="h-4 w-4 mr-2" />
                          Facebook
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!analysis.negativeFeedbackRisk.detected && !analysis.reputationProtection.shouldRequestReview && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Reputação Protegida</h3>
                      <p className="text-muted-foreground">
                        Nenhum risco detectado. Continue o bom trabalho!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* TAB: RECUPERAÇÃO (CHURN) */}
              <TabsContent value="recovery" className="space-y-4">
                {analysis.churnRisk.isAtRisk ? (
                  <Card className={`border-l-4 ${
                    analysis.churnRisk.riskLevel === "critical" ? "border-l-red-600 bg-red-50 dark:bg-red-950" :
                    analysis.churnRisk.riskLevel === "high" ? "border-l-orange-600 bg-orange-50 dark:bg-orange-950" :
                    "border-l-yellow-600 bg-yellow-50 dark:bg-yellow-950"
                  }`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${
                          analysis.churnRisk.riskLevel === "critical" ? "text-red-600" :
                          analysis.churnRisk.riskLevel === "high" ? "text-orange-600" :
                          "text-yellow-600"
                        }`} />
                        🚨 Risco de Perda de Cliente
                      </CardTitle>
                      <CardDescription>
                        Nível: <strong className="uppercase">{analysis.churnRisk.riskLevel}</strong>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Dias de atraso</p>
                          <p className="text-2xl font-bold text-red-600">
                            {analysis.churnRisk.daysDelayed}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Receita em risco/ano</p>
                          <p className="text-2xl font-bold text-red-600">
                            R$ {analysis.churnRisk.lostRevenueProjection.toFixed(0)}
                          </p>
                        </div>
                      </div>

                      <Alert className={
                        analysis.churnRisk.riskLevel === "critical" ? "bg-red-100 dark:bg-red-900 border-red-300" : ""
                      }>
                        <Clock className="h-4 w-4" />
                        <AlertTitle>Urgência</AlertTitle>
                        <AlertDescription className="font-semibold">
                          {analysis.churnRisk.urgency}
                        </AlertDescription>
                      </Alert>

                      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                        <MessageSquare className="h-4 w-4" />
                        <AlertTitle>Script de Recuperação</AlertTitle>
                        <AlertDescription className="italic">
                          {analysis.churnRisk.contactScript}
                        </AlertDescription>
                      </Alert>

                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">💡 Oferta de Recuperação</h4>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {analysis.churnRisk.discountOffer}% de desconto + Horário VIP
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                          <Phone className="h-4 w-4 mr-2" />
                          Ligar Agora
                        </Button>
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          <Send className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Mail className="h-4 w-4 mr-2" />
                          E-mail
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Cliente Ativo</h3>
                      <p className="text-muted-foreground">
                        Padrão de visita regular. Continue o bom relacionamento!
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Próxima Visita */}
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Calendar className="h-5 w-5" />
                      Predição de Próxima Visita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Data prevista</p>
                      <p className="text-xl font-bold">
                        {format(analysis.nextVisitPrediction.date, "dd 'de' MMMM", { locale: pt })}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {analysis.nextVisitPrediction.confidence}% de confiança
                    </Badge>

                    <Alert>
                      <MessageSquare className="h-4 w-4" />
                      <AlertTitle>Lembrete Sugerido</AlertTitle>
                      <AlertDescription className="italic">
                        {analysis.nextVisitPrediction.suggestedReminder}
                      </AlertDescription>
                    </Alert>

                    <Button size="sm" className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Lembrete
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default APERModule;
