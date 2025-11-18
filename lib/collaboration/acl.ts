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

    // Check ACL table for granted permissions
    const acl = await prisma.roomACL.findUnique({
      where: {
        documentId_userId: {
          documentId: roomId,
          userId: userId,
        },
      },
      select: { permission: true },
    });

    if (!acl) {
      return false;
    }

    // Check if user's permission level is sufficient
    const userPermission = acl.permission as RoomPermission;
    return hasPermissionLevel(userPermission, requiredPermission);
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

    // Verify the room/document exists
    const document = await prisma.document.findUnique({
      where: { id: roomId },
      select: { id: true, userId: true },
    });

    if (!document) {
      throw new Error('Room not found');
    }

    // Don't allow granting access to the owner
    if (document.userId === userId) {
      throw new Error('Owner already has full access');
    }

    // Upsert ACL entry (create if missing, update permission if exists)
    await prisma.roomACL.upsert({
      where: {
        documentId_userId: {
          documentId: roomId,
          userId: userId,
        },
      },
      create: {
        documentId: roomId,
        userId: userId,
        permission: permission,
        invitedById: grantedBy,
      },
      update: {
        permission: permission,
        updatedAt: new Date(),
      },
    });

    // Log the grant for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: grantedBy,
        action: 'GRANT_ROOM_ACCESS',
        resource: 'room',
        resourceId: roomId,
        severity: 'INFO',
        details: JSON.stringify({
          targetUserId: userId,
          permission: permission,
        }),
      },
    });

    console.log(`Access granted: Room ${roomId}, User ${userId}, Permission ${permission}`);
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

    // Verify the room/document exists
    const document = await prisma.document.findUnique({
      where: { id: roomId },
      select: { userId: true },
    });

    if (!document) {
      throw new Error('Room not found');
    }

    // Don't allow revoking owner's access
    if (document.userId === userId) {
      throw new Error('Cannot revoke owner access');
    }

    // Delete ACL entry
    await prisma.roomACL.deleteMany({
      where: {
        documentId: roomId,
        userId: userId,
      },
    });

    // Log the revocation for audit purposes
    await prisma.auditLog.create({
      data: {
        userId: revokedBy,
        action: 'REVOKE_ROOM_ACCESS',
        resource: 'room',
        resourceId: roomId,
        severity: 'INFO',
        details: JSON.stringify({
          targetUserId: userId,
        }),
      },
    });

    console.log(`Access revoked: Room ${roomId}, User ${userId}`);
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
  name?: string;
  email?: string;
}>> {
  try {
    // Get room owner
    const document = await prisma.document.findUnique({
      where: { id: roomId },
      select: { 
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return [];
    }

    const users: Array<{
      userId: string;
      permission: RoomPermission;
      name?: string;
      email?: string;
    }> = [
      {
        userId: document.userId,
        permission: RoomPermission.OWNER,
        name: document.user.name || undefined,
        email: document.user.email,
      },
    ];

    // Fetch ACL entries with user details
    const acls = await prisma.roomACL.findMany({
      where: { documentId: roomId },
      select: { 
        userId: true, 
        permission: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Add ACL users to the list
    for (const acl of acls) {
      users.push({
        userId: acl.userId,
        permission: acl.permission as RoomPermission,
        name: acl.user.name || undefined,
        email: acl.user.email,
      });
    }

    return users;
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

    // Check ACL table for granted permission
    const acl = await prisma.roomACL.findUnique({
      where: {
        documentId_userId: {
          documentId: roomId,
          userId: userId,
        },
      },
      select: { permission: true },
    });

    if (!acl) {
      return null;
    }

    return acl.permission as RoomPermission;
  } catch (error) {
    console.error('Error getting user permission:', error);
    return null;
  }
}
