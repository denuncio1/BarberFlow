"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  client_id: z.string().min(1, { message: "Selecione um cliente." }),
  service_package_id: z.string().min(1, { message: "Selecione um pacote." }),
  price: z.coerce.number().min(0, { message: "O preço deve ser positivo." }),
  purchased_quantity: z.coerce.number().int().min(1, { message: "A quantidade deve ser no mínimo 1." }),
  remaining_quantity: z.coerce.number().int().min(0, { message: "A quantidade restante não pode ser negativa." }),
});

interface ServicePackageSaleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingSale?: {
    id: string;
    client_id: string;
    service_package_id: string;
    price: number;
    purchased_quantity: number;
    remaining_quantity: number;
  } | null;
}

interface Client {
  id: string;
  name: string;
}

interface ServicePackage {
  id: string;
  name: string;
  value: number;
}

const ServicePackageSaleForm: React.FC<ServicePackageSaleFormProps> = ({ onSuccess, onCancel, editingSale }) => {
  const { user } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: editingSale?.client_id || "",
      service_package_id: editingSale?.service_package_id || "",
      price: editingSale?.price || 0,
      purchased_quantity: editingSale?.purchased_quantity || 1,
      remaining_quantity: editingSale?.remaining_quantity || 1,
    },
  });

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchPackages();
    }
  }, [user]);

  useEffect(() => {
    if (editingSale) {
      form.reset({
        client_id: editingSale.client_id,
        service_package_id: editingSale.service_package_id,
        price: editingSale.price,
        purchased_quantity: editingSale.purchased_quantity,
        remaining_quantity: editingSale.remaining_quantity,
      });
    }
  }, [editingSale, form]);

  const fetchClients = async () => {
    if (!user) return;

    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .order('first_name');

      if (error) throw error;
      
      // Mapear para incluir nome completo
      const clientsWithFullName = (data || []).map(client => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`.trim()
      }));
      
      setClients(clientsWithFullName);
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      showError('Erro ao carregar clientes');
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchPackages = async () => {
    if (!user) return;

    try {
      setLoadingPackages(true);
      const { data, error } = await supabase
        .from('service_packages')
        .select('id, name, value')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pacotes:', error);
      showError('Erro ao carregar pacotes');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePackageChange = (packageId: string) => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      form.setValue('price', selectedPackage.value);
    }
  };

  const handlePurchasedQuantityChange = (quantity: number) => {
    // When purchased quantity changes, update remaining quantity to match
    form.setValue('remaining_quantity', quantity);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError('Usuário não autenticado');
      return;
    }

    try {
      const saleData = {
        user_id: user.id,
        client_id: values.client_id,
        service_package_id: values.service_package_id,
        price: values.price,
        purchased_quantity: values.purchased_quantity,
        remaining_quantity: values.remaining_quantity,
      };

      let error;
      let saleResult;

      if (editingSale) {
        const result = await supabase
          .from('service_package_sales')
          .update(saleData)
          .eq('id', editingSale.id)
          .select();
        error = result.error;
        saleResult = result.data?.[0];
      } else {
        const result = await supabase
          .from('service_package_sales')
          .insert(saleData)
          .select();
        error = result.error;
        saleResult = result.data?.[0];

        // 💰 CRIAR REGISTRO NO FINANCEIRO (apenas para nova venda)
        if (!error && saleResult) {
          // Buscar nome do cliente
          const { data: clientData } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('id', values.client_id)
            .single();

          const clientName = clientData 
            ? `${clientData.first_name} ${clientData.last_name}`.trim()
            : 'Cliente';

          // Buscar nome do pacote
          const { data: packageData } = await supabase
            .from('service_packages')
            .select('name')
            .eq('id', values.service_package_id)
            .single();

          const packageName = packageData?.name || 'Pacote de Serviços';

          // Criar conta a receber
          const { error: financeError } = await supabase
            .from('accounts_receivable')
            .insert({
              user_id: user.id,
              description: `Venda de Pacote: ${packageName} - ${clientName} (${values.purchased_quantity}x)`,
              amount: values.price,
              due_date: new Date().toISOString().split('T')[0], // Data de hoje
              status: 'pending',
              category: 'Venda de Pacote',
              payment_method: null,
            });

          if (financeError) {
            console.error('Erro ao criar registro financeiro:', financeError);
            showError('Venda criada, mas erro ao registrar no financeiro');
          }
        }
      }

      if (error) throw error;

      showSuccess(editingSale ? 'Venda atualizada com sucesso!' : 'Venda cadastrada com sucesso!');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar venda:", error);
      showError('Erro ao salvar venda: ' + error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente */}
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Cliente</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={loadingClients}
              >
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione um cliente"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id} className="text-gray-100">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pacote de Serviço */}
        <FormField
          control={form.control}
          name="service_package_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Pacote de Serviço</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  handlePackageChange(value);
                }} 
                value={field.value}
                disabled={loadingPackages}
              >
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder={loadingPackages ? "Carregando..." : "Selecione um pacote"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {packages.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id} className="text-gray-100">
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preço */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Preço (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  {...field}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantidade Contratada */}
        <FormField
          control={form.control}
          name="purchased_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Quantidade Contratada</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handlePurchasedQuantityChange(parseInt(e.target.value) || 1);
                  }}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantidade Restante */}
        <FormField
          control={form.control}
          name="remaining_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Quantidade Restante</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="1"
                  {...field}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 bg-yellow-500 text-gray-900 hover:bg-yellow-600 font-semibold"
          >
            {editingSale ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ServicePackageSaleForm;
