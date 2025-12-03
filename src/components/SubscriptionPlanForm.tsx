"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório." }),
  value: z.string().min(1, { message: "Valor é obrigatório." }),
  service_time: z.string().optional(),
  enabled_days: z.array(z.string()).min(1, { message: "Selecione pelo menos um dia." }),
  service_ids: z.array(z.string()).min(1, { message: "Selecione pelo menos um serviço." }),
  usage_limit: z.boolean().default(false),
  visible_to_clients: z.boolean().default(true),
});

interface Service {
  id: string;
  name: string;
}

interface SubscriptionPlanFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
}

const daysOfWeek = [
  { value: 'Monday', label: 'Segunda-feira' },
  { value: 'Tuesday', label: 'Terça-feira' },
  { value: 'Wednesday', label: 'Quarta-feira' },
  { value: 'Thursday', label: 'Quinta-feira' },
  { value: 'Friday', label: 'Sexta-feira' },
  { value: 'Saturday', label: 'Sábado' },
  { value: 'Sunday', label: 'Domingo' },
];

const SubscriptionPlanForm: React.FC<SubscriptionPlanFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { user } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      value: initialData.value.toString(),
      service_time: initialData.service_time?.toString() || '',
      enabled_days: initialData.enabled_days || [],
      service_ids: initialData.services?.map((s: any) => s.id) || [],
      usage_limit: initialData.usage_limit || false,
      visible_to_clients: initialData.visible_to_clients ?? true,
    } : {
      name: "",
      value: "",
      service_time: "",
      enabled_days: [],
      service_ids: [],
      usage_limit: false,
      visible_to_clients: true,
    },
  });

  useEffect(() => {
    fetchServices();
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('services')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar serviços:', error);
    } else {
      setServices(data || []);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError('Usuário não autenticado');
      return;
    }

    setLoading(true);

    try {
      const packageData = {
        user_id: user.id,
        name: values.name,
        value: parseFloat(values.value),
        service_time: values.service_time ? parseInt(values.service_time) : null,
        enabled_days: values.enabled_days,
        usage_limit: values.usage_limit,
        visible_to_clients: values.visible_to_clients,
      };

      let packageId: string;

      if (initialData) {
        // Atualizar pacote existente
        const { error } = await supabase
          .from('service_packages')
          .update(packageData)
          .eq('id', initialData.id);

        if (error) throw error;
        packageId = initialData.id;

        // Deletar serviços antigos
        await supabase
          .from('service_package_services')
          .delete()
          .eq('service_package_id', packageId);

        showSuccess('Plano atualizado com sucesso!');
      } else {
        // Criar novo pacote
        const { data, error } = await supabase
          .from('service_packages')
          .insert(packageData)
          .select()
          .single();

        if (error) throw error;
        packageId = data.id;
        showSuccess('Plano cadastrado com sucesso!');
      }

      // Inserir novos serviços
      const serviceLinks = values.service_ids.map(serviceId => ({
        service_package_id: packageId,
        service_id: serviceId,
        user_id: user.id,
      }));

      const { error: servicesError } = await supabase
        .from('service_package_services')
        .insert(serviceLinks);

      if (servicesError) throw servicesError;

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      showError('Erro ao salvar plano: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Nome do Plano *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Plano Gold"
                    {...field}
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Valor (R$) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="99,90"
                    {...field}
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="service_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Duração do Plano (meses)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ex: 1, 3, 6, 12"
                  {...field}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                />
              </FormControl>
              <FormDescription className="text-gray-500 text-xs">
                Deixe em branco para plano mensal recorrente
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enabled_days"
          render={() => (
            <FormItem>
              <FormLabel className="text-gray-300">Dias Habilitados *</FormLabel>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day.value}
                    control={form.control}
                    name="enabled_days"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(day.value)}
                            onCheckedChange={(checked) => {
                              const updatedValue = checked
                                ? [...field.value, day.value]
                                : field.value?.filter((value) => value !== day.value);
                              field.onChange(updatedValue);
                            }}
                            className="border-gray-600 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-gray-300 cursor-pointer">
                          {day.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_ids"
          render={() => (
            <FormItem>
              <FormLabel className="text-gray-300">Serviços Incluídos *</FormLabel>
              <div className="grid grid-cols-2 gap-3 mt-2 max-h-48 overflow-y-auto p-2 bg-gray-900/50 rounded-md border border-gray-700">
                {services.map((service) => (
                  <FormField
                    key={service.id}
                    control={form.control}
                    name="service_ids"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(service.id)}
                            onCheckedChange={(checked) => {
                              const updatedValue = checked
                                ? [...field.value, service.id]
                                : field.value?.filter((value) => value !== service.id);
                              field.onChange(updatedValue);
                            }}
                            className="border-gray-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal text-gray-300 cursor-pointer">
                          {service.name}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              {services.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">Nenhum serviço cadastrado</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 pt-4 border-t border-gray-700">
          <FormField
            control={form.control}
            name="usage_limit"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4 bg-gray-900/50">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-gray-300">
                    Limite de uso
                  </FormLabel>
                  <FormDescription className="text-gray-500 text-xs">
                    Define se o plano tem um limite de utilizações
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="visible_to_clients"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4 bg-gray-900/50">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-gray-300">
                    Visível para clientes
                  </FormLabel>
                  <FormDescription className="text-gray-500 text-xs">
                    Permite que os clientes vejam e assinem este plano
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

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
            {loading ? 'Salvando...' : (initialData ? 'Atualizar plano' : 'Cadastrar plano')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SubscriptionPlanForm;
