"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import BlockedTimeRegistrationForm from '@/components/BlockedTimeRegistrationForm';
import BlockedTimeListItem from '@/components/BlockedTimeListItem';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface BlockedTime {
  id: string;
  technician_id: string;
  technician_name: string; // Joined from technicians table
  start_time: string; // ISO string
  end_time: string; // ISO string
  reason: string | null;
  is_recurring: boolean;
}

const BlockedTimesPage = () => {
  const { session, isLoading, user } = useSession();
  const { t } = useTranslation();
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingBlockedTimes, setLoadingBlockedTimes] = useState<boolean>(true);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState<boolean>(false);
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTime | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [blockedTimeToDelete, setBlockedTimeToDelete] = useState<string | null>(null);

  const fetchBlockedTimes = async () => {
    if (!user) return;
    setLoadingBlockedTimes(true);
    try {
      let query = supabase
        .from('blocked_times')
        .select(`
          id,
          technician_id,
          technicians (name),
          start_time,
          end_time,
          reason,
          is_recurring
        `)
        .eq('user_id', user.id) // Only fetch blocked times for the current user/manager
        .order('start_time', { ascending: true });

      // Note: Filtering by technician name or reason via search term on joined data can be complex in Supabase.
      // For simplicity, we'll filter client-side after fetching all.

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Map the data to the expected format
      const mappedData: BlockedTime[] = (data || []).map(item => ({
        id: item.id,
        technician_id: item.technician_id,
        technician_name: item.technicians?.name || t('unknown_technician'),
        start_time: item.start_time,
        end_time: item.end_time,
        reason: item.reason,
        is_recurring: item.is_recurring,
      }));

      setBlockedTimes(mappedData);
    } catch (error: any) {
      console.error("Erro ao buscar horários bloqueados:", error);
      showError(t('fetch_blocked_times_error') + error.message);
    } finally {
      setLoadingBlockedTimes(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBlockedTimes();
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtering is done client-side in the render for simplicity
  };

  const handleBlockedTimeAdded = () => {
    setIsAddEditDialogOpen(false);
    setEditingBlockedTime(null);
    fetchBlockedTimes(); // Refresh list
  };

  const handleEditClick = (blockedTime: BlockedTime) => {
    setEditingBlockedTime(blockedTime);
    setIsAddEditDialogOpen(true);
  };

  const handleDeleteClick = (blockedTimeId: string) => {
    setBlockedTimeToDelete(blockedTimeId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!blockedTimeToDelete || !user) return;

    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', blockedTimeToDelete)
        .eq('user_id', user.id); // Ensure user can only delete their own

      if (error) throw error;

      showSuccess(t('blocked_time_delete_success'));
      fetchBlockedTimes(); // Refresh list
    } catch (error: any) {
      console.error("Erro ao excluir horário bloqueado:", error);
      showError(t('blocked_time_delete_error') + error.message);
    } finally {
      setIsDeleteDialogOpen(false);
      setBlockedTimeToDelete(null);
    }
  };

  const filteredBlockedTimes = blockedTimes.filter(bt =>
    bt.technician_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bt.reason && bt.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">{t('loading')}</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-4 bg-gray-900 min-h-full text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('blocked_times_title')}</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddEditDialogOpen} onOpenChange={(open) => {
            setIsAddEditDialogOpen(open);
            if (!open) setEditingBlockedTime(null); // Clear editing state when dialog closes
          }}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="h-4 w-4 mr-2" /> {t('add_blocked_time_button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">
                  {editingBlockedTime ? t('blocked_time_edit_title') : t('blocked_time_registration_title')}
                </DialogTitle>
              </DialogHeader>
              <BlockedTimeRegistrationForm
                initialData={editingBlockedTime ? {
                  id: editingBlockedTime.id,
                  technician_id: editingBlockedTime.technician_id,
                  start_time: editingBlockedTime.start_time,
                  end_time: editingBlockedTime.end_time,
                  reason: editingBlockedTime.reason || "",
                  is_recurring: editingBlockedTime.is_recurring,
                } : null}
                onSuccess={handleBlockedTimeAdded}
                onCancel={() => {
                  setIsAddEditDialogOpen(false);
                  setEditingBlockedTime(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-grow max-w-md space-x-2">
          <Input
            type="text"
            placeholder={t('search_blocked_times_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-gray-700 text-gray-100 border-gray-600 placeholder:text-gray-400"
          />
          <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
            <Search className="h-4 w-4 mr-2" /> {t('search_button')}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-700">
            <TableRow>
              <TableHead className="text-gray-300">{t('blocked_time_technician_header')}</TableHead>
              <TableHead className="text-gray-300">{t('blocked_time_date_header')}</TableHead>
              <TableHead className="text-gray-300">{t('blocked_time_time_header')}</TableHead>
              <TableHead className="text-gray-300">{t('blocked_time_reason_header')}</TableHead>
              <TableHead className="text-gray-300">{t('blocked_time_recurring_header')}</TableHead>
              <TableHead className="w-[100px] text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingBlockedTimes ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  {t('loading_blocked_times')}
                </TableCell>
              </TableRow>
            ) : filteredBlockedTimes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-400">
                  {searchTerm ? t('no_blocked_times_found_search') : t('no_blocked_times_found')}
                </TableCell>
              </TableRow>
            ) : (
              filteredBlockedTimes.map(blockedTime => (
                <TableRow key={blockedTime.id} className="hover:bg-gray-700/50">
                  <TableCell className="font-medium">{blockedTime.technician_name}</TableCell>
                  <TableCell>
                    {/* Date is part of the BlockedTimeListItem component logic, but for table view, we show it here */}
                    {new Date(blockedTime.start_time).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {new Date(blockedTime.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(blockedTime.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>{blockedTime.reason || t('not_informed')}</TableCell>
                  <TableCell>
                    {blockedTime.is_recurring ? t('yes') : t('no')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(blockedTime)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(blockedTime.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirm_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm_delete_blocked_time_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100">
              {t('cancel_button')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('delete_button')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlockedTimesPage;