import { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, Send, Users, Trophy, Sparkles, Crown, Star, Award, Target, Calendar, MessageSquare
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date?: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_appointments: number;
  last_visit?: string;
}

const MarketingLoyalty = () => {
  const { session, isLoading } = useSession();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    bronzeClients: 0,
    silverClients: 0,
    goldClients: 0,
    platinumClients: 0,
    totalPoints: 0,
    avgPoints: 0,
    birthdaysThisMonth: 0,
    inactiveClients: 0,
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'points' as 'points' | 'discount' | 'birthday' | 'inactive' | 'vip',
    target_segment: 'all',
    message: '',
    discount_percent: 0,
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id);

      if (clientsError) {
        console.error('Erro ao buscar clientes:', clientsError);
        showError('Erro ao carregar clientes');
        return;
      }

      // Buscar TODOS os agendamentos para ver quais status existem
      const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('client_id, appointment_date, status')
        .eq('user_id', session.user.id);

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos:', appointmentsError);
        showError('Erro ao carregar agendamentos');
        return;
      }

      console.log('📊 TODOS agendamentos:', allAppointments?.length || 0);
      console.log('📊 Status encontrados:', [...new Set(allAppointments?.map(a => a.status) || [])]);

      // Filtrar apenas os finalizados (sem toLowerCase para manter o status exato)
      const appointmentsData = (allAppointments || []).filter(
        apt => ['completed', 'finalized', 'concluded', 'done', 'scheduled'].includes(apt.status || '')
      );

      console.log('📊 Agendamentos contados:', appointmentsData.length);
      console.log('📊 Status contados:', [...new Set(appointmentsData.map(a => a.status))]);

      const processedClients = (clientsData || []).map((client: any) => {
        const clientAppointments = (appointmentsData || []).filter(
          (apt: any) => apt.client_id === client.id
        );

        const totalAppointments = clientAppointments.length;
        const points = totalAppointments * 10;
        
        if (totalAppointments > 0) {
          console.log(`👤 ${client.first_name} ${client.last_name}:`, totalAppointments, 'visitas,', points, 'pontos');
        }

        let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
        if (points >= 500) tier = 'platinum';
        else if (points >= 300) tier = 'gold';
        else if (points >= 100) tier = 'silver';

        const lastVisit = clientAppointments.length > 0
          ? clientAppointments.sort((a, b) => 
              new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
            )[0].appointment_date
          : null;

        return {
          ...client,
          points,
          tier,
          total_appointments: totalAppointments,
          last_visit: lastVisit,
        };
      });

      setClients(processedClients);
      calculateStats(processedClients);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (clientsData: any[]) => {
    const today = new Date();
    const currentMonth = today.getMonth();

    setStats({
      totalClients: clientsData.length,
      activeClients: clientsData.filter(c => {
        if (!c.last_visit) return false;
        return differenceInDays(today, parseISO(c.last_visit)) <= 60;
      }).length,
      bronzeClients: clientsData.filter(c => c.tier === 'bronze').length,
      silverClients: clientsData.filter(c => c.tier === 'silver').length,
      goldClients: clientsData.filter(c => c.tier === 'gold').length,
      platinumClients: clientsData.filter(c => c.tier === 'platinum').length,
      totalPoints: clientsData.reduce((sum, c) => sum + c.points, 0),
      avgPoints: clientsData.length > 0 
        ? Math.round(clientsData.reduce((sum, c) => sum + c.points, 0) / clientsData.length)
        : 0,
      birthdaysThisMonth: clientsData.filter(c => {
        if (!c.birth_date) return false;
        return parseISO(c.birth_date).getMonth() === currentMonth;
      }).length,
      inactiveClients: clientsData.filter(c => {
        if (!c.last_visit) return true;
        return differenceInDays(today, parseISO(c.last_visit)) > 60;
      }).length,
    });
  };

  const getCampaignTemplate = (type: string) => {
    const templates = {
      points: `🎉 Parabéns! Você tem [PONTOS] pontos acumulados!\n\n✨ Continue assim e ganhe recompensas incríveis!`,
      discount: `🎁 Oferta Especial!\n\nGanhe ${campaignForm.discount_percent}% de desconto no próximo serviço!\n\n📅 Agende agora!`,
      birthday: `🎂 Feliz Aniversário!\n\n🎁 Ganhe 50 pontos extras + desconto especial!\n\nAgende seu horário!`,
      inactive: `👋 Sentimos sua falta!\n\n🎁 20% OFF no seu retorno!\n\nVolte logo!`,
      vip: `👑 Exclusivo VIP\n\n✨ Prioridade no agendamento\n🎁 Pontos em dobro\n💎 Benefícios exclusivos`,
    };
    return templates[type as keyof typeof templates] || '';
  };

  const sendCampaign = () => {
    if (!campaignForm.name || !campaignForm.message) {
      showError('Preencha todos os campos');
      return;
    }

    let targetClients = clients;
    
    switch (campaignForm.target_segment) {
      case 'inactive':
        targetClients = clients.filter(c => {
          if (!c.last_visit) return true;
          return differenceInDays(new Date(), parseISO(c.last_visit)) > 60;
        });
        break;
      case 'vip':
        targetClients = clients.filter(c => c.tier === 'platinum' || c.tier === 'gold');
        break;
      case 'birthday':
        targetClients = clients.filter(c => c.birth_date && parseISO(c.birth_date).getMonth() === new Date().getMonth());
        break;
    }

    showSuccess(`${targetClients.length} clientes selecionados!`);
    
    if (targetClients.length > 0 && targetClients[0].phone) {
      const phone = targetClients[0].phone.replace(/\D/g, '');
      const message = encodeURIComponent(campaignForm.message);
      window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing e Fidelização</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Campanhas e programa de fidelidade
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Send className="w-4 h-4" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Campanha</DialogTitle>
              <DialogDescription>Envie mensagens personalizadas</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Campanha</Label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={campaignForm.type}
                  onValueChange={(value: any) => setCampaignForm({ 
                    type: value,
                    message: getCampaignTemplate(value)
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Pontos de Fidelidade</SelectItem>
                    <SelectItem value="discount">Desconto</SelectItem>
                    <SelectItem value="birthday">Aniversariantes</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Segmento</Label>
                <Select
                  value={campaignForm.target_segment}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, target_segment: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos ({clients.length})</SelectItem>
                    <SelectItem value="vip">VIP ({stats.goldClients + stats.platinumClients})</SelectItem>
                    <SelectItem value="inactive">Inativos ({stats.inactiveClients})</SelectItem>
                    <SelectItem value="birthday">Aniversariantes ({stats.birthdaysThisMonth})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {campaignForm.type === 'discount' && (
                <div>
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    value={campaignForm.discount_percent}
                    onChange={(e) => setCampaignForm({ ...campaignForm, discount_percent: parseInt(e.target.value) })}
                  />
                </div>
              )}

              <div>
                <Label>Mensagem</Label>
                <Textarea
                  rows={6}
                  value={campaignForm.message}
                  onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                />
              </div>

              <Button onClick={sendCampaign} className="w-full gap-2">
                <Send className="w-4 h-4" />
                Enviar via WhatsApp
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalClients}</div>
            <p className="text-xs opacity-90">{stats.activeClients} ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Pontos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs opacity-90">Média: {stats.avgPoints}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Aniversariantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.birthdaysThisMonth}</div>
            <p className="text-xs opacity-90">Este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inactiveClients}</div>
            <p className="text-xs opacity-90">Para reativar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Categorias de Fidelidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-orange-700 to-orange-900 text-white">
              <Star className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{stats.bronzeClients}</div>
              <div className="text-sm">Bronze</div>
              <div className="text-xs opacity-75">0-99 pts</div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-400 to-gray-500 text-white">
              <Award className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{stats.silverClients}</div>
              <div className="text-sm">Prata</div>
              <div className="text-xs opacity-75">100-299 pts</div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Trophy className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{stats.goldClients}</div>
              <div className="text-sm">Ouro</div>
              <div className="text-xs opacity-75">300-499 pts</div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Crown className="w-6 h-6 mb-2" />
              <div className="text-2xl font-bold">{stats.platinumClients}</div>
              <div className="text-sm">Platina</div>
              <div className="text-xs opacity-75">500+ pts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Top 10 Clientes VIP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients
              .sort((a, b) => b.points - a.points)
              .slice(0, 10)
              .map((client, index) => (
                <div key={client.id} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{client.first_name} {client.last_name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {client.total_appointments} visitas
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    {client.tier.toUpperCase()}
                  </Badge>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary flex items-center gap-1">
                      <Sparkles className="w-5 h-5" />
                      {client.points}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingLoyalty;