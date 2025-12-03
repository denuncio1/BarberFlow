"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, UsersRound } from 'lucide-react';
import TeamMemberRegistrationForm from '@/components/TeamMemberRegistrationForm';
import TeamMemberListItem from '@/components/TeamMemberListItem';
import { useTranslation } from 'react-i18next';

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  color: string | null;
}

const TeamPage = () => {
  const { session, isLoading, user } = useSession();
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<Technician[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingTeamMembers, setLoadingTeamMembers] = useState<boolean>(true);
  const [isAddTeamMemberDialogOpen, setIsAddTeamMemberDialogOpen] = useState<boolean>(false);
  const [isEditTeamMemberDialogOpen, setIsEditTeamMemberDialogOpen] = useState<boolean>(false);
  const [editingTeamMember, setEditingTeamMember] = useState<Technician | null>(null);

  const fetchTeamMembers = async () => {
    if (!user) return;
    setLoadingTeamMembers(true);
    try {
      let query = supabase
        .from('technicians')
        .select('id, name, email, phone, address, skills, avatar_url, color')
        .eq('user_id', user.id) // Filter by the current user (manager)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar membros da equipe:", error);
      showError(t('fetch_team_members_error') + error.message);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]); // Fetch team members initially and when user changes

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeamMembers(); // Re-fetch team members with the current search term
  };

  const handleTeamMemberAdded = () => {
    setIsAddTeamMemberDialogOpen(false);
    fetchTeamMembers(); // Refresh team member list after adding a new one
  };

  const handleTeamMemberUpdated = () => {
    setIsEditTeamMemberDialogOpen(false);
    setEditingTeamMember(null);
    fetchTeamMembers(); // Refresh team member list after updating
  };

  const handleTeamMemberClick = (teamMemberId: string) => {
    const member = teamMembers.find(m => m.id === teamMemberId);
    if (member) {
      setEditingTeamMember(member);
      setIsEditTeamMemberDialogOpen(true);
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
        <h1 className="text-3xl font-bold">{t('team_title')}</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddTeamMemberDialogOpen} onOpenChange={setIsAddTeamMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="h-4 w-4 mr-2" /> {t('add_team_member_button')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-gray-100">{t('team_member_registration_title')}</DialogTitle>
              </DialogHeader>
              <TeamMemberRegistrationForm onSuccess={handleTeamMemberAdded} onCancel={() => setIsAddTeamMemberDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-grow max-w-md space-x-2">
          <Input
            type="text"
            placeholder={t('search_team_members_placeholder')}
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
        <div className="grid grid-cols-4 gap-2 p-4 bg-gray-700 text-gray-300 font-semibold">
          <div className="col-span-1">{t('team_member_name_email_header')}</div>
          <div>{t('team_member_phone_header')}</div>
          <div>{t('team_member_address_header')}</div>
          <div>{t('team_member_skills_header')}</div>
        </div>
        <div className="space-y-2 p-2">
          {loadingTeamMembers ? (
            <p className="text-center text-gray-400">{t('loading_team_members')}</p>
          ) : teamMembers.length === 0 ? (
            <p className="text-center text-gray-400">{t('no_team_members_found')}</p>
          ) : (
            teamMembers.map(member => (
              <TeamMemberListItem
                key={member.id}
                id={member.id}
                name={member.name}
                email={member.email}
                phone={member.phone || undefined}
                address={member.address || undefined}
                skills={member.skills || undefined}
                avatar_url={member.avatar_url || undefined}
                color={member.color || undefined}
                onClick={handleTeamMemberClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Team Member Dialog */}
      <Dialog open={isEditTeamMemberDialogOpen} onOpenChange={setIsEditTeamMemberDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">{t('edit_team_member_title')}</DialogTitle>
          </DialogHeader>
          {editingTeamMember && (
            <TeamMemberRegistrationForm 
              onSuccess={handleTeamMemberUpdated} 
              onCancel={() => {
                setIsEditTeamMemberDialogOpen(false);
                setEditingTeamMember(null);
              }}
              initialData={editingTeamMember}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPage;