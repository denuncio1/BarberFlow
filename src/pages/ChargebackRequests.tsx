"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, Calendar, ChevronRight, Search, Filter, Download, TrendingDown, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChargebackRequest {
  id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  status: 'pending' | 'analyzing' | 'approved' | 'rejected' | 'disputed';
  value: number;
  reason?: string;
  created_at: string;
  updated_at: string;
  payment_date?: string;
  transaction_id?: string;
  plan_name?: string;
}

const ChargebackRequests: React.FC = () => {
  const { user } = useSession();
  const [requests, setRequests] = useState<ChargebackRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ChargebackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Mock data para demonstração
  const mockRequests: ChargebackRequest[] = [
    {
      id: '1',
      client_name: 'João Silva',
      client_phone: '(11) 98765-4321',
      client_email: 'joao@email.com',
      status: 'pending',
      value: 99.90,
      reason: 'Serviço não prestado',
      created_at: '2025-11-20T10:30:00',
      updated_at: '2025-11-20T10:30:00',
      payment_date: '2025-11-15',
      transaction_id: 'TXN-2025-001',
      plan_name: 'Plano Gold'
    },
    {
      id: '2',
      client_name: 'Maria Santos',
      client_phone: '(11) 97654-3210',
      client_email: 'maria@email.com',
      status: 'analyzing',
      value: 129.90,
      reason: 'Cobrança duplicada',
      created_at: '2025-11-18T14:20:00',
      updated_at: '2025-11-22T09:15:00',
      payment_date: '2025-11-10',
      transaction_id: 'TXN-2025-002',
      plan_name: 'Plano Diamante'
    },
    {
      id: '3',
      client_name: 'Pedro Oliveira',
      client_phone: '(11) 96543-2109',
      client_email: 'pedro@email.com',
      status: 'approved',
      value: 79.90,
      reason: 'Cancelamento não processado',
      created_at: '2025-11-15T11:45:00',
      updated_at: '2025-11-21T16:30:00',
      payment_date: '2025-11-08',
      transaction_id: 'TXN-2025-003',
      plan_name: 'Plano Prata'
    },
    {
      id: '4',
      client_name: 'Ana Costa',
      client_phone: '(11) 95432-1098',
      client_email: 'ana@email.com',
      status: 'rejected',
      value: 149.90,
      reason: 'Valor incorreto cobrado',
      created_at: '2025-11-12T09:20:00',
      updated_at: '2025-11-20T14:10:00',
      payment_date: '2025-11-05',
      transaction_id: 'TXN-2025-004',
      plan_name: 'Plano Premium'
    },
    {
      id: '5',
      client_name: 'Carlos Ferreira',
      client_phone: '(11) 94321-0987',
      client_email: 'carlos@email.com',
      status: 'disputed',
      value: 99.90,
      reason: 'Não reconheço a compra',
      created_at: '2025-11-10T15:50:00',
      updated_at: '2025-11-23T11:20:00',
      payment_date: '2025-11-03',
      transaction_id: 'TXN-2025-005',
      plan_name: 'Plano Gold'
    }
  ];

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, dateFrom, dateTo]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Usando dados mock por enquanto
      setRequests(mockRequests);
    } catch (error: any) {
      console.error('Erro ao buscar solicitações:', error);
      showError('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.client_phone?.includes(searchTerm) ||
        r.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por data
    if (dateFrom) {
      filtered = filtered.filter(r => new Date(r.created_at) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(r => new Date(r.created_at) <= dateTo);
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statuses = {
      pending: { label: 'Pendente', icon: Clock, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      analyzing: { label: 'Em Análise', icon: AlertCircle, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      approved: { label: 'Aprovado', icon: CheckCircle, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      rejected: { label: 'Rejeitado', icon: XCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      disputed: { label: 'Em Disputa', icon: AlertTriangle, className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    };
    const config = statuses[status as keyof typeof statuses] || statuses.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn("flex items-center gap-1", config.className)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatsCount = (status: string) => {
    return requests.filter(r => r.status === status).length;
  };

  const getTotalValue = (status?: string) => {
    const filtered = status ? requests.filter(r => r.status === status) : requests;
    return filtered.reduce((sum, r) => sum + r.value, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-gray-400">Carregando solicitações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Solicitações de Chargeback - Assinaturas</h1>
            <p className="text-gray-400 mt-1">Gerencie contestações e estornos de pagamentos</p>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar relatório
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Pendentes</span>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">{getStatsCount('pending')}</div>
            <div className="text-xs text-gray-500 mt-1">R$ {getTotalValue('pending').toFixed(2).replace('.', ',')}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Em Análise</span>
              <AlertCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">{getStatsCount('analyzing')}</div>
            <div className="text-xs text-gray-500 mt-1">R$ {getTotalValue('analyzing').toFixed(2).replace('.', ',')}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Aprovados</span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">{getStatsCount('approved')}</div>
            <div className="text-xs text-gray-500 mt-1">R$ {getTotalValue('approved').toFixed(2).replace('.', ',')}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Rejeitados</span>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">{getStatsCount('rejected')}</div>
            <div className="text-xs text-gray-500 mt-1">R$ {getTotalValue('rejected').toFixed(2).replace('.', ',')}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-orange-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Em Disputa</span>
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400">{getStatsCount('disputed')}</div>
            <div className="text-xs text-gray-500 mt-1">R$ {getTotalValue('disputed').toFixed(2).replace('.', ',')}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100 mb-1">Filtros de Busca</h2>
            <p className="text-sm text-gray-400">Encontre solicitações por status, período ou cliente</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Start</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 justify-start",
                        !dateFrom && "text-gray-400"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "01/11/2025"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      locale={ptBR}
                      className="bg-gray-800"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">End</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 justify-start",
                        !dateTo && "text-gray-400"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "30/11/2025"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      locale={ptBR}
                      className="bg-gray-800"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-7">
                <label className="text-xs text-gray-400 mb-1 block">Pesquisar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Pesquisar por nome do cliente"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="col-span-1 flex items-end">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Status Filter */}
        <div className="flex gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('all')}
            className={cn(
              "flex-1",
              statusFilter === 'all' ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600' : 'text-gray-400 hover:text-gray-100'
            )}
          >
            Todas ({requests.length})
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('pending')}
            className={cn(
              "flex-1",
              statusFilter === 'pending' ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600' : 'text-gray-400 hover:text-gray-100'
            )}
          >
            Pendentes ({getStatsCount('pending')})
          </Button>
          <Button
            variant={statusFilter === 'analyzing' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('analyzing')}
            className={cn(
              "flex-1",
              statusFilter === 'analyzing' ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600' : 'text-gray-400 hover:text-gray-100'
            )}
          >
            Em Análise ({getStatsCount('analyzing')})
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('approved')}
            className={cn(
              "flex-1",
              statusFilter === 'approved' ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600' : 'text-gray-400 hover:text-gray-100'
            )}
          >
            Aprovados ({getStatsCount('approved')})
          </Button>
          <Button
            variant={statusFilter === 'rejected' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('rejected')}
            className={cn(
              "flex-1",
              statusFilter === 'rejected' ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600' : 'text-gray-400 hover:text-gray-100'
            )}
          >
            Rejeitados ({getStatsCount('rejected')})
          </Button>
          <Button
            variant={statusFilter === 'disputed' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('disputed')}
            className={cn(
              "flex-1",
              statusFilter === 'disputed' ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600' : 'text-gray-400 hover:text-gray-100'
            )}
          >
            Em Disputa ({getStatsCount('disputed')})
          </Button>
        </div>

        {/* Table */}
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b border-gray-700">
            <div className="col-span-3 text-xs font-semibold text-gray-400 uppercase">Cliente</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase">Status</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase">Valor</div>
            <div className="col-span-4 text-xs font-semibold text-gray-400 uppercase">Disputa</div>
            <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase text-right">Ações</div>
          </div>

          {/* Rows */}
          {filteredRequests.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
              <TrendingDown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No data found.</h3>
              <p className="text-gray-500">Nenhuma solicitação encontrada com os filtros aplicados</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-all"
              >
                {/* Cliente */}
                <div className="col-span-3">
                  <div className="text-gray-100 font-semibold">{request.client_name}</div>
                  <div className="text-xs text-gray-500">{request.client_phone}</div>
                  <div className="text-xs text-blue-400">{request.client_email}</div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  {getStatusBadge(request.status)}
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(request.updated_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>

                {/* Valor */}
                <div className="col-span-2">
                  <div className="text-red-400 font-bold text-lg">
                    R$ {request.value.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-xs text-gray-500">{request.plan_name}</div>
                  <div className="text-xs text-gray-600">{request.transaction_id}</div>
                </div>

                {/* Disputa */}
                <div className="col-span-4">
                  <div className="text-gray-300 text-sm mb-1">
                    <span className="font-semibold">Motivo:</span> {request.reason}
                  </div>
                  <div className="text-xs text-gray-500">
                    Solicitado em: {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                  {request.payment_date && (
                    <div className="text-xs text-gray-500">
                      Pagamento: {format(new Date(request.payment_date), 'dd/MM/yyyy')}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="col-span-1 flex items-center justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:text-gray-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChargebackRequests;
