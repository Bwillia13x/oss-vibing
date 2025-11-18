import { IntegrationConnection, IntegrationProvider } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import { ZoteroClient, ZoteroItem } from './zotero-client'
import { MendeleyClient, MendeleyDocument } from './mendeley-client'

interface NormalizedReference {
  title: string
  doi?: string
  url?: string
  year?: number
  journal?: string
  abstract?: string
  type?: string
  authors?: string[]
  metadata?: Record<string, unknown>
}

export interface ReferenceSyncResult {
  created: number
  updated: number
  total: number
}

export async function syncIntegrationReferences(
  connection: IntegrationConnection
): Promise<ReferenceSyncResult> {
  if (connection.provider === IntegrationProvider.ZOTERO) {
    return syncZoteroReferences(connection)
  }

  if (connection.provider === IntegrationProvider.MENDELEY) {
    return syncMendeleyReferences(connection)
  }

  throw new Error(`Unsupported integration provider: ${connection.provider}`)
}

async function syncZoteroReferences(
  connection: IntegrationConnection
): Promise<ReferenceSyncResult> {
  if (!connection.externalUserId) {
    throw new Error('Zotero external user ID missing from integration connection')
  }

  const client = new ZoteroClient({
    apiKey: connection.accessToken,
    userId: connection.externalUserId,
  })

  const items = await client.getItems({ limit: 500 })
  const references = items.map(mapZoteroItemToReference)
  return upsertReferences(connection.userId, references)
}

async function syncMendeleyReferences(
  connection: IntegrationConnection
): Promise<ReferenceSyncResult> {
  const client = new MendeleyClient({ accessToken: connection.accessToken })
  const documents = await client.getDocuments({ view: 'all', limit: 500 })
  const references = documents.map(mapMendeleyDocumentToReference)
  return upsertReferences(connection.userId, references)
}

async function upsertReferences(
  userId: string,
  references: NormalizedReference[]
): Promise<ReferenceSyncResult> {
  let created = 0
  let updated = 0

  for (const ref of references) {
    if (!ref.title) continue

    const existing = await prisma.reference.findFirst({
      where: {
        userId,
        ...(ref.doi ? { doi: ref.doi } : { title: ref.title }),
      },
    })

    const authorsJson = JSON.stringify(ref.authors ?? [])
    const metadataJson = ref.metadata ? JSON.stringify(ref.metadata) : undefined

    if (existing) {
      await prisma.reference.update({
        where: { id: existing.id },
        data: {
          title: ref.title,
          doi: ref.doi,
          url: ref.url,
          year: ref.year,
          journal: ref.journal,
          metadata: metadataJson ?? existing.metadata,
          authors: authorsJson,
        },
      })
      updated++
    } else {
      await prisma.reference.create({
        data: {
          userId,
          title: ref.title,
          doi: ref.doi,
          url: ref.url,
          year: ref.year,
          journal: ref.journal,
          type: ref.type ?? 'article-journal',
          metadata: metadataJson,
          authors: authorsJson,
        },
      })
      created++
    }
  }

  return {
    created,
    updated,
    total: references.length,
  }
}

function mapZoteroItemToReference(item: ZoteroItem): NormalizedReference {
  const year = parseYear(item.data.date)
  const authors = (item.data.creators || [])
    .map((creator) => {
      if (creator.name) return creator.name
      const parts = [creator.firstName, creator.lastName].filter(Boolean)
      return parts.length ? parts.join(' ') : undefined
    })
    .filter((name): name is string => Boolean(name))

  return {
    title: item.data.title,
    doi: item.data.DOI,
    url: item.data.url,
    year,
    journal: item.data.publicationTitle,
    abstract: item.data.abstractNote,
    type: item.data.itemType,
    authors,
    metadata: item.data as Record<string, unknown>,
  }
}

function mapMendeleyDocumentToReference(doc: MendeleyDocument): NormalizedReference {
  const authors = (doc.authors || [])
    .map((author) => {
      const parts = [author.first_name, author.last_name].filter(Boolean)
      return parts.length ? parts.join(' ') : undefined
    })
    .filter((name): name is string => Boolean(name))

  return {
    title: doc.title,
    doi: doc.identifiers?.doi,
    url: doc.websites?.[0],
    year: doc.year,
    journal: doc.source,
    abstract: doc.abstract,
    type: doc.type,
    authors,
    metadata: doc as unknown as Record<string, unknown>,
  }
}

function parseYear(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (!isNaN(parsed.getTime())) {
    return parsed.getFullYear()
  }

  const match = value.match(/\b(19|20)\d{2}\b/)
  return match ? parseInt(match[0], 10) : undefined
}
