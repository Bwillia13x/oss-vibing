/**
 * Collaboration Rooms Page
 * 
 * Manage and access collaborative rooms.
 * Week 3-4: Room Management UI
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users, Trash2, Settings, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  type: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  permission: 'owner' | 'editor' | 'viewer';
}

export default function CollaboratePage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/collaboration/rooms');
      
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      setIsCreating(true);
      const response = await fetch('/api/collaboration/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRoomName,
          type: 'NOTE',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const newRoom = await response.json();
      setRooms([newRoom, ...rooms]);
      setNewRoomName('');
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`/api/collaboration/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      setRooms(rooms.filter((room) => room.id !== roomId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete room');
    }
  };

  const openRoom = (roomId: string) => {
    router.push(`/collaborate/${roomId}`);
  };

  const getPermissionBadge = (permission: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      owner: { variant: 'default', label: 'Owner' },
      editor: { variant: 'secondary', label: 'Editor' },
      viewer: { variant: 'outline', label: 'Viewer' },
    };

    const config = variants[permission] || variants.viewer;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collaboration Rooms</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage collaborative workspaces
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>
                  Create a new collaborative workspace for your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    placeholder="My Research Project"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        createRoom();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createRoom}
                    disabled={!newRoomName.trim() || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Room'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Rooms Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first collaboration room to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openRoom(room.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {room.owner.name}
                      </CardDescription>
                    </div>
                    {getPermissionBadge(room.permission)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Updated {new Date(room.updatedAt).toLocaleDateString()}
                    </div>
                    {room.isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoom(room.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
