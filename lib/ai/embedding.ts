import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { prisma } from '@/lib/db/client'

export class EmbeddingService {
    private model = openai.embedding('text-embedding-3-small')

    /**
     * Generate an embedding for a given text.
     */
    async generateEmbedding(text: string): Promise<number[]> {
        const { embedding } = await embed({
            model: this.model,
            value: text.replace(/\n/g, ' '),
        })
        return embedding
    }

    /**
     * Find similar documents by vector similarity.
     */
    async findSimilarDocuments(vector: number[], limit: number = 5) {
        // Use raw SQL for vector similarity search
        // The <=> operator is cosine distance in pgvector
        const documents = await prisma.$queryRaw`
      SELECT id, title, content, 1 - (embedding <=> ${vector}::vector) as similarity
      FROM "Document"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit};
    `
        return documents as Array<{ id: string; title: string; content: string; similarity: number }>
    }

    /**
     * Find similar references by vector similarity.
     */
    async findSimilarReferences(vector: number[], limit: number = 5) {
        const references = await prisma.$queryRaw`
      SELECT id, title, metadata, 1 - (embedding <=> ${vector}::vector) as similarity
      FROM "Reference"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit};
    `
        return references as Array<{ id: string; title: string; metadata: string; similarity: number }>
    }
}

export const embeddingService = new EmbeddingService()
