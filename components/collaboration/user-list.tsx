/**
 * User List Component
 * 
 * Shows detailed list of all active users in a collaboration session.
 * Displays cursor positions and activity status.
 * 
 * Week 2-3: Collaboration UI Components
 */

'use client';

import { UserPresence } from '@/lib/collaboration';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface UserListProps {
  users: Map<number, UserPresence>;
  currentUserId: string;
}

export function UserList({ users, currentUserId }: UserListProps) {
  const activeUsers = Array.from(users.values());
  
  if (activeUsers.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No active users
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Active Users ({activeUsers.length})
        </h3>
        
        {activeUsers.map((user) => {
          const isCurrentUser = user.userId === currentUserId;
          const timeSince = getTimeSince(user.lastSeen);
          
          return (
            <div
              key={user.userId}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCurrentUser
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/50'
              }`}
            >
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: user.color }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {user.userName}
                  </p>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                
                {user.cursor && (
                  <p className="text-xs text-muted-foreground">
                    Editing at line {user.cursor.line}, column {user.cursor.column}
                  </p>
                )}
                
                {user.selection && (
                  <p className="text-xs text-muted-foreground">
                    Selected {user.selection.end.line - user.selection.start.line + 1} line
                    {user.selection.end.line - user.selection.start.line !== 0 ? 's' : ''}
                  </p>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {timeSince}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function getTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
