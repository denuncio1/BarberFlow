"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';

interface StockMovementFormProps {
  editingMovement: any;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const StockMovementForm: React.FC<StockMovementFormProps> = ({
  editingMovement,
  onClose,
  onSaveSuccess,
}) => {
  const { session } = useSession();
  const { register, handleSubmit, setValue, watch } = useForm();
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const movementType = watch('movement_type');
  const productId = watch('product_id');
  const locationId = watch('location_id');
  const clientId = watch('client_id');

  useEffect(() => {
    fetchProducts();
    fetchLocations();
    fetchClients();
  }, []);

  useEffect(() => {
    if (editingMovement) {
      setValue('product_id', editingMovement.product_id);
      setValue('movement_type', editingMovement.movement_type);
      setValue('quantity', editingMovement.quantity);
      setValue('reason', editingMovement.reason);
      setValue('location_id', editingMovement.location_id);
    }
  }, [editingMovement, setValue]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', session?.user?.id)
      .order('name');
    setProducts(data || []);
  };

  const fetchLocations = async () => {
    const { data } = await supabase
      .from('stock_locations')
      .select('id, name')
      .eq('user_id', session?.user?.id)
      .order('name');
    setLocations(data || []);
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone')
      .eq('user_id', session?.user?.id)
      .order('first_name');
    setClients(data || []);
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      const movementData = {
        user_id: session?.user?.id,
        product_id: data.product_id,
        movement_type: data.movement_type,
        quantity: parseInt(data.quantity),
        reason: data.reason,
        location_id: data.location_id,
      };

      if (editingMovement) {
        // Não permite editar movimentações, apenas visualizar
        showError('Movimentações não podem ser editadas após serem registradas.');
        return;
      } else {
        // Inserir movimentação de estoque
        const { data: insertedMovement, error } = await supabase
          .from('stock_movements')
          .insert([movementData])
          .select()
          .single();
        
        if (error) throw error;
        
        // Atualizar o estoque do produto
        await updateProductStock(data.product_id, data.movement_type, parseInt(data.quantity));
        
        // Buscar informações do produto para criar título financeiro
        const { data: product } = await supabase
          .from('products')
          .select('name, cost_price')
          .eq('id', data.product_id)
          .single();
        
        // Buscar nome do cliente se foi selecionado
        let clientName = data.client_name;
        if (data.client_id && data.movement_type === 'exit') {
          const { data: client } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('id', data.client_id)
            .single();
          if (client) {
            clientName = `${client.first_name} ${client.last_name}`;
          }
        }
        
        // Criar título financeiro
        await createFinancialEntry(
          insertedMovement.id,
          data.movement_type,
          product?.name || 'Produto',
          parseInt(data.quantity),
          product?.cost_price || 0,
          data.reason,
          data.supplier_name || clientName,
          data.due_date,
          data.client_id
        );
        
        showSuccess('Movimentação e título financeiro registrados com sucesso!');
      }

      onSaveSuccess();
    } catch (error: any) {
      showError('Erro ao registrar movimentação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createFinancialEntry = async (
    movementId: string,
    movementType: string,
    productName: string,
    quantity: number,
    unitPrice: number,
    reason: string,
    personName?: string,
    dueDate?: string,
    clientId?: string
  ) => {
    const totalAmount = quantity * unitPrice;
    const today = new Date().toISOString().split('T')[0];
    const finalDueDate = dueDate || today;

    if (movementType === 'entry') {
      // Entrada de estoque = Conta a Pagar
      await supabase.from('accounts_payable').insert([{
        user_id: session?.user?.id,
        description: `Compra de estoque: ${productName} (${quantity} un)`,
        amount: totalAmount,
        due_date: finalDueDate,
        status: 'pending',
        category: 'Estoque',
        supplier_name: personName || 'Fornecedor',
        reference_type: 'stock_entry',
        reference_id: movementId,
        notes: reason,
      }]);
    } else if (movementType === 'exit') {
      // Saída de estoque = Conta a Receber
      await supabase.from('accounts_receivable').insert([{
        user_id: session?.user?.id,
        description: `Venda de produto: ${productName} (${quantity} un)`,
        amount: totalAmount,
        due_date: finalDueDate,
        status: 'pending',
        category: 'Vendas',
        client_id: clientId || null,
        client_name: personName || 'Cliente',
        reference_type: 'stock_exit',
        reference_id: movementId,
        notes: reason,
      }]);
    }
  };

  const updateProductStock = async (productId: string, movementType: string, quantity: number) => {
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();

    if (product) {
      const newQuantity = movementType === 'entry'
        ? product.stock_quantity + quantity
        : product.stock_quantity - quantity;

      await supabase
        .from('products')
        .update({ stock_quantity: Math.max(0, newQuantity) })
        .eq('id', productId);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-gray-100">Produto *</Label>
        <Select
          value={productId}
          onValueChange={(value) => setValue('product_id', value)}
          disabled={!!editingMovement}
        >
          <SelectTrigger id="product_id" className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id} className="text-gray-100">
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-100">Tipo de Movimentação *</Label>
        <Select
          value={movementType}
          onValueChange={(value) => setValue('movement_type', value)}
          disabled={!!editingMovement}
        >
          <SelectTrigger id="movement_type" className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="entry" className="text-gray-100">Entrada</SelectItem>
            <SelectItem value="exit" className="text-gray-100">Saída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="quantity" className="text-gray-100">Quantidade *</Label>
        <Input
          id="quantity"
          {...register('quantity', { required: true, min: 1 })}
          type="number"
          min="1"
          placeholder="Digite a quantidade"
          className="bg-gray-700 border-gray-600 text-gray-100"
          disabled={!!editingMovement}
        />
      </div>

      <div>
        <Label className="text-gray-100">Local *</Label>
        <Select
          value={locationId}
          onValueChange={(value) => setValue('location_id', value)}
          disabled={!!editingMovement}
        >
          <SelectTrigger id="location_id" className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="Selecione o local" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id} className="text-gray-100">
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-gray-100">Motivo *</Label>
        <Select
          value={watch('reason')}
          onValueChange={(value) => setValue('reason', value)}
          disabled={!!editingMovement}
        >
          <SelectTrigger id="reason" className="bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="Selecione o motivo" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {movementType === 'entry' ? (
              <>
                <SelectItem value="compra" className="text-gray-100">Compra</SelectItem>
                <SelectItem value="devolucao" className="text-gray-100">Devolução de Cliente</SelectItem>
                <SelectItem value="ajuste_positivo" className="text-gray-100">Ajuste Positivo</SelectItem>
                <SelectItem value="transferencia_entrada" className="text-gray-100">Transferência (Entrada)</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="venda" className="text-gray-100">Venda</SelectItem>
                <SelectItem value="uso_interno" className="text-gray-100">Uso Interno</SelectItem>
                <SelectItem value="perda" className="text-gray-100">Perda/Quebra</SelectItem>
                <SelectItem value="ajuste_negativo" className="text-gray-100">Ajuste Negativo</SelectItem>
                <SelectItem value="transferencia_saida" className="text-gray-100">Transferência (Saída)</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {!editingMovement && movementType === 'entry' && (
        <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg space-y-3">
          <p className="text-blue-400 font-semibold flex items-center gap-2">
            💰 Título Financeiro (Conta a Pagar)
          </p>
          <div>
            <Label htmlFor="supplier_name" className="text-gray-100">Nome do Fornecedor</Label>
            <Input
              id="supplier_name"
              {...register('supplier_name')}
              type="text"
              placeholder="Digite o nome do fornecedor"
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="due_date_payable" className="text-gray-100">Data de Vencimento</Label>
            <Input
              id="due_date_payable"
              {...register('due_date')}
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>
        </div>
      )}

      {!editingMovement && movementType === 'exit' && (
        <div className="bg-green-900/20 border border-green-600 p-4 rounded-lg space-y-3">
          <p className="text-green-400 font-semibold flex items-center gap-2">
            💵 Título Financeiro (Conta a Receber)
          </p>
          <div>
            <Label className="text-gray-100">Cliente</Label>
            <Select
              value={clientId}
              onValueChange={(value) => {
                setValue('client_id', value);
                setValue('client_name', ''); // Limpa o nome manual se selecionar um cliente
              }}
            >
              <SelectTrigger id="client_id" className="bg-gray-700 border-gray-600 text-gray-100">
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id} className="text-gray-100">
                    {client.first_name} {client.last_name} {client.phone && `- ${client.phone}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!clientId && (
            <div>
              <Label htmlFor="client_name" className="text-gray-100">Ou digite o nome do cliente</Label>
              <Input
                id="client_name"
                {...register('client_name')}
                type="text"
                placeholder="Digite o nome do cliente"
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
          )}
          <div>
            <Label htmlFor="due_date_receivable" className="text-gray-100">Data de Vencimento</Label>
            <Input
              id="due_date_receivable"
              {...register('due_date')}
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>
        </div>
      )}

      {!editingMovement && (
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-100">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Salvando...' : 'Registrar Movimentação'}
          </Button>
        </div>
      )}
    </form>
  );
};

export default StockMovementForm;
