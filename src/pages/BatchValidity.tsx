"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertTriangle, Calendar, Package } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  stock: number;
}

interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  quantity: number;
  location_id: string | null;
  created_at: string;
  products?: {
    name: string;
  };
  stock_locations?: {
    name: string;
  };
}

interface StockLocation {
  id: string;
  name: string;
}

const BatchValidity = () => {
  const { session, isLoading } = useSession();
  const { t } = useTranslation();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
    quantity: '',
    location_id: ''
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .eq('user_id', session?.user?.id)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('product_batches')
        .select(`
          *,
          products(name),
          stock_locations(name)
        `)
        .eq('user_id', session?.user?.id)
        .order('expiry_date', { ascending: true });

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('stock_locations')
        .select('id, name')
        .eq('user_id', session?.user?.id)
        .order('name');

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.batch_number || !formData.quantity) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('product_batches')
        .insert({
          user_id: session?.user?.id,
          product_id: formData.product_id,
          batch_number: formData.batch_number,
          manufacturing_date: formData.manufacturing_date || null,
          expiry_date: formData.expiry_date || null,
          quantity: parseInt(formData.quantity),
          location_id: formData.location_id || null
        });

      if (error) throw error;

      setFormData({
        product_id: '',
        batch_number: '',
        manufacturing_date: '',
        expiry_date: '',
        quantity: '',
        location_id: ''
      });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Erro ao criar lote');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lote?')) return;

    try {
      const { error } = await supabase
        .from('product_batches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Erro ao excluir lote');
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: 'no_date', color: 'bg-gray-500', label: 'Sem validade' };

    const today = new Date();
    const expiry = parseISO(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'bg-red-500', label: 'Vencido', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'critical', color: 'bg-orange-500', label: 'Crítico', days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', color: 'bg-yellow-500', label: 'Atenção', days: daysUntilExpiry };
    } else {
      return { status: 'ok', color: 'bg-green-500', label: 'OK', days: daysUntilExpiry };
    }
  };

  const criticalBatches = batches.filter(batch => {
    const status = getExpiryStatus(batch.expiry_date);
    return status.status === 'expired' || status.status === 'critical';
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            {t('batch_validity')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestão de lotes com FIFO/PEPS - Produtos que devem sair primeiro
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Lote</DialogTitle>
              <DialogDescription>
                Registre informações do lote para controle FIFO/PEPS
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">Produto *</Label>
                <Select 
                  value={formData.product_id} 
                  onValueChange={(value) => setFormData({...formData, product_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch_number">Número do Lote *</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                  placeholder="Ex: LOTE-2024-001"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturing_date">Data Fabricação</Label>
                  <Input
                    id="manufacturing_date"
                    type="date"
                    value={formData.manufacturing_date}
                    onChange={(e) => setFormData({...formData, manufacturing_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Data Validade</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_id">Local de Armazenamento</Label>
                <Select 
                  value={formData.location_id} 
                  onValueChange={(value) => setFormData({...formData, location_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar Lote</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Critical Alerts */}
      {criticalBatches.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{criticalBatches.length}</strong> lote(s) vencido(s) ou próximo(s) do vencimento
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lotes Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {batches.filter(b => getExpiryStatus(b.expiry_date).status === 'expired').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Atenção (≤30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {batches.filter(b => {
                const status = getExpiryStatus(b.expiry_date);
                return status.status === 'critical' || status.status === 'warning';
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches.reduce((sum, b) => sum + b.quantity, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FIFO Priority Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ordem FIFO/PEPS - Usar Primeiro
          </CardTitle>
          <CardDescription>
            Lotes ordenados por data de validade (produtos que devem sair primeiro)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lote cadastrado. Clique em "Novo Lote" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Nº Lote</TableHead>
                  <TableHead>Fabricação</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch, index) => {
                  const expiryStatus = getExpiryStatus(batch.expiry_date);
                  return (
                    <TableRow key={batch.id} className={expiryStatus.status === 'expired' ? 'bg-red-950/20' : ''}>
                      <TableCell>
                        <Badge variant={index < 5 ? 'destructive' : 'secondary'}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {batch.products?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {batch.batch_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        {batch.manufacturing_date 
                          ? format(parseISO(batch.manufacturing_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {batch.expiry_date 
                          ? format(parseISO(batch.expiry_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={expiryStatus.color}>
                          {expiryStatus.label}
                          {expiryStatus.days !== undefined && ` (${expiryStatus.days}d)`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{batch.quantity}</span> un
                      </TableCell>
                      <TableCell>
                        {batch.stock_locations?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(batch.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona o FIFO/PEPS?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>FIFO (First In, First Out)</strong> ou <strong>PEPS (Primeiro a Entrar, Primeiro a Sair)</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Os lotes são ordenados automaticamente por data de validade</li>
            <li>Produtos com vencimento mais próximo aparecem no topo da lista</li>
            <li>Use sempre os produtos da parte superior da tabela primeiro</li>
            <li>Lotes vencidos são destacados em vermelho</li>
            <li>Lotes com menos de 30 dias para vencer recebem alertas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchValidity;
