"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface ClientListItemProps {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string; // ISO string
  avatar_url?: string;
  status: 'active' | 'blocked';
  onClick?: (clientId: string) => void;
}

const ClientListItem: React.FC<ClientListItemProps> = ({
  id,
  first_name,
  last_name,
  email,
  phone,
  date_of_birth,
  avatar_url,
  status,
  onClick,
}) => {
  const { t } = useTranslation();
  const fullName = `${first_name} ${last_name}`;
  const displayEmail = email || t('not_informed');
  const displayPhone = phone || t('not_informed');
  const displayBirthDate = date_of_birth ? format(new Date(date_of_birth), 'dd/MM/yyyy', { locale: ptBR }) : t('not_informed');

  const statusColorClass = status === 'blocked' ? 'text-red-500' : 'text-green-500';
  const displayStatus = status === 'blocked' ? t('client_status_blocked') : t('client_status_active');

  return (
    <div
      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-sm hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <div className="flex items-center space-x-4 flex-grow">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar_url || "/placeholder.svg"} alt={fullName} />
          <AvatarFallback>
            <User className="h-5 w-5 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow grid grid-cols-4 gap-2 items-center">
          <div>
            <p className="font-semibold text-gray-100">{fullName}</p>
            <p className="text-sm text-gray-400">{displayEmail}</p>
          </div>
          <p className="text-gray-300">{displayPhone}</p>
          <p className="text-gray-300">{displayBirthDate}</p>
          <p className={cn("font-medium", statusColorClass)}>{displayStatus}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
    </div>
  );
};

export default ClientListItem;