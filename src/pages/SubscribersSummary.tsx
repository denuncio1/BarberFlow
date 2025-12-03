"use client";

import React, { useState, useEffect } from 'react';
import { Users, Send, Download, Search, ChevronRight, TrendingUp, Calendar, DollarSign, UserCheck, UserX, UsersRound, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Subscriber {
  id: string;
  client_id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  next_billing_date: string;
  status: string;
  clients: { 
    first_name: string; 
    last_name: string; 
    phone?: string;
    id?: string;
  } | null;
  service_packages: { 
    name: string; 
    value: number; 
    service_time?: number;
    id?: string;
  } | null;
}

const SubscribersSummary = () => {
  const { user } = useSession();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'canceled'>('active');
  const [sortBy, setSortBy] = useState<'expiration' | 'name' | 'ltv'>('expiration');

  useEffect(() => {
    const fetchSubscribers = async () => {
      if (!user) return;

      setLoading(true);

      let query = supabase
        .from('service_package_sales')
        .select(`
          id,
          client_id,
          service_package_id,
          price,
          purchased_quantity,
          remaining_quantity,
          created_at
        `)
        .eq('user_id', user.id);

      if (statusFilter !== 'all') {
        // Calcular status baseado em remaining_quantity
        if (statusFilter === 'active') {
          query = query.gt('remaining_quantity', 0);
        } else if (statusFilter === 'expired') {
          query = query.eq('remaining_quantity', 0);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar assinantes:', error);
      } else {
        // Buscar dados relacionados separadamente
        const mappedData = await Promise.all((data || []).map(async (item: any) => {
          // Buscar cliente
          const { data: clientData } = await supabase
            .from('clients')
            .select('first_name, last_name, phone')
            .eq('id', item.client_id)
            .single();

          // Buscar pacote
          const { data: packageData } = await supabase
            .from('service_packages')
            .select('name, value, service_time')
            .eq('id', item.service_package_id)
            .single();

          // Calcular status baseado em remaining_quantity
          const status = item.remaining_quantity > 0 ? 'active' : 'expired';

          return {
            ...item,
            package_id: item.service_package_id, // Manter compatibilidade
            start_date: item.created_at,
            end_date: null,
            next_billing_date: null,
            status: status,
            clients: clientData,
            service_packages: packageData,
          };
        }));
        
        setSubscribers(mappedData);
      }

      setLoading(false);
    };

    fetchSubscribers();
  }, [user, statusFilter]);

  const activeSubscribers = subscribers.filter(s => s.status === 'active');
  const expiredSubscribers = subscribers.filter(s => s.status === 'expired');
  const canceledSubscribers = subscribers.filter(s => s.status === 'canceled');
  const totalSubscribers = subscribers.length;

  const totalRevenue = activeSubscribers.reduce((sum, sub) => sum + (sub.service_packages?.value || 0), 0);
  const averageRevenue = activeSubscribers.length > 0 ? totalRevenue / activeSubscribers.length : 0;

  const calculateLTV = (subscriber: Subscriber) => {
    if (!subscriber.start_date || !subscriber.service_packages?.value) return 0;
    const monthsActive = Math.max(1, Math.ceil(differenceInDays(new Date(), new Date(subscriber.start_date)) / 30));
    return monthsActive * subscriber.service_packages.value;
  };

  const filteredSubscribers = subscribers
    .filter(sub => {
      const fullName = sub.clients ? `${sub.clients.first_name} ${sub.clients.last_name}`.toLowerCase() : '';
      return fullName.includes(searchTerm.toLowerCase()) || sub.clients?.phone?.includes(searchTerm);
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = a.clients ? `${a.clients.first_name} ${a.clients.last_name}` : '';
        const nameB = b.clients ? `${b.clients.first_name} ${b.clients.last_name}` : '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'ltv') {
        return calculateLTV(b) - calculateLTV(a);
      }
      return new Date(a.end_date || 0).getTime() - new Date(b.end_date || 0).getTime();
    });

  const getDaysUntilExpiration = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getExpirationColor = (days: number) => {
    if (days < 0) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (days <= 7) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    if (days <= 30) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-green-500 bg-green-500/10 border-green-500/20';
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-100 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Assinantes do Clube</h1>
        <div className="flex gap-3">
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold">
            <Send className="h-4 w-4 mr-2" />
            Enviar notificação
          </Button>
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold">
            <Download className="h-4 w-4 mr-2" />
            Exportar assinantes
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total de Clientes Ativos</p>
              <p className="text-gray-500 text-xs">Clientes que tem uma assinatura ativa na barbearia e estão ativos no clube</p>
            </div>
          </div>
          <p className="text-5xl font-bold text-green-400">{activeSubscribers.length}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total de Clientes Vencidos</p>
              <p className="text-gray-500 text-xs">Clientes que tem uma assinatura vencida na barbearia e não cancelaram</p>
            </div>
          </div>
          <p className="text-5xl font-bold text-orange-400">{expiredSubscribers.length}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total de Clientes Cancelados</p>
              <p className="text-gray-500 text-xs">Clientes que cancelaram seus planos e não possuem nenhuma assinatura ativa</p>
            </div>
          </div>
          <p className="text-5xl font-bold text-red-400">{canceledSubscribers.length}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total de clientes geral</p>
              <p className="text-gray-500 text-xs">Clientes que já tiveram uma assinatura na barbearia (independente do status atual)</p>
            </div>
          </div>
          <p className="text-5xl font-bold text-purple-400">{totalSubscribers}</p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="list" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900">
              Lista de Assinantes
            </TabsTrigger>
            <TabsTrigger value="ltv" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900">
              LTV por Plano
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-3 items-center">
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Status: Ativos" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by subscriber"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>

            <Button variant="outline" size="icon" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
              <Search className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              Ordenar por data de vencimento
            </Button>
          </div>
        </div>

        <TabsContent value="list" className="space-y-0">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Carregando assinantes...</p>
            </div>
          ) : filteredSubscribers.length > 0 ? (
            <div className="space-y-3">
              {filteredSubscribers.map((subscriber) => {
                const daysUntil = getDaysUntilExpiration(subscriber.end_date);
                const ltv = calculateLTV(subscriber);

                return (
                  <div
                    key={subscriber.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-gray-700 rounded-lg px-4 py-2 text-center min-w-[100px]">
                        <p className="text-xs text-gray-400">ID CLIENTE</p>
                        <p className="font-mono font-semibold">{subscriber.client_id.substring(0, 7)}</p>
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          {subscriber.clients ? `${subscriber.clients.first_name} ${subscriber.clients.last_name}` : 'N/A'}
                        </p>
                        <p className="text-yellow-500 text-sm">{subscriber.clients?.phone || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">PLANO</p>
                        <p className="font-semibold">{subscriber.service_packages?.name || 'N/A'}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">MEMBRO DESDE</p>
                        <p className="font-semibold">
                          {subscriber.start_date ? format(new Date(subscriber.start_date), 'dd/MM/yyyy') : '-'}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">VENCIMENTO</p>
                        <p className="font-semibold">
                          {subscriber.end_date ? format(new Date(subscriber.end_date), 'dd/MM/yyyy') : '-'}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">LTV</p>
                        <p className="font-semibold">{subscriber.service_packages?.service_time || '-'} meses</p>
                      </div>

                      <div className="text-center min-w-[100px]">
                        <p className="text-xs text-gray-400 mb-1">STATUS</p>
                        <span className={cn(
                          "inline-block px-3 py-1 rounded-full text-xs font-semibold",
                          subscriber.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          subscriber.status === 'expired' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        )}>
                          {subscriber.status === 'active' ? 'Ativo' : 
                           subscriber.status === 'expired' ? 'Vencido' : 'Cancelado'}
                        </span>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum assinante encontrado.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ltv" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Receita Total (Ativos)</p>
              <p className="text-3xl font-bold text-green-400">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">Média por Assinante</p>
              <p className="text-3xl font-bold text-blue-400">R$ {averageRevenue.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400 text-sm mb-2">LTV Médio</p>
              <p className="text-3xl font-bold text-purple-400">
                R$ {activeSubscribers.length > 0 
                  ? (activeSubscribers.reduce((sum, sub) => sum + calculateLTV(sub), 0) / activeSubscribers.length).toFixed(2).replace('.', ',')
                  : '0,00'}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscribersSummary;
