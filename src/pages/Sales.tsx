"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Package, ArrowLeft, DollarSign } from 'lucide-react';

const formSchema = z.object({
  sale_type: z.enum(['product', 'package'], { required_error: "Selecione o tipo de venda" }),
  client_id: z.string().min(1, { message: "Selecione um cliente" }),
  item_id: z.string().min(1, { message: "Selecione um item" }),
  quantity: z.coerce.number().int().min(1, { message: "Quantidade deve ser no mínimo 1" }),
  unit_price: z.coerce.number().min(0, { message: "Preço deve ser positivo" }),
  payment_method_id: z.string().min(1, { message: "Selecione a forma de pagamento" }),
});

const Sales = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saleType, setSaleType] = useState<'product' | 'package'>('product');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sale_type: 'product',
      client_id: '',
      item_id: '',
      quantity: 1,
      unit_price: 0,
      payment_method_id: '',
    },
  });

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    setLoadingData(true);
    await Promise.all([
      fetchClients(),
      fetchProducts(),
      fetchPackages(),
      fetchPaymentMethods()
    ]);
    setLoadingData(false);
  };

  const fetchClients = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .order('first_name');

      if (error) throw error;

      const clientsWithFullName = (data || []).map(client => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`.trim()
      }));

      setClients(clientsWithFullName);
      console.log('Clientes carregados:', clientsWithFullName.length);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      showError('Erro ao carregar clientes');
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity')
        .eq('user_id', user.id)
        .gt('stock_quantity', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      console.log('Produtos carregados:', data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      showError('Erro ao carregar produtos');
    }
  };

  const fetchPackages = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('id, name, value')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setPackages(data || []);
      console.log('Pacotes carregados:', data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error);
      showError('Erro ao carregar pacotes');
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setPaymentMethods(data || []);
      console.log('Formas de pagamento carregadas:', data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      showError('Erro ao carregar formas de pagamento');
    }
  };

  const handleSaleTypeChange = (type: 'product' | 'package') => {
    setSaleType(type);
    form.setValue('sale_type', type);
    form.setValue('item_id', '');
    form.setValue('unit_price', 0);
  };

  const handleItemChange = (itemId: string) => {
    if (saleType === 'product') {
      const product = products.find(p => p.id === itemId);
      if (product) {
        form.setValue('unit_price', product.price);
      }
    } else {
      const pkg = packages.find(p => p.id === itemId);
      if (pkg) {
        form.setValue('unit_price', pkg.value);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);

      const totalAmount = values.unit_price * values.quantity;

      // 1. Buscar dados para descrição
      const { data: clientData } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('id', values.client_id)
        .single();

      const clientName = clientData 
        ? `${clientData.first_name} ${clientData.last_name}`.trim()
        : 'Cliente';

      let itemName = '';
      let description = '';

      if (values.sale_type === 'product') {
        // VENDA DE PRODUTO
        const product = products.find(p => p.id === values.item_id);
        itemName = product?.name || 'Produto';
        description = `Venda de Produto: ${itemName} - ${clientName} (${values.quantity}x)`;

        // Atualizar estoque
        const newStock = (product?.stock_quantity || 0) - values.quantity;
        if (newStock < 0) {
          showError('Estoque insuficiente!');
          return;
        }

        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', values.item_id);

        if (stockError) throw stockError;

        // Registrar movimento de estoque
        await supabase
          .from('stock_movements')
          .insert({
            user_id: user.id,
            product_id: values.item_id,
            movement_type: 'sale',
            quantity: values.quantity,
            unit_price: values.unit_price,
            total_value: totalAmount,
            description: `Venda para ${clientName}`,
          });

      } else {
        // VENDA DE PACOTE
        const pkg = packages.find(p => p.id === values.item_id);
        itemName = pkg?.name || 'Pacote';
        description = `Venda de Pacote: ${itemName} - ${clientName} (${values.quantity}x)`;

        // Criar registro de venda de pacote
        await supabase
          .from('service_package_sales')
          .insert({
            user_id: user.id,
            client_id: values.client_id,
            service_package_id: values.item_id,
            price: totalAmount,
            purchased_quantity: values.quantity,
            remaining_quantity: values.quantity,
          });
      }

      // 2. BUSCAR NOME DA FORMA DE PAGAMENTO
      const { data: paymentMethodData } = await supabase
        .from('payment_methods')
        .select('name')
        .eq('id', values.payment_method_id)
        .single();

      const paymentMethodName = paymentMethodData?.name || 'Pagamento';

      // 3. CRIAR CONTA A RECEBER (alimenta o fluxo de caixa)
      const { error: receivableError } = await supabase
        .from('accounts_receivable')
        .insert({
          user_id: user.id,
          description: `${description} - ${paymentMethodName}`,
          amount: totalAmount,
          due_date: new Date().toISOString().split('T')[0],
          payment_date: new Date().toISOString().split('T')[0],
          status: 'received', // Marcado como recebido
          category: values.sale_type === 'product' ? 'Venda de Produto' : 'Venda de Pacote',
          client_id: values.client_id,
        });

      if (receivableError) throw receivableError;

      showSuccess('Venda realizada com sucesso!');
      form.reset();
      
      // Recarregar dados
      if (values.sale_type === 'product') {
        fetchProducts();
      }

    } catch (error: any) {
      console.error('Erro ao realizar venda:', error);
      showError('Erro ao realizar venda: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = form.watch('unit_price') * form.watch('quantity');

  if (isSessionLoading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Usuário não autenticado</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/appointments')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Venda</h1>
          <p className="text-muted-foreground">Produtos ou Pacotes de Serviços</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Informações da Venda
          </CardTitle>
          <CardDescription>
            Preencha os dados para registrar a venda
          </CardDescription>
          {/* Debug info - remover após testes */}
          <div className="text-xs text-muted-foreground mt-2">
            Debug: Clientes: {clients.length} | Produtos: {products.length} | Pacotes: {packages.length} | Formas Pgto: {paymentMethods.length}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Tipo de Venda */}
              <FormField
                control={form.control}
                name="sale_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Venda</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => handleSaleTypeChange(value as 'product' | 'package')}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent flex-1">
                          <RadioGroupItem value="product" id="product" />
                          <Label htmlFor="product" className="flex items-center gap-2 cursor-pointer flex-1">
                            <ShoppingBag className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="font-semibold">Produto</div>
                              <div className="text-xs text-muted-foreground">Venda avulsa de produto</div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent flex-1">
                          <RadioGroupItem value="package" id="package" />
                          <Label htmlFor="package" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Package className="h-5 w-5 text-purple-500" />
                            <div>
                              <div className="font-semibold">Pacote</div>
                              <div className="text-xs text-muted-foreground">Pacote de serviços</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cliente */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-[300px]">
                        {clients.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">Nenhum cliente cadastrado</div>
                        ) : (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Item (Produto ou Pacote) */}
              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {saleType === 'product' ? 'Produto' : 'Pacote'} *
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleItemChange(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecione o ${saleType === 'product' ? 'produto' : 'pacote'}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-[300px]">
                        {(saleType === 'product' ? products : packages).length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            {saleType === 'product' ? 'Nenhum produto com estoque disponível' : 'Nenhum pacote cadastrado'}
                          </div>
                        ) : (
                          (saleType === 'product' ? products : packages).map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - R$ {(saleType === 'product' ? item.price : item.value).toFixed(2)}
                              {saleType === 'product' && ` (Estoque: ${item.stock_quantity})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Quantidade */}
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preço Unitário */}
                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Unitário (R$) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Forma de Pagamento */}
              <FormField
                control={form.control}
                name="payment_method_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-[300px]">
                        {paymentMethods.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">Nenhuma forma de pagamento cadastrada</div>
                        ) : (
                          paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/appointments')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Processando...' : 'Concluir Venda'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
