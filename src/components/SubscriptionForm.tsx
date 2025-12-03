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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  client_id: z.string().min(1, { message: "Selecione um cliente." }),
  package_id: z.string().min(1, { message: "Selecione um plano." }),
  start_date: z.date({ required_error: "Selecione a data de início." }),
  end_date: z.date({ required_error: "Selecione a data de vencimento." }),
  next_billing_date: z.date().optional(),
  status: z.enum(['active', 'expired', 'canceled']).default('active'),
});

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface ServicePackage {
  id: string;
  name: string;
  value: number;
  service_time?: number;
}

interface SubscriptionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { user } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      client_id: initialData.client_id,
      package_id: initialData.package_id,
      start_date: new Date(initialData.start_date),
      end_date: new Date(initialData.end_date),
      next_billing_date: initialData.next_billing_date ? new Date(initialData.next_billing_date) : undefined,
      status: initialData.status,
    } : {
      client_id: "",
      package_id: "",
      status: "active",
    },
  });

  useEffect(() => {
    fetchClients();
    fetchPackages();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone')
      .eq('user_id', user.id)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
    } else {
      setClients(data || []);
    }
  };

  const fetchPackages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('service_packages')
      .select('id, name, value, service_time')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar pacotes:', error);
    } else {
      setPackages(data || []);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError('Usuário não autenticado');
      return;
    }

    setLoading(true);

    try {
      const subscriptionData = {
        user_id: user.id,
        client_id: values.client_id,
        package_id: values.package_id,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: format(values.end_date, 'yyyy-MM-dd'),
        next_billing_date: values.next_billing_date ? format(values.next_billing_date, 'yyyy-MM-dd') : format(values.end_date, 'yyyy-MM-dd'),
        status: values.status,
      };

      if (initialData) {
        const { error } = await supabase
          .from('service_package_sales')
          .update(subscriptionData)
          .eq('id', initialData.id);

        if (error) throw error;
        showSuccess('Assinatura atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('service_package_sales')
          .insert(subscriptionData);

        if (error) throw error;
        showSuccess('Assinatura cadastrada com sucesso!');
      }

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar assinatura:', error);
      showError('Erro ao salvar assinatura: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Cliente *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} {client.phone && `- ${client.phone}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="package_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Plano *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} - R$ {pkg.value.toFixed(2).replace('.', ',')} {pkg.service_time && `(${pkg.service_time} meses)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-gray-300">Data de Início *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600",
                          !field.value && "text-gray-400"
                        )}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione a data"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={ptBR}
                      className="bg-gray-800"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-gray-300">Data de Vencimento *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600",
                          !field.value && "text-gray-400"
                        )}
                      >
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione a data"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={ptBR}
                      className="bg-gray-800"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="next_billing_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-gray-300">Próxima Data de Cobrança (Opcional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600",
                        !field.value && "text-gray-400"
                      )}
                    >
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione a data"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    locale={ptBR}
                    className="bg-gray-800"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold"
          >
            {loading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Cadastrar')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SubscriptionForm;
