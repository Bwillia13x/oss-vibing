/**
 * Presence Indicator Component
 * 
 * Displays active users in a collaborative session.
 * Shows user avatars with color-coded indicators.
 * 
 * Week 2-3: Collaboration UI Components
 */

'use client';

import { useEffect, useState } from 'react';
import { UserPresence } from '@/lib/collaboration';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PresenceIndicatorProps {
  users: Map<number, UserPresence>;
  maxVisible?: number;
}

export function PresenceIndicator({ users, maxVisible = 5 }: PresenceIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  
  useEffect(() => {
    setActiveUsers(Array.from(users.values()));
  }, [users]);

  const visibleUsers = activeUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, activeUsers.length - maxVisible);
  
  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/50">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground font-medium">
          {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} editing
        </span>
      </div>
      
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <div
            key={user.userId}
            className="relative group"
            style={{ zIndex: visibleUsers.length - index }}
          >
            <Avatar
              className="border-2 border-background transition-transform hover:scale-110 hover:z-50"
              style={{ borderColor: user.color }}
            >
              <AvatarFallback
                className="text-white text-xs font-semibold"
                style={{ backgroundColor: user.color }}
              >
                {user.userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {user.userName}
              {user.cursor && (
                <div className="text-[10px] text-gray-300">
                  Line {user.cursor.line}, Col {user.cursor.column}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-background text-xs font-semibold">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}
