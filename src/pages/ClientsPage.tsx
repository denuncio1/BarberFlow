"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MessageSquareText, Search, PhoneCall, Eye } from 'lucide-react';
import ClientRegistrationForm from '@/components/ClientRegistrationForm';
import ClientListItem from '@/components/ClientListItem';
import { useTranslation } from 'react-i18next';

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
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState<boolean>(false);

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
  }, [user]); // Fetch clients initially and when user changes

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(); // Re-fetch clients with the current search term
  };

  const handleClientAdded = () => {
    setIsAddClientDialogOpen(false);
    fetchClients(); // Refresh client list after adding a new client
  };

  const handleClientClick = (clientId: string) => {
    showSuccess(`Detalhes do cliente ${clientId} (em desenvolvimento)!`);
    // Implement navigation to client detail page later
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
          <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="h-4 w-4 mr-2" /> {t('add_customers_button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">{t('client_registration_title')}</DialogTitle>
              </DialogHeader>
              <ClientRegistrationForm onSuccess={handleClientAdded} onCancel={() => setIsAddClientDialogOpen(false)} />
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
        <div className="grid grid-cols-4 gap-2 p-4 bg-gray-700 text-gray-300 font-semibold">
          <div className="col-span-1">{t('client_name_email_header')}</div>
          <div>{t('client_phone_header')}</div>
          <div>{t('client_birthdate_header')}</div>
          <div>{t('client_status_header')}</div>
        </div>
        <div className="space-y-2 p-2">
          {loadingClients ? (
            <p className="text-center text-gray-400">{t('loading_clients')}</p>
          ) : clients.length === 0 ? (
            <p className="text-center text-gray-400">{t('no_clients_found')}</p>
          ) : (
            clients.map(client => (
              <ClientListItem
                key={client.id}
                id={client.id}
                first_name={client.first_name}
                last_name={client.last_name}
                email={client.email || undefined}
                phone={client.phone || undefined}
                date_of_birth={client.date_of_birth || undefined}
                avatar_url={client.avatar_url || undefined}
                status={client.status}
                onClick={handleClientClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;