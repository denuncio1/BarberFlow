"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight, UserRound, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface TeamMemberListItemProps {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  skills?: string[];
  avatar_url?: string;
  color?: string; // Technician's assigned color
  onClick?: (teamMemberId: string) => void;
}

const TeamMemberListItem: React.FC<TeamMemberListItemProps> = ({
  id,
  name,
  email,
  phone,
  address,
  skills,
  avatar_url,
  color = '#6B7280', // Default gray color
  onClick,
}) => {
  const { t } = useTranslation();
  const displayEmail = email || t('not_informed');
  const displayPhone = phone || t('not_informed');
  const displayAddress = address || t('not_informed');
  const displaySkills = skills && skills.length > 0 ? skills.join(', ') : t('not_informed');

  return (
    <div
      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-sm hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={() => onClick?.(id)}
    >
      <div className="flex items-center space-x-4 flex-grow">
        <Avatar className="h-10 w-10 border-2" style={{ borderColor: color }}>
          <AvatarImage src={avatar_url || "/placeholder.svg"} alt={name} />
          <AvatarFallback style={{ backgroundColor: color }}>
            <UserRound className="h-5 w-5 text-white" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow grid grid-cols-4 gap-2 items-center">
          <div>
            <p className="font-semibold text-gray-100">{name}</p>
            <p className="text-sm text-gray-400 flex items-center">
              <Mail className="h-3 w-3 mr-1" /> {displayEmail}
            </p>
          </div>
          <p className="text-gray-300 flex items-center">
            <Phone className="h-3 w-3 mr-1" /> {displayPhone}
          </p>
          <p className="text-gray-300 flex items-center">
            <MapPin className="h-3 w-3 mr-1" /> {displayAddress}
          </p>
          <p className="text-gray-300">{displaySkills}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
    </div>
  );
};

export default TeamMemberListItem;