/**
 * Room Access Control (ACL)
 * 
 * Implements permission system for collaboration rooms.
 * Controls who can view, edit, or manage collaborative documents.
 * 
 * Critical for Production - Week 1-2
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum RoomPermission {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export interface RoomACL {
  id: string;
  roomId: string;
  userId: string;
  permission: RoomPermission;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if user has access to a room with required permission level
 */
export async function checkRoomAccess(
  userId: string,
  roomId: string,
  requiredPermission: RoomPermission
): Promise<boolean> {
  try {
    // For now, use document table as room representation
    const document = await prisma.document.findUnique({
      where: { id: roomId },
      select: { userId: true },
    });

    if (!document) {
      return false;
    }

    // Owner has full access
    if (document.userId === userId) {
      return true;
    }

    // TODO: Check ACL table when implemented
    // For now, only owner has access
    return false;
  } catch (error) {
    console.error('Error checking room access:', error);
    return false;
  }
}

/**
 * Grant room access to a user
 */
export async function grantRoomAccess(
  roomId: string,
  userId: string,
  permission: RoomPermission,
  grantedBy: string
): Promise<void> {
  try {
    // Verify grantor has owner permission
    const hasOwnerAccess = await checkRoomAccess(grantedBy, roomId, RoomPermission.OWNER);
    
    if (!hasOwnerAccess) {
      throw new Error('Only room owner can grant access');
    }

    // TODO: Implement ACL table creation
    // For now, log the grant
    console.log(`Access granted: Room ${roomId}, User ${userId}, Permission ${permission}`);
    
    // Future implementation will use:
    // await prisma.roomACL.create({
    //   data: { roomId, userId, permission },
    // });
  } catch (error) {
    console.error('Error granting room access:', error);
    throw error;
  }
}

/**
 * Revoke room access from a user
 */
export async function revokeRoomAccess(
  roomId: string,
  userId: string,
  revokedBy: string
): Promise<void> {
  try {
    // Verify revoker has owner permission
    const hasOwnerAccess = await checkRoomAccess(revokedBy, roomId, RoomPermission.OWNER);
    
    if (!hasOwnerAccess) {
      throw new Error('Only room owner can revoke access');
    }

    // TODO: Implement ACL table deletion
    console.log(`Access revoked: Room ${roomId}, User ${userId}`);
    
    // Future implementation will use:
    // await prisma.roomACL.deleteMany({
    //   where: { roomId, userId },
    // });
  } catch (error) {
    console.error('Error revoking room access:', error);
    throw error;
  }
}

/**
 * Get all users with access to a room
 */
export async function getRoomUsers(roomId: string): Promise<Array<{
  userId: string;
  permission: RoomPermission;
}>> {
  try {
    // Get room owner
    const document = await prisma.document.findUnique({
      where: { id: roomId },
      select: { userId: true },
    });

    if (!document) {
      return [];
    }

    // Return owner as the only user for now
    return [
      {
        userId: document.userId,
        permission: RoomPermission.OWNER,
      },
    ];

    // TODO: Fetch from ACL table when implemented
    // const acls = await prisma.roomACL.findMany({
    //   where: { roomId },
    //   select: { userId: true, permission: true },
    // });
    // return acls;
  } catch (error) {
    console.error('Error getting room users:', error);
    return [];
  }
}

/**
 * Get permission level hierarchy value
 */
export function getPermissionLevel(permission: RoomPermission): number {
  const permissionLevel = {
    [RoomPermission.OWNER]: 3,
    [RoomPermission.EDITOR]: 2,
    [RoomPermission.VIEWER]: 1,
  };
  
  return permissionLevel[permission] || 0;
}

/**
 * Check if permission A is higher or equal to permission B
 */
export function hasPermissionLevel(
  userPermission: RoomPermission,
  requiredPermission: RoomPermission
): boolean {
  return getPermissionLevel(userPermission) >= getPermissionLevel(requiredPermission);
}

/**
 * Get user's permission for a room
 */
export async function getUserPermission(
  userId: string,
  roomId: string
): Promise<RoomPermission | null> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: roomId },
      select: { userId: true },
    });

    if (!document) {
      return null;
    }

    // Owner has full access
    if (document.userId === userId) {
      return RoomPermission.OWNER;
    }

    // TODO: Check ACL table when implemented
    return null;
  } catch (error) {
    console.error('Error getting user permission:', error);
    return null;
  }
}
