"use client";

import React, { useState, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Link as LinkIcon, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')), // Comma-separated string for skills
  avatar_url: z.string().optional().or(z.literal('')),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: "Cor inválida. Use formato hexadecimal (ex: #RRGGBB)." }).default('#6B7280'),
});

interface TeamMemberRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    skills?: string[] | null;
    avatar_url?: string | null;
    color?: string | null;
  };
}

const TeamMemberRegistrationForm: React.FC<TeamMemberRegistrationFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { user } = useSession();
  const { t } = useTranslation();
  const [avatarPreview, setAvatarPreview] = useState<string>(initialData?.avatar_url || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      skills: initialData?.skills ? initialData.skills.join(', ') : "",
      avatar_url: initialData?.avatar_url || "",
      color: initialData?.color || "#6B7280",
    },
  });

  const uploadImage = async (file: File) => {
    if (!user) return null;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      showError('Erro ao fazer upload da imagem: ' + error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('A imagem deve ter no máximo 5MB');
      return;
    }

    const url = await uploadImage(file);
    if (url) {
      setAvatarPreview(url);
      form.setValue('avatar_url', url);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    form.setValue('avatar_url', '');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError(t('unauthenticated_user_error'));
      return;
    }

    try {
      const technicianData = {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        address: values.address || null,
        skills: values.skills ? values.skills.split(',').map(s => s.trim()) : [], // Convert comma-separated string to array
        avatar_url: values.avatar_url || null,
        color: values.color,
      };

      if (initialData) {
        // Update existing technician
        const { error } = await supabase
          .from('technicians')
          .update(technicianData)
          .eq('id', initialData.id)
          .eq('user_id', user.id);

        if (error) throw error;
        showSuccess(t('team_member_update_success') || 'Membro da equipe atualizado com sucesso!');
      } else {
        // Insert new technician
        const { error } = await supabase
          .from('technicians')
          .insert({
            user_id: user.id, // Link technician to the current authenticated user (manager)
            ...technicianData,
          });

        if (error) throw error;
        showSuccess(t('team_member_registration_success'));
        form.reset(); // Clear the form
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao salvar membro da equipe:", error);
      showError((initialData ? t('team_member_update_error') : t('team_member_registration_error')) + error.message);
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
              
              {/* Avatar Preview */}
              {avatarPreview && (
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-20 w-20 border-2">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback>Avatar</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="h-4 w-4 mr-1" /> Remover
                  </Button>
                </div>
              )}

              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="camera">
                    <Camera className="h-4 w-4 mr-2" /> Câmera
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="h-4 w-4 mr-2" /> URL
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingImage ? 'Enviando...' : 'Selecionar Arquivo'}
                    </Button>
                    <p className="text-xs text-gray-500">Máximo 5MB - JPG, PNG, GIF</p>
                  </div>
                </TabsContent>

                <TabsContent value="camera" className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {uploadingImage ? 'Enviando...' : 'Tirar Foto'}
                    </Button>
                    <p className="text-xs text-gray-500">Abre a câmera do dispositivo</p>
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <FormControl>
                    <Input 
                      placeholder={t('team_member_avatar_placeholder')} 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setAvatarPreview(e.target.value);
                      }}
                      className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600" 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Cole a URL de uma imagem</p>
                </TabsContent>
              </Tabs>
              
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