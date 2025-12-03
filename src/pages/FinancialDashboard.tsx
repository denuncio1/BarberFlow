"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError } from '@/utils/toast';

interface FinancialSummary {
  totalReceivable: number;
  totalPayable: number;
  balance: number;
  overdueReceivable: number;
  overduePayable: number;
  receivedThisMonth: number;
  paidThisMonth: number;
}

const FinancialDashboard = () => {
  const { session, isLoading } = useSession();
  const [summary, setSummary] = useState<FinancialSummary>({
    totalReceivable: 0,
    totalPayable: 0,
    balance: 0,
    overdueReceivable: 0,
    overduePayable: 0,
    receivedThisMonth: 0,
    paidThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchFinancialSummary();
    }
  }, [session]);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Buscar contas a receber
      const { data: receivableData } = await supabase
        .from('accounts_receivable')
        .select('amount, status, due_date, payment_date')
        .eq('user_id', session?.user?.id);

      // Buscar contas a pagar
      const { data: payableData } = await supabase
        .from('accounts_payable')
        .select('amount, status, due_date, payment_date')
        .eq('user_id', session?.user?.id);

      const totalReceivable = receivableData
        ?.filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      const totalPayable = payableData
        ?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const overdueReceivable = receivableData
        ?.filter(r => r.status === 'pending' && r.due_date < today)
        .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      const overduePayable = payableData
        ?.filter(p => p.status === 'pending' && p.due_date < today)
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const receivedThisMonth = receivableData
        ?.filter(r => r.status === 'received' && r.payment_date && r.payment_date >= firstDayOfMonth)
        .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      const paidThisMonth = payableData
        ?.filter(p => p.status === 'paid' && p.payment_date && p.payment_date >= firstDayOfMonth)
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setSummary({
        totalReceivable,
        totalPayable,
        balance: totalReceivable - totalPayable,
        overdueReceivable,
        overduePayable,
        receivedThisMonth,
        paidThisMonth,
      });
    } catch (error: any) {
      showError('Erro ao buscar dados financeiros: ' + error.message);
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">Dashboard Financeiro</h1>
        <Calendar className="h-6 w-6 text-gray-400" />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Carregando dados...</div>
      ) : (
        <>
          {/* Resumo Principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-400">
                  Total a Receber
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{formatCurrency(summary.totalReceivable)}</div>
                <p className="text-xs text-green-400/70 mt-1">Pendente de recebimento</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-400">
                  Total a Pagar
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{formatCurrency(summary.totalPayable)}</div>
                <p className="text-xs text-red-400/70 mt-1">Pendente de pagamento</p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${summary.balance >= 0 ? 'from-blue-900/40 to-blue-800/20 border-blue-700' : 'from-orange-900/40 to-orange-800/20 border-orange-700'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                  Saldo Previsto
                </CardTitle>
                <DollarSign className={`h-4 w-4 ${summary.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                  {formatCurrency(summary.balance)}
                </div>
                <p className={`text-xs ${summary.balance >= 0 ? 'text-blue-400/70' : 'text-orange-400/70'} mt-1`}>
                  {summary.balance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas de Vencimento */}
          {(summary.overdueReceivable > 0 || summary.overduePayable > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {summary.overdueReceivable > 0 && (
                <Card className="bg-yellow-900/20 border-yellow-600">
                  <CardHeader>
                    <CardTitle className="text-yellow-500 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Contas a Receber Vencidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-500">{formatCurrency(summary.overdueReceivable)}</div>
                    <p className="text-sm text-gray-400 mt-2">Títulos vencidos aguardando recebimento</p>
                  </CardContent>
                </Card>
              )}

              {summary.overduePayable > 0 && (
                <Card className="bg-red-900/20 border-red-600">
                  <CardHeader>
                    <CardTitle className="text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Contas a Pagar Vencidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.overduePayable)}</div>
                    <p className="text-sm text-gray-400 mt-2">Títulos vencidos aguardando pagamento</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Movimentação do Mês */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Recebido neste Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{formatCurrency(summary.receivedThisMonth)}</div>
                <p className="text-sm text-gray-400 mt-2">Total de recebimentos confirmados</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-100">Pago neste Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{formatCurrency(summary.paidThisMonth)}</div>
                <p className="text-sm text-gray-400 mt-2">Total de pagamentos realizados</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Geral */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Resumo do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Resultado do Mês</p>
                  <p className={`text-2xl font-bold ${(summary.receivedThisMonth - summary.paidThisMonth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(summary.receivedThisMonth - summary.paidThisMonth)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total de Entradas</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(summary.receivedThisMonth)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total de Saídas</p>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.paidThisMonth)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FinancialDashboard;
