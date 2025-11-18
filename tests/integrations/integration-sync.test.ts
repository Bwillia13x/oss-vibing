/**
 * Integration Sync Tests
 *
 * Verifies that Zotero/Mendeley integration connections can sync
 * references into the local Reference table via syncIntegrationReferences.
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/db/client'
import { syncIntegrationReferences } from '@/lib/integrations/reference-sync'
import { IntegrationProvider } from '@prisma/client'

// Minimal mocks for Zotero and Mendeley clients used by reference-sync
vi.mock('@/lib/integrations/zotero-client', () => {
  class ZoteroClient {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_config: { apiKey: string; userId: string }) {}

    async getItems() {
      return [
        {
          key: 'z1',
          version: 1,
          data: {
            itemType: 'journalArticle',
            title: 'Zotero Synced Paper',
            creators: [
              { firstName: 'Ada', lastName: 'Lovelace', creatorType: 'author' },
            ],
            date: '2024-01-15',
            DOI: '10.1234/zotero-sync-test',
            url: 'https://example.org/zotero-sync',
            publicationTitle: 'Zotero Journal',
            pages: '1-10',
            abstractNote: 'Test abstract from Zotero.',
          },
        },
      ]
    }
  }

  return { ZoteroClient }
})

vi.mock('@/lib/integrations/mendeley-client', () => {
  class MendeleyClient {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_config: { accessToken: string }) {}

    async getDocuments() {
      return [
        {
          id: 'm1',
          title: 'Mendeley Synced Paper',
          type: 'journal',
          authors: [{ first_name: 'Grace', last_name: 'Hopper' }],
          year: 2023,
          identifiers: {
            doi: '10.5678/mendeley-sync-test',
          },
          source: 'Mendeley Journal',
          pages: '11-20',
          abstract: 'Test abstract from Mendeley.',
          websites: ['https://example.org/mendeley-sync'],
          created: new Date().toISOString(),
          last_modified: new Date().toISOString(),
        },
      ]
    }
  }

  return { MendeleyClient }
})

describe('Integration reference sync', () => {
  beforeEach(async () => {
    await prisma.reference.deleteMany()
    await prisma.integrationConnection.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.reference.deleteMany()
    await prisma.integrationConnection.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  it('syncs new references from Zotero into Reference table', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'zotero-sync@example.com',
        name: 'Zotero Sync User',
        role: 'USER',
      },
    })

    const connection = await prisma.integrationConnection.create({
      data: {
        userId: user.id,
        provider: IntegrationProvider.ZOTERO,
        accessToken: 'zotero-api-key',
        externalUserId: 'zotero-user-123',
      },
    })

    const result = await syncIntegrationReferences(connection)

    expect(result.created).toBe(1)
    expect(result.updated).toBe(0)

    const refs = await prisma.reference.findMany({ where: { userId: user.id } })
    expect(refs).toHaveLength(1)
    expect(refs[0].title).toBe('Zotero Synced Paper')
    expect(refs[0].doi).toBe('10.1234/zotero-sync-test')
  })

  it('updates existing Zotero reference when DOI matches', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'zotero-update@example.com',
        name: 'Zotero Update User',
        role: 'USER',
      },
    })

    const existing = await prisma.reference.create({
      data: {
        userId: user.id,
        title: 'Old Title',
        doi: '10.1234/zotero-sync-test',
        authors: JSON.stringify(['Someone Else']),
      },
    })

    const connection = await prisma.integrationConnection.create({
      data: {
        userId: user.id,
        provider: IntegrationProvider.ZOTERO,
        accessToken: 'zotero-api-key',
        externalUserId: 'zotero-user-123',
      },
    })

    const result = await syncIntegrationReferences(connection)

    expect(result.created).toBe(0)
    expect(result.updated).toBe(1)

    const updated = await prisma.reference.findUnique({ where: { id: existing.id } })
    expect(updated?.title).toBe('Zotero Synced Paper')
  })

  it('syncs new references from Mendeley into Reference table', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'mendeley-sync@example.com',
        name: 'Mendeley Sync User',
        role: 'USER',
      },
    })

    const connection = await prisma.integrationConnection.create({
      data: {
        userId: user.id,
        provider: IntegrationProvider.MENDELEY,
        accessToken: 'mendeley-access-token',
      },
    })

    const result = await syncIntegrationReferences(connection)

    expect(result.created).toBe(1)
    expect(result.updated).toBe(0)

    const refs = await prisma.reference.findMany({ where: { userId: user.id } })
    expect(refs).toHaveLength(1)
    expect(refs[0].title).toBe('Mendeley Synced Paper')
    expect(refs[0].doi).toBe('10.5678/mendeley-sync-test')
  })
})
