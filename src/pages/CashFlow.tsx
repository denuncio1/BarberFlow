"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showError } from '@/utils/toast';

interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

interface MonthlyData {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const CashFlow = () => {
  const { session, isLoading } = useSession();
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // dias
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netBalance, setNetBalance] = useState(0);

  useEffect(() => {
    if (session) {
      fetchCashFlow();
    }
  }, [session, period]);

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - parseInt(period));

      // Buscar contas recebidas
      const { data: receivedData } = await supabase
        .from('accounts_receivable')
        .select('amount, payment_date')
        .eq('user_id', session?.user?.id)
        .eq('status', 'received')
        .gte('payment_date', startDate.toISOString().split('T')[0])
        .order('payment_date', { ascending: true });

      // Buscar contas pagas
      const { data: paidData } = await supabase
        .from('accounts_payable')
        .select('amount, payment_date')
        .eq('user_id', session?.user?.id)
        .eq('status', 'paid')
        .gte('payment_date', startDate.toISOString().split('T')[0])
        .order('payment_date', { ascending: true });

      // Processar dados por dia
      const dailyMap = new Map<string, { income: number; expense: number }>();

      receivedData?.forEach(item => {
        const date = item.payment_date || '';
        const current = dailyMap.get(date) || { income: 0, expense: 0 };
        dailyMap.set(date, { ...current, income: current.income + Number(item.amount) });
      });

      paidData?.forEach(item => {
        const date = item.payment_date || '';
        const current = dailyMap.get(date) || { income: 0, expense: 0 };
        dailyMap.set(date, { ...current, expense: current.expense + Number(item.amount) });
      });

      // Converter para array e calcular saldo acumulado
      let accumulatedBalance = 0;
      const flowData: CashFlowData[] = Array.from(dailyMap.entries())
        .map(([date, data]) => {
          accumulatedBalance += data.income - data.expense;
          return {
            date,
            income: data.income,
            expense: data.expense,
            balance: accumulatedBalance,
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setCashFlowData(flowData);

      // Calcular totais
      const income = receivedData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const expense = paidData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      setTotalIncome(income);
      setTotalExpense(expense);
      setNetBalance(income - expense);

      // Processar dados mensais
      const monthlyMap = new Map<string, { income: number; expense: number }>();

      receivedData?.forEach(item => {
        if (item.payment_date) {
          const monthKey = item.payment_date.substring(0, 7); // YYYY-MM
          const current = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
          monthlyMap.set(monthKey, { ...current, income: current.income + Number(item.amount) });
        }
      });

      paidData?.forEach(item => {
        if (item.payment_date) {
          const monthKey = item.payment_date.substring(0, 7);
          const current = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
          monthlyMap.set(monthKey, { ...current, expense: current.expense + Number(item.amount) });
        }
      });

      const monthly: MonthlyData[] = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          totalIncome: data.income,
          totalExpense: data.expense,
          balance: data.income - data.expense,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setMonthlyData(monthly);
    } catch (error: any) {
      showError('Erro ao buscar fluxo de caixa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">Fluxo de Caixa</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Carregando dados...</div>
      ) : (
        <>
          {/* Resumo do Período */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-400">
                  Total de Entradas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
                <p className="text-xs text-green-400/70 mt-1">Recebimentos confirmados</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-400">
                  Total de Saídas
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
                <p className="text-xs text-red-400/70 mt-1">Pagamentos realizados</p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${netBalance >= 0 ? 'from-blue-900/40 to-blue-800/20 border-blue-700' : 'from-orange-900/40 to-orange-800/20 border-orange-700'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${netBalance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                  Saldo do Período
                </CardTitle>
                <Calendar className={`h-4 w-4 ${netBalance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${netBalance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                  {formatCurrency(netBalance)}
                </div>
                <p className={`text-xs ${netBalance >= 0 ? 'text-blue-400/70' : 'text-orange-400/70'} mt-1`}>
                  {netBalance >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fluxo Diário */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Movimentação Diária</CardTitle>
            </CardHeader>
            <CardContent>
              {cashFlowData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhuma movimentação no período selecionado</p>
              ) : (
                <div className="space-y-3">
                  {cashFlowData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-gray-300 font-medium min-w-[80px]">
                          {formatDate(item.date)}
                        </div>
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 font-medium">{formatCurrency(item.income)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-400" />
                            <span className="text-red-400 font-medium">{formatCurrency(item.expense)}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${item.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                        {formatCurrency(item.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo Mensal */}
          {monthlyData.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Resumo Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-100 capitalize">
                          {formatMonth(item.month)}
                        </h3>
                        <div className={`text-xl font-bold ${item.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(item.balance)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <div>
                            <p className="text-xs text-gray-400">Entradas</p>
                            <p className="text-green-400 font-semibold">{formatCurrency(item.totalIncome)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-400" />
                          <div>
                            <p className="text-xs text-gray-400">Saídas</p>
                            <p className="text-red-400 font-semibold">{formatCurrency(item.totalExpense)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CashFlow;
