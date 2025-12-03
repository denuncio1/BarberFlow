import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  technician_id: z.string().min(1, { message: "Selecione um colaborador." }),
  goal_type: z.enum(['products', 'services_unsigned', 'services_signed', 'general_unsigned', 'general_signed']),
  goal_value: z.coerce.number().min(0, { message: "O valor da meta deve ser positivo." }),
  min_expected_value: z.coerce.number().min(0, { message: "O valor mínimo deve ser positivo." }),
  max_expected_value: z.coerce.number().min(0, { message: "O valor máximo deve ser positivo." }),
  bonus_active: z.boolean().default(false),
  consider_signature: z.boolean().default(false),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2024).max(2030),
});

interface TeamGoalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  technicians: Array<{ id: string; name: string }>;
  initialData?: z.infer<typeof formSchema> & { id?: string };
}

const TeamGoalForm: React.FC<TeamGoalFormProps> = ({ onSuccess, onCancel, technicians, initialData }) => {
  const { user } = useSession();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      technician_id: "",
      goal_type: "general_unsigned",
      goal_value: 0,
      min_expected_value: 0,
      max_expected_value: 0,
      bonus_active: false,
      consider_signature: false,
      month: currentMonth,
      year: currentYear,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError("Usuário não autenticado.");
      return;
    }

    // Validate that min <= max
    if (values.min_expected_value > values.max_expected_value) {
      showError("A meta mínima não pode ser maior que a meta máxima.");
      return;
    }

    try {
      const goalData = {
        user_id: user.id,
        technician_id: values.technician_id,
        goal_type: values.goal_type,
        goal_value: values.goal_value,
        min_expected_value: values.min_expected_value,
        max_expected_value: values.max_expected_value,
        bonus_active: values.bonus_active,
        consider_signature: values.consider_signature,
        month: values.month,
        year: values.year,
      };

      let error;
      if (initialData?.id) {
        // Update existing goal
        const result = await supabase
          .from('team_goals')
          .update(goalData)
          .eq('id', initialData.id);
        error = result.error;
      } else {
        // Create new goal
        const result = await supabase
          .from('team_goals')
          .insert([goalData]);
        error = result.error;
      }

      if (error) {
        throw error;
      }

      showSuccess(initialData?.id ? "Meta atualizada com sucesso!" : "Meta criada com sucesso!");
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar meta:", error);
      showError("Erro ao salvar meta: " + error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="technician_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-100">Colaborador</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Selecione um colaborador" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
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
          name="goal_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-100">Tipo da Meta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="products">Metas por produtos</SelectItem>
                  <SelectItem value="services_unsigned">Metas por serviços - Sem assinatura</SelectItem>
                  <SelectItem value="services_signed">Metas por serviços - Com assinatura</SelectItem>
                  <SelectItem value="general_unsigned">Metas gerais - Sem assinatura</SelectItem>
                  <SelectItem value="general_signed">Metas gerais - Com assinatura</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-100">Mês</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2025, month - 1).toLocaleString('pt-BR', { month: 'long' })}
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
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-100">Ano</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {[2024, 2025, 2026, 2027].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="goal_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-100">Valor da Meta (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  {...field} 
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </FormControl>
              <FormDescription className="text-gray-400">
                Valor alvo principal da meta
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_expected_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-100">Meta Mínima (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    {...field} 
                    className="bg-gray-700 border-gray-600 text-gray-100"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Valor mínimo esperado
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_expected_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-100">Meta Máxima (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    {...field} 
                    className="bg-gray-700 border-gray-600 text-gray-100"
                  />
                </FormControl>
                <FormDescription className="text-gray-400">
                  Valor máximo esperado
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bonus_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4 bg-gray-800">
              <div className="space-y-0.5">
                <FormLabel className="text-gray-100">Bônus Ativo</FormLabel>
                <FormDescription className="text-gray-400">
                  Ativar sistema de bônus para esta meta
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consider_signature"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4 bg-gray-800">
              <div className="space-y-0.5">
                <FormLabel className="text-gray-100">Considerar Assinatura</FormLabel>
                <FormDescription className="text-gray-400">
                  Incluir vendas com assinatura no cálculo
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="bg-gray-700 border-gray-600 hover:bg-gray-600"
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          >
            {initialData?.id ? 'Atualizar Meta' : 'Criar Meta'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamGoalForm;
