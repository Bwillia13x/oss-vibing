/**
 * Room Management API - List and Create Rooms
 * 
 * Week 3-4: Room Management CRUD APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/collaboration/rooms
 * List all rooms accessible to the current user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get user from session
    const userId = 'current-user-id'; // Placeholder

    // Get all documents (rooms) owned by or shared with the user
    const rooms = await prisma.document.findMany({
      where: {
        userId, // Owner
      },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform to room format
    const formattedRooms = rooms.map((room) => ({
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
      isOwner: room.userId === userId,
      permission: room.userId === userId ? 'owner' : 'viewer',
    }));

    return NextResponse.json({
      rooms: formattedRooms,
      total: formattedRooms.length,
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collaboration/rooms
 * Create a new collaboration room
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type = 'NOTE', content = '' } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // TODO: Get user from session
    const userId = 'current-user-id'; // Placeholder

    // Create new document (room)
    const room = await prisma.document.create({
      data: {
        userId,
        title: name,
        type,
        content,
      },
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
      isOwner: true,
      permission: 'owner',
    };

    return NextResponse.json(formattedRoom, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
