/**
 * Room Invitation Component
 * 
 * Allows users to invite others to collaborate on a document.
 * Generates shareable links and manages permissions.
 * 
 * Week 2-3: Collaboration UI Components
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoomPermission } from '@/lib/collaboration';
import { Copy, Check, Users } from 'lucide-react';

interface RoomInvitationProps {
  roomId: string;
  onInvite?: (email: string, permission: RoomPermission) => Promise<void>;
}

export function RoomInvitation({ roomId, onInvite }: RoomInvitationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<RoomPermission>(RoomPermission.EDITOR);
  const [isInviting, setIsInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/collaborate/${roomId}`;

  const handleInvite = async () => {
    if (!email || !onInvite) return;
    
    setIsInviting(true);
    try {
      await onInvite(email, permission);
      setEmail('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to invite user:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Invite
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to collaborate</DialogTitle>
          <DialogDescription>
            Share this document with others to collaborate in real-time
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share link */}
          <div className="space-y-2">
            <Label>Share link</Label>
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the document
            </p>
          </div>
          
          {/* Email invitation */}
          <div className="space-y-2">
            <Label htmlFor="email">Invite by email</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          {/* Permission level */}
          <div className="space-y-2">
            <Label htmlFor="permission">Permission</Label>
            <Select
              value={permission}
              onValueChange={(value) => setPermission(value as RoomPermission)}
            >
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RoomPermission.VIEWER}>
                  Viewer - Can view only
                </SelectItem>
                <SelectItem value={RoomPermission.EDITOR}>
                  Editor - Can view and edit
                </SelectItem>
                <SelectItem value={RoomPermission.OWNER}>
                  Owner - Full control
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!email || isInviting}
            >
              {isInviting ? 'Inviting...' : 'Send invitation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
