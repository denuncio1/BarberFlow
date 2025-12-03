"use client";

import React from 'react';
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
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  value: z.coerce.number().min(0, { message: "O valor deve ser positivo." }),
  service_time: z.string().min(1, { message: "O tempo de atendimento é obrigatório." }),
  type: z.string().min(1, { message: "O tipo é obrigatório." }),
  service_quantity: z.coerce.number().int().min(1, { message: "A quantidade deve ser no mínimo 1." }),
});

interface ServicePackageFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingPackage?: {
    id: string;
    name: string;
    value: number;
    service_time: string;
    type: string;
    service_quantity: number;
  } | null;
}

const ServicePackageForm: React.FC<ServicePackageFormProps> = ({ onSuccess, onCancel, editingPackage }) => {
  const { user } = useSession();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: editingPackage?.name || "",
      value: editingPackage?.value || 0,
      service_time: editingPackage?.service_time || "",
      type: editingPackage?.type || "individual_service_package",
      service_quantity: editingPackage?.service_quantity || 1,
    },
  });

  React.useEffect(() => {
    if (editingPackage) {
      form.reset({
        name: editingPackage.name,
        value: editingPackage.value,
        service_time: editingPackage.service_time,
        type: editingPackage.type,
        service_quantity: editingPackage.service_quantity,
      });
    }
  }, [editingPackage, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError('Usuário não autenticado');
      return;
    }

    try {
      const packageData = {
        user_id: user.id,
        name: values.name,
        value: values.value,
        service_time: values.service_time,
        type: values.type,
        service_quantity: values.service_quantity,
      };

      let error;

      if (editingPackage) {
        const result = await supabase
          .from('service_packages')
          .update(packageData)
          .eq('id', editingPackage.id)
          .select();
        error = result.error;
      } else {
        const result = await supabase
          .from('service_packages')
          .insert(packageData)
          .select();
        error = result.error;
      }

      if (error) throw error;

      showSuccess(editingPackage ? 'Pacote atualizado com sucesso!' : 'Pacote cadastrado com sucesso!');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar pacote:", error);
      showError('Erro ao salvar pacote: ' + error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nome do Pacote */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Nome do Pacote</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: CORTE & BARBA SELECT"
                  {...field}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Valor */}
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Valor (R$)</FormLabel>
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

        {/* Tempo de Atendimento */}
        <FormField
          control={form.control}
          name="service_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Tempo de Atendimento</FormLabel>
              <FormControl>
                <Input
                  placeholder="01:00"
                  {...field}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="individual_service_package" className="text-gray-100">
                    individual_service_package
                  </SelectItem>
                  <SelectItem value="recurring_service_package" className="text-gray-100">
                    recurring_service_package
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantidade de Serviços */}
        <FormField
          control={form.control}
          name="service_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Quantidade de Serviços</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="2"
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
            {editingPackage ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ServicePackageForm;
