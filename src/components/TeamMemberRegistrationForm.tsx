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
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea'; // For skills

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')), // Comma-separated string for skills
  avatar_url: z.string().url({ message: "Por favor, insira uma URL válida para o avatar." }).optional().or(z.literal('')),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: "Cor inválida. Use formato hexadecimal (ex: #RRGGBB)." }).default('#6B7280'),
});

interface TeamMemberRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TeamMemberRegistrationForm: React.FC<TeamMemberRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useSession();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      skills: "",
      avatar_url: "",
      color: "#6B7280",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError(t('unauthenticated_user_error'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('technicians')
        .insert({
          user_id: user.id, // Link technician to the current authenticated user (manager)
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          address: values.address || null,
          skills: values.skills ? values.skills.split(',').map(s => s.trim()) : [], // Convert comma-separated string to array
          avatar_url: values.avatar_url || null,
          color: values.color,
        })
        .select();

      if (error) {
        throw error;
      }

      showSuccess(t('team_member_registration_success'));
      form.reset(); // Clear the form
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar membro da equipe:", error);
      showError(t('team_member_registration_error') + error.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('team_member_name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('team_member_name_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('team_member_email_label')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('team_member_email_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('team_member_phone_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('team_member_phone_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('team_member_address_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('team_member_address_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('team_member_skills_label')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('team_member_skills_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('team_member_avatar_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('team_member_avatar_placeholder')} {...field} className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">{t('team_member_color_label')}</FormLabel>
              <FormControl>
                <Input type="color" {...field} className="h-10 w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 p-1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
              {t('cancel_button')}
            </Button>
          )}
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {t('team_member_registration_submit_button')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamMemberRegistrationForm;