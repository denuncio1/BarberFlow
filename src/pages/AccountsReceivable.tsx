"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';

interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'received' | 'overdue' | 'cancelled';
  client_name: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

const AccountsReceivable = () => {
  const { session, isLoading } = useSession();
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountReceivable | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    client_name: '',
    status: 'pending' as 'pending' | 'received' | 'overdue' | 'cancelled',
  });

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session, filterStatus]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('accounts_receivable')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('due_date', { ascending: true });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Atualizar status de vencidos automaticamente
      const today = new Date().toISOString().split('T')[0];
      const updatedData = data?.map(account => {
        if (account.status === 'pending' && account.due_date < today) {
          return { ...account, status: 'overdue' as const };
        }
        return account;
      }) || [];

      setAccounts(updatedData);
    } catch (error: any) {
      showError('Erro ao buscar contas a receber: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.due_date || !formData.client_name) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingAccount) {
        const { error } = await supabase
          .from('accounts_receivable')
          .update({
            description: formData.description,
            amount: parseFloat(formData.amount),
            due_date: formData.due_date,
            client_name: formData.client_name,
            status: formData.status,
            payment_date: formData.status === 'received' ? new Date().toISOString().split('T')[0] : null,
          })
          .eq('id', editingAccount.id);

        if (error) throw error;
        showSuccess('Conta atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('accounts_receivable').insert({
          description: formData.description,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          client_name: formData.client_name,
          status: formData.status,
          user_id: session?.user?.id,
        });

        if (error) throw error;
        showSuccess('Conta criada com sucesso!');
      }

      resetForm();
      fetchAccounts();
    } catch (error: any) {
      showError('Erro ao salvar conta: ' + error.message);
    }
  };

  const handleMarkAsReceived = async (account: AccountReceivable) => {
    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({
          status: 'received',
          payment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', account.id);

      if (error) throw error;
      showSuccess('Conta marcada como recebida!');
      fetchAccounts();
    } catch (error: any) {
      showError('Erro ao marcar conta como recebida: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      const { error } = await supabase.from('accounts_receivable').delete().eq('id', id);

      if (error) throw error;
      showSuccess('Conta excluída com sucesso!');
      fetchAccounts();
    } catch (error: any) {
      showError('Erro ao excluir conta: ' + error.message);
    }
  };

  const handleEdit = (account: AccountReceivable) => {
    setEditingAccount(account);
    setFormData({
      description: account.description,
      amount: account.amount.toString(),
      due_date: account.due_date,
      client_name: account.client_name,
      status: account.status,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      due_date: '',
      client_name: '',
      status: 'pending',
    });
    setEditingAccount(null);
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-600 hover:bg-yellow-700' },
      received: { label: 'Recebido', className: 'bg-green-600 hover:bg-green-700' },
      overdue: { label: 'Vencido', className: 'bg-red-600 hover:bg-red-700' },
      cancelled: { label: 'Cancelado', className: 'bg-gray-600 hover:bg-gray-700' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const filteredAccounts = accounts.filter(account =>
    account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = accounts
    .filter(a => a.status === 'pending' || a.status === 'overdue')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const totalOverdue = accounts
    .filter(a => a.status === 'overdue')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">Contas a Receber</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-100">
                {editingAccount ? 'Editar Conta' : 'Nova Conta a Receber'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-gray-200">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount" className="text-gray-200">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="client_name" className="text-gray-200">Cliente</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="due_date" className="text-gray-200">Data de Vencimento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  required
                />
              </div>
              {editingAccount && (
                <div>
                  <Label htmlFor="status" className="text-gray-200">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="received">Recebido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingAccount ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-400">Total a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>

        {totalOverdue > 0 && (
          <Card className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-orange-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Contas Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{formatCurrency(totalOverdue)}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por descrição ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-gray-800 border-gray-700 text-gray-100"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-100">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="received">Recebido</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-300">Descrição</TableHead>
                <TableHead className="text-gray-300">Cliente</TableHead>
                <TableHead className="text-gray-300">Valor</TableHead>
                <TableHead className="text-gray-300">Vencimento</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} className="border-gray-700 hover:bg-gray-700/50">
                    <TableCell className="text-gray-100">{account.description}</TableCell>
                    <TableCell className="text-gray-100">{account.client_name}</TableCell>
                    <TableCell className="text-gray-100 font-medium">{formatCurrency(account.amount)}</TableCell>
                    <TableCell className="text-gray-100">{formatDate(account.due_date)}</TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(account.status === 'pending' || account.status === 'overdue') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsReceived(account)}
                            className="bg-green-600 hover:bg-green-700 text-white border-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(account)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(account.id)}
                          className="border-red-600 text-red-400 hover:bg-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsReceivable;
