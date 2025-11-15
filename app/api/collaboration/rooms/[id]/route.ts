/**
 * Room Management API - Single Room Operations
 * 
 * Week 3-4: Room Management CRUD APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkRoomAccess, RoomPermission } from '@/lib/collaboration/acl';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/collaboration/rooms/[id]
 * Get details of a specific room
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check access
    const hasAccess = await checkRoomAccess(user.id, id, RoomPermission.VIEWER);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get room details
    const room = await prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Format response
    const formattedRoom = {
      id: room.id,
      name: room.title,
      type: room.type,
      content: room.content,
      owner: {
        id: room.userId,
        name: room.user.name || 'Unknown',
        email: room.user.email,
      },
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      isOwner: room.userId === user.id,
      permission: room.userId === user.id ? 'owner' : 'viewer',
    };

    return NextResponse.json(formattedRoom);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/collaboration/rooms/[id]
 * Update a room's details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, content } = body;

    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check access - need EDITOR permission to update
    const hasAccess = await checkRoomAccess(user.id, id, RoomPermission.EDITOR);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied - editor permission required' },
        { status: 403 }
      );
    }

    // Update room
    const updateData: any = {};
    if (name !== undefined) updateData.title = name;
    if (content !== undefined) updateData.content = content;

    const room = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Format response
    const formattedRoom = {
      id: room.id,
      name: room.title,
      type: room.type,
      owner: {
        id: room.userId,
        name: room.user.name || 'Unknown',
        email: room.user.email,
      },
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      isOwner: room.userId === user.id,
      permission: room.userId === user.id ? 'owner' : 'editor',
    };

    return NextResponse.json(formattedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collaboration/rooms/[id]
 * Delete a room (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get authenticated user
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check access - need OWNER permission to delete
    const hasAccess = await checkRoomAccess(user.id, id, RoomPermission.OWNER);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied - only owner can delete rooms' },
        { status: 403 }
      );
    }

    // Delete room
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Room deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}
