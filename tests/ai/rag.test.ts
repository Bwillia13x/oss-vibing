import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RAGService } from '@/lib/ai/rag'
import { embeddingService } from '@/lib/ai/embedding'

// Mock embedding service
vi.mock('@/lib/ai/embedding', () => ({
    embeddingService: {
        generateEmbedding: vi.fn(),
        findSimilarDocuments: vi.fn(),
        findSimilarReferences: vi.fn(),
    },
}))

describe('RAGService', () => {
    let ragService: RAGService

    beforeEach(() => {
        ragService = new RAGService()
        vi.clearAllMocks()
    })

    it('should retrieve and format context correctly', async () => {
        // Mock responses
        vi.mocked(embeddingService.generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3])
        vi.mocked(embeddingService.findSimilarDocuments).mockResolvedValue([
            { id: '1', title: 'Doc 1', content: 'Content of Doc 1', similarity: 0.9 },
        ])
        vi.mocked(embeddingService.findSimilarReferences).mockResolvedValue([
            { id: '2', title: 'Ref 1', metadata: '{"abstract": "Abstract of Ref 1"}', similarity: 0.8 },
        ])

        const context = await ragService.retrieveContext('test query')

        expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('test query')
        expect(embeddingService.findSimilarDocuments).toHaveBeenCalled()
        expect(embeddingService.findSimilarReferences).toHaveBeenCalled()

        expect(context).toContain('RELEVANT DOCUMENTS:')
        expect(context).toContain('[Document: Doc 1]')
        expect(context).toContain('Content of Doc 1')
        expect(context).toContain('RELEVANT REFERENCES:')
        expect(context).toContain('[Reference: Ref 1]')
        expect(context).toContain('Abstract of Ref 1')
    })

    it('should handle errors gracefully', async () => {
        vi.mocked(embeddingService.generateEmbedding).mockRejectedValue(new Error('Embedding failed'))

        const context = await ragService.retrieveContext('test query')

        expect(context).toBe('')
    })
})
