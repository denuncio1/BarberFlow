"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MessageSquareText, Search, PhoneCall, Eye, Edit, Trash2, User } from 'lucide-react';
import ClientRegistrationForm from '@/components/ClientRegistrationForm';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  status: 'active' | 'blocked';
}

const ClientsPage = () => {
  const { session, isLoading, user } = useSession();
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState<boolean>(true);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!user) return;
    setLoadingClients(true);
    try {
      let query = supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, date_of_birth, avatar_url, status')
        .eq('user_id', user.id)
        .order('first_name', { ascending: true });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      setClients(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar clientes:", error);
      showError(t('fetch_clients_error') + error.message);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients();
  };

  const handleSuccess = () => {
    setIsAddEditDialogOpen(false);
    setEditingClient(null);
    fetchClients();
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setIsAddEditDialogOpen(true);
  };

  const handleDeleteClick = (clientId: string) => {
    setClientToDelete(clientId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete || !user) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      showSuccess(t('client_delete_success'));
      fetchClients();
    } catch (error: any) {
      console.error("Erro ao excluir cliente:", error);
      showError(t('client_delete_error') + error.message);
    } finally {
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">{t('loading')}</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-4 bg-gray-900 min-h-full text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('customers_title')}</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddEditDialogOpen} onOpenChange={(open) => {
            setIsAddEditDialogOpen(open);
            if (!open) setEditingClient(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="h-4 w-4 mr-2" /> {t('add_customers_button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">
                  {editingClient ? t('client_edit_title') : t('client_registration_title')}
                </DialogTitle>
              </DialogHeader>
              <ClientRegistrationForm
                initialData={editingClient}
                onSuccess={handleSuccess}
                onCancel={() => {
                  setIsAddEditDialogOpen(false);
                  setEditingClient(null);
                }}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 border-yellow-500">
            <MessageSquareText className="h-4 w-4 mr-2" /> {t('send_notification_button')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-grow max-w-md space-x-2">
          <Input
            type="text"
            placeholder={t('search_clients_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-gray-700 text-gray-100 border-gray-600 placeholder:text-gray-400"
          />
          <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            <Search className="h-4 w-4 mr-2" /> {t('search_button')}
          </Button>
        </form>
        <Button variant="outline" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 border-yellow-500 ml-auto">
          <PhoneCall className="h-4 w-4" /> <Eye className="h-4 w-4 -ml-1" />
        </Button>
      </div>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-700 hover:bg-gray-700">
            <TableRow>
              <TableHead className="text-gray-300">{t('client_name_email_header')}</TableHead>
              <TableHead className="text-gray-300">{t('client_phone_header')}</TableHead>
              <TableHead className="text-gray-300">{t('client_birthdate_header')}</TableHead>
              <TableHead className="text-gray-300">{t('client_status_header')}</TableHead>
              <TableHead className="w-[100px] text-right text-gray-300">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingClients ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-400">{t('loading_clients')}</TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-400">{t('no_clients_found')}</TableCell>
              </TableRow>
            ) : (
              clients.map(client => {
                const fullName = `${client.first_name} ${client.last_name}`;
                const statusColorClass = client.status === 'blocked' ? 'text-red-500' : 'text-green-500';
                return (
                  <TableRow key={client.id} className="hover:bg-gray-800">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={client.avatar_url || "/placeholder.svg"} alt={fullName} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{fullName}</div>
                          <div className="text-sm text-gray-400">{client.email || t('not_informed')}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{client.phone || t('not_informed')}</TableCell>
                    <TableCell>{client.date_of_birth ? format(new Date(client.date_of_birth), 'dd/MM/yyyy', { locale: ptBR }) : t('not_informed')}</TableCell>
                    <TableCell className={cn("font-medium", statusColorClass)}>
                      {client.status === 'blocked' ? t('client_status_blocked') : t('client_status_active')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(client)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(client.id)} className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirm_delete_client_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
              {t('cancel_button')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {t('delete_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsPage;