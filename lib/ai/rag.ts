import { embeddingService } from './embedding'

export class RAGService {
    /**
     * Retrieve relevant context from documents and references for a given query.
     */
    async retrieveContext(query: string): Promise<string> {
        try {
            // 1. Generate embedding for the query
            const vector = await embeddingService.generateEmbedding(query)

            // 2. Search for similar content in parallel
            const [documents, references] = await Promise.all([
                embeddingService.findSimilarDocuments(vector, 3),
                embeddingService.findSimilarReferences(vector, 3)
            ])

            // 3. Format the context
            let context = ''

            if (documents.length > 0) {
                context += 'RELEVANT DOCUMENTS:\n'
                documents.forEach(doc => {
                    context += `[Document: ${doc.title}]\n${doc.content.substring(0, 500)}...\n\n`
                })
            }

            if (references.length > 0) {
                context += 'RELEVANT REFERENCES:\n'
                references.forEach(ref => {
                    try {
                        const meta = JSON.parse(ref.metadata)
                        const snippet = meta.abstract || meta.title
                        context += `[Reference: ${ref.title}]\n${snippet}\n\n`
                    } catch (e) {
                        context += `[Reference: ${ref.title}]\n(Metadata parse error)\n\n`
                    }
                })
            }

            return context
        } catch (error) {
            console.error('Error retrieving context:', error)
            return '' // Fail gracefully by returning empty context
        }
    }
}

export const ragService = new RAGService()
