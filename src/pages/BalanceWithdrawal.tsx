"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowUpCircle, Calendar, TrendingUp, TrendingDown, DollarSign, Filter, Search, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  date: string;
  value: number;
  balance: number;
  description: string;
  type: 'credit' | 'debit' | 'withdrawal';
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

const BalanceWithdrawal: React.FC = () => {
  const { user } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Mock data para demonstração
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      date: '2025-11-24',
      value: -2171.74,
      balance: 0.00,
      description: 'Transação via Pix com chave para PRADO E LIMA BARBEARIA LTDA',
      type: 'withdrawal',
      status: 'completed',
      reference: 'PIX-2025-001'
    },
    {
      id: '2',
      date: '2025-11-24',
      value: 95.92,
      balance: 2171.74,
      description: 'Recebimento de pagamento',
      type: 'credit',
      status: 'completed',
      reference: 'PAY-2025-123'
    },
    {
      id: '3',
      date: '2025-11-24',
      value: 95.92,
      balance: 2075.82,
      description: 'Recebimento de pagamento',
      type: 'credit',
      status: 'completed',
      reference: 'PAY-2025-124'
    },
    {
      id: '4',
      date: '2025-11-24',
      value: 28.47,
      balance: 1979.90,
      description: 'Recebimento de pagamento',
      type: 'credit',
      status: 'completed',
      reference: 'PAY-2025-125'
    },
    {
      id: '5',
      date: '2025-11-24',
      value: 153.82,
      balance: 1951.43,
      description: 'Recebimento de pagamento',
      type: 'credit',
      status: 'completed',
      reference: 'PAY-2025-126'
    },
    {
      id: '6',
      date: '2025-11-24',
      value: 163.47,
      balance: 1797.61,
      description: 'Recebimento de pagamento',
      type: 'credit',
      status: 'completed',
      reference: 'PAY-2025-127'
    },
    {
      id: '7',
      date: '2025-11-24',
      value: 163.47,
      balance: 1634.14,
      description: 'Recebimento de pagamento',
      type: 'credit',
      status: 'completed',
      reference: 'PAY-2025-128'
    }
  ];

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter, statusFilter, dateFrom, dateTo]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Usando dados mock por enquanto
      setTransactions(mockTransactions);
      setBalance(0.00);
      setTotalTransactions(240);
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error);
      showError('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por data
    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= dateTo);
    }

    setFilteredTransactions(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <TrendingUp className="w-4 h-4" />;
      case 'debit':
        return <TrendingDown className="w-4 h-4" />;
      case 'withdrawal':
        return <ArrowUpCircle className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const types = {
      credit: { label: 'Crédito', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      debit: { label: 'Débito', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      withdrawal: { label: 'Saque', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    };
    const config = types[type as keyof typeof types] || types.credit;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statuses = {
      completed: { label: 'Concluído', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      pending: { label: 'Pendente', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      failed: { label: 'Falhou', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
    };
    const config = statuses[status as keyof typeof statuses] || statuses.pending;
    return (
      <Badge variant="outline" className={cn("text-xs", config.className)}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-gray-400">Carregando transações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Saldo e saque</h1>
            <p className="text-gray-400 mt-1">Gerencie seu saldo e histórico de transações</p>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar em excel
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Withdraw per PIX
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 border border-green-500/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-bold text-white mb-2">
                R$ {balance.toFixed(2).replace('.', ',')}
              </h2>
              <p className="text-green-100 text-lg">Balance available for withdrawal</p>
            </div>
            <div className="bg-white/10 p-4 rounded-full">
              <DollarSign className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total de Créditos</span>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">R$ 3.000,00</div>
            <div className="text-xs text-gray-500 mt-1">Últimos 30 dias</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total de Saques</span>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">R$ 2.171,74</div>
            <div className="text-xs text-gray-500 mt-1">Últimos 30 dias</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total de Transações</span>
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">{totalTransactions}</div>
            <div className="text-xs text-gray-500 mt-1">Todas as transações</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-gray-100 mb-1">Filtros de Transações</h2>
            <p className="text-sm text-gray-400">Filtre por tipo, status, data ou descrição</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="credit">Créditos</SelectItem>
                    <SelectItem value="debit">Débitos</SelectItem>
                    <SelectItem value="withdrawal">Saques</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600",
                        !dateFrom && "text-gray-400"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP", { locale: ptBR }) : "Data inicial"}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600",
                        !dateTo && "text-gray-400"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP", { locale: ptBR }) : "Data final"}
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

              <div className="col-span-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Pesquisar por descrição ou referência"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="col-span-1 flex items-center justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                  onClick={() => {
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setDateFrom(undefined);
                    setDateTo(undefined);
                    setSearchTerm('');
                  }}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Total de registros: {filteredTransactions.length}
          </h2>
        </div>

        {/* Transactions Table */}
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b border-gray-700">
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase">Data da transação</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase">Valor</div>
            <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase">Saldo do dia</div>
            <div className="col-span-4 text-xs font-semibold text-gray-400 uppercase">Descrição</div>
            <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase text-center">Tipo</div>
            <div className="col-span-1 text-xs font-semibold text-gray-400 uppercase text-right">Ações</div>
          </div>

          {/* Transactions */}
          {filteredTransactions.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
              <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhuma transação encontrada</h3>
              <p className="text-gray-500">Ajuste os filtros para ver mais resultados</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-all"
              >
                {/* Data */}
                <div className="col-span-2">
                  <div className="text-gray-100 font-medium">
                    {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(transaction.date), 'HH:mm')}
                  </div>
                </div>

                {/* Valor */}
                <div className="col-span-2">
                  <div className={cn(
                    "text-lg font-bold flex items-center gap-2",
                    transaction.value < 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {getTypeIcon(transaction.type)}
                    R$ {Math.abs(transaction.value).toFixed(2).replace('.', ',')}
                  </div>
                  {transaction.reference && (
                    <div className="text-xs text-gray-500">{transaction.reference}</div>
                  )}
                </div>

                {/* Saldo */}
                <div className="col-span-2">
                  <div className="text-blue-400 font-bold">
                    R$ {transaction.balance.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-xs text-gray-500">Saldo após transação</div>
                </div>

                {/* Descrição */}
                <div className="col-span-4">
                  <div className="text-gray-300 text-sm">
                    {transaction.description}
                  </div>
                  <div className="mt-1">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>

                {/* Tipo */}
                <div className="col-span-1 flex justify-center">
                  {getTypeBadge(transaction.type)}
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

export default BalanceWithdrawal;
