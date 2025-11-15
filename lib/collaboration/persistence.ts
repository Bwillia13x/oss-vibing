/**
 * Persistence Layer for Collaborative Documents
 * 
 * Stores Yjs document updates in the database for persistence.
 * 
 * Phase 15 Implementation
 */

import { PrismaClient } from '@prisma/client';
import * as Y from 'yjs';

const prisma = new PrismaClient();

/**
 * Store document update in database
 */
export async function setPersistence(
  documentId: string,
  update: Uint8Array
): Promise<void> {
  try {
    // Check if document exists
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
      select: { yjsState: true },
    });

    if (existing && existing.yjsState) {
      // Merge with existing state
      const existingState = Buffer.from(existing.yjsState);
      const doc = new Y.Doc();
      Y.applyUpdate(doc, existingState);
      Y.applyUpdate(doc, update);
      const mergedState = Y.encodeStateAsUpdate(doc);

      await prisma.document.update({
        where: { id: documentId },
        data: {
          yjsState: Buffer.from(mergedState),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new or update without Yjs state
      await prisma.document.upsert({
        where: { id: documentId },
        update: {
          yjsState: Buffer.from(update),
          updatedAt: new Date(),
        },
        create: {
          id: documentId,
          userId: 'system', // Will be updated when user creates document
          title: 'Untitled Document',
          content: '',
          type: 'NOTE',
          yjsState: Buffer.from(update),
        },
      });
    }
  } catch (error) {
    console.error('Error persisting Yjs update:', error);
  }
}

/**
 * Load document state from database
 */
export async function getPersistence(documentId: string): Promise<Uint8Array | null> {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { yjsState: true },
    });

    if (document && document.yjsState) {
      return new Uint8Array(document.yjsState);
    }

    return null;
  } catch (error) {
    console.error('Error loading Yjs state:', error);
    return null;
  }
}

/**
 * Export Yjs document to JSON
 */
export async function exportYjsDocument(documentId: string): Promise<Record<string, any> | null> {
  try {
    const state = await getPersistence(documentId);
    if (!state) {
      return null;
    }

    const doc = new Y.Doc();
    Y.applyUpdate(doc, state);

    const json: Record<string, any> = {};
    doc.share.forEach((value, key) => {
      if (value instanceof Y.Text) {
        json[key] = value.toString();
      } else if (value instanceof Y.Array) {
        json[key] = value.toJSON();
      } else if (value instanceof Y.Map) {
        json[key] = value.toJSON();
      }
    });

    return json;
  } catch (error) {
    console.error('Error exporting Yjs document:', error);
    return null;
  }
}

/**
 * Import JSON into Yjs document
 */
export async function importYjsDocument(
  documentId: string,
  json: Record<string, any>
): Promise<void> {
  try {
    const doc = new Y.Doc();

    Object.entries(json).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const text = doc.getText(key);
        text.insert(0, value);
      } else if (Array.isArray(value)) {
        const array = doc.getArray(key);
        array.push(value);
      } else if (typeof value === 'object' && value !== null) {
        const map = doc.getMap(key);
        Object.entries(value).forEach(([k, v]) => {
          map.set(k, v);
        });
      }
    });

    const state = Y.encodeStateAsUpdate(doc);
    await setPersistence(documentId, state);
  } catch (error) {
    console.error('Error importing Yjs document:', error);
    throw error;
  }
}

/**
 * Clean up old Yjs states (called by retention cleanup job)
 */
export async function cleanupYjsStates(olderThanDays: number): Promise<number> {
  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - olderThanDays);

    const result = await prisma.document.updateMany({
      where: {
        updatedAt: {
          lte: threshold,
        },
        yjsState: {
          not: null,
        },
      },
      data: {
        yjsState: null,
      },
    });

    console.log(`Cleaned up ${result.count} old Yjs states`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up Yjs states:', error);
    return 0;
  }
}
