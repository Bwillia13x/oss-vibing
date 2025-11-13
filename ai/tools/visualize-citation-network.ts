import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './visualize-citation-network.md'
import z from 'zod/v3'
import { readFile, readdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface CitationNode {
  id: string
  title: string
  authors: string[]
  year: number
  citationCount: number
  type: 'paper' | 'reference'
}

interface CitationEdge {
  source: string
  target: string
  type: 'cites' | 'cited_by' | 'co-cited'
}

export const visualizeCitationNetwork = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      referenceFolder: z.string().describe('Path to folder containing reference files'),
      documentPath: z.string().optional().describe('Optional path to document with citations'),
      maxDepth: z.number().min(1).max(3).default(2).describe('Maximum depth of citation network to explore'),
      minCitations: z.number().min(0).default(2).describe('Minimum citation count to include in network'),
      outputPath: z.string().default('citation-network.json').describe('Path to save network visualization data'),
    }),
    execute: async ({ referenceFolder, documentPath, maxDepth, minCitations, outputPath }, { toolCallId }) => {
      try {
        const nodes: Map<string, CitationNode> = new Map()
        const edges: CitationEdge[] = []
        
        // Load references from folder
        const refPath = path.resolve(referenceFolder)
        if (!existsSync(refPath)) {
          throw new Error(`Reference folder not found: ${referenceFolder}`)
        }
        
        const files = await readdir(refPath)
        const referenceFiles = files.filter(f => f.endsWith('.json'))
        
        if (referenceFiles.length === 0) {
          throw new Error('No reference files found in folder')
        }
        
        // Load all references
        for (const file of referenceFiles) {
          const refContent = await readFile(path.join(refPath, file), 'utf-8')
          try {
            const ref = JSON.parse(refContent)
            const nodeId = ref.id || ref.DOI || ref.title || file
            
            nodes.set(nodeId, {
              id: nodeId,
              title: ref.title || 'Untitled',
              authors: ref.authors || [],
              year: ref.year || new Date().getFullYear(),
              citationCount: 0,
              type: 'reference',
            })
            
            // Extract citations if present
            if (ref.references && Array.isArray(ref.references)) {
              ref.references.forEach((citedRef: any) => {
                const citedId = citedRef.id || citedRef.DOI || citedRef.title
                if (citedId) {
                  edges.push({
                    source: nodeId,
                    target: citedId,
                    type: 'cites',
                  })
                  
                  // Add cited node if not already present
                  if (!nodes.has(citedId)) {
                    nodes.set(citedId, {
                      id: citedId,
                      title: citedRef.title || 'Untitled',
                      authors: citedRef.authors || [],
                      year: citedRef.year || 0,
                      citationCount: 0,
                      type: 'reference',
                    })
                  }
                }
              })
            }
          } catch (parseError) {
            console.warn(`Failed to parse reference file: ${file}`)
          }
        }
        
        // Load document citations if provided
        if (documentPath) {
          const docPath = path.resolve(documentPath)
          if (existsSync(docPath)) {
            const docContent = await readFile(docPath, 'utf-8')
            const docCitations = extractCitationsFromDocument(docContent)
            
            docCitations.forEach(citation => {
              const citedNode = findNodeByTitle(nodes, citation.title)
              if (citedNode) {
                edges.push({
                  source: 'document',
                  target: citedNode.id,
                  type: 'cites',
                })
              }
            })
            
            // Add document as a node
            nodes.set('document', {
              id: 'document',
              title: path.basename(documentPath),
              authors: [],
              year: new Date().getFullYear(),
              citationCount: 0,
              type: 'paper',
            })
          }
        }
        
        // Calculate citation counts
        edges.forEach(edge => {
          const targetNode = nodes.get(edge.target)
          if (targetNode) {
            targetNode.citationCount++
          }
        })
        
        // Filter nodes by minimum citation threshold
        const filteredNodes = Array.from(nodes.values()).filter(
          node => node.citationCount >= minCitations || node.type === 'paper'
        )
        
        // Identify co-citations
        const coCitationPairs = findCoCitations(edges, nodes)
        edges.push(...coCitationPairs)
        
        // Calculate network metrics
        const metrics = calculateNetworkMetrics(filteredNodes, edges)
        
        // Identify communities/clusters
        const communities = identifyCommunities(filteredNodes, edges)
        
        // Find influential papers
        const influentialPapers = findInfluentialPapers(filteredNodes, edges)
        
        // Prepare network data for visualization
        const networkData = {
          nodes: filteredNodes,
          edges: edges,
          metrics,
          communities,
          influentialPapers,
          metadata: {
            generatedAt: new Date().toISOString(),
            totalNodes: filteredNodes.length,
            totalEdges: edges.length,
            maxDepth,
            minCitations,
          },
        }
        
        // Save to file
        const outputFullPath = path.resolve(outputPath)
        await writeFile(outputFullPath, JSON.stringify(networkData, null, 2))
        
        // Generate response message
        const message = formatNetworkMessage(networkData, outputPath)
        
        return message
        
      } catch (error) {
        throw error
      }
    },
  })

// Helper functions

function extractCitationsFromDocument(content: string): Array<{ title: string; authors?: string[] }> {
  const citations: Array<{ title: string; authors?: string[] }> = []
  
  // Try to extract from JSON document
  try {
    const doc = JSON.parse(content)
    if (doc.references && Array.isArray(doc.references)) {
      return doc.references.map((ref: any) => ({
        title: ref.title,
        authors: ref.authors,
      }))
    }
  } catch {
    // Not JSON, try text extraction
  }
  
  // Extract from citation patterns in text
  // APA style: (Author, Year)
  const apaPattern = /\(([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?),?\s+\d{4}\)/g
  const apaMatches = content.match(apaPattern) || []
  
  apaMatches.forEach(match => {
    const authors = match.replace(/[()]/g, '').split(',')[0]
    citations.push({ title: authors, authors: [authors] })
  })
  
  return citations
}

function findNodeByTitle(nodes: Map<string, CitationNode>, title: string): CitationNode | undefined {
  for (const node of nodes.values()) {
    if (node.title.toLowerCase().includes(title.toLowerCase()) || 
        title.toLowerCase().includes(node.title.toLowerCase())) {
      return node
    }
  }
  return undefined
}

function findCoCitations(edges: CitationEdge[], nodes: Map<string, CitationNode>): CitationEdge[] {
  const coCitations: CitationEdge[] = []
  const citationPairs = new Map<string, Set<string>>()
  
  // Group papers by what they cite
  edges.forEach(edge => {
    if (edge.type === 'cites') {
      if (!citationPairs.has(edge.source)) {
        citationPairs.set(edge.source, new Set())
      }
      citationPairs.get(edge.source)!.add(edge.target)
    }
  })
  
  // Find papers that are frequently cited together
  const targetPairs = new Map<string, Set<string>>()
  citationPairs.forEach((targets, source) => {
    targets.forEach(target1 => {
      targets.forEach(target2 => {
        if (target1 !== target2) {
          const pairKey = [target1, target2].sort().join('|')
          if (!targetPairs.has(pairKey)) {
            targetPairs.set(pairKey, new Set())
          }
          targetPairs.get(pairKey)!.add(source)
        }
      })
    })
  })
  
  // Create co-citation edges for pairs cited together at least 2 times
  targetPairs.forEach((sources, pairKey) => {
    if (sources.size >= 2) {
      const [target1, target2] = pairKey.split('|')
      coCitations.push({
        source: target1,
        target: target2,
        type: 'co-cited',
      })
    }
  })
  
  return coCitations
}

function calculateNetworkMetrics(nodes: CitationNode[], edges: CitationEdge[]) {
  const totalNodes = nodes.length
  const totalEdges = edges.length
  
  // Calculate average degree (connections per node)
  const nodeConnections = new Map<string, number>()
  edges.forEach(edge => {
    nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1)
    nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1)
  })
  
  const degrees = Array.from(nodeConnections.values())
  const avgDegree = degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0
  const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0
  
  // Network density
  const maxPossibleEdges = totalNodes * (totalNodes - 1) / 2
  const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0
  
  // Most cited papers
  const citationCounts = nodes
    .filter(n => n.citationCount > 0)
    .sort((a, b) => b.citationCount - a.citationCount)
    .slice(0, 10)
  
  return {
    totalNodes,
    totalEdges,
    averageDegree: Math.round(avgDegree * 10) / 10,
    maxDegree,
    density: Math.round(density * 1000) / 1000,
    mostCited: citationCounts.map(n => ({
      title: n.title,
      citations: n.citationCount,
    })),
  }
}

function identifyCommunities(nodes: CitationNode[], edges: CitationEdge[]) {
  // Simple community detection based on connected components
  const visited = new Set<string>()
  const communities: Array<{ id: number; size: number; papers: string[] }> = []
  
  const adjacency = new Map<string, Set<string>>()
  edges.forEach(edge => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set())
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set())
    adjacency.get(edge.source)!.add(edge.target)
    adjacency.get(edge.target)!.add(edge.source)
  })
  
  function dfs(nodeId: string, community: Set<string>) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    community.add(nodeId)
    
    const neighbors = adjacency.get(nodeId)
    if (neighbors) {
      neighbors.forEach(neighbor => dfs(neighbor, community))
    }
  }
  
  let communityId = 1
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const community = new Set<string>()
      dfs(node.id, community)
      if (community.size > 1) {
        communities.push({
          id: communityId++,
          size: community.size,
          papers: Array.from(community),
        })
      }
    }
  })
  
  return communities.sort((a, b) => b.size - a.size).slice(0, 5) // Top 5 communities
}

function findInfluentialPapers(nodes: CitationNode[], edges: CitationEdge[]) {
  // Calculate influence based on multiple factors
  const influence = nodes.map(node => {
    const citationScore = node.citationCount * 10
    
    // Calculate how many papers this paper cites (breadth)
    const outgoingCitations = edges.filter(e => e.source === node.id && e.type === 'cites').length
    const breadthScore = outgoingCitations * 2
    
    // Recency bonus (more recent papers get slight boost)
    const currentYear = new Date().getFullYear()
    const recencyScore = Math.max(0, (currentYear - node.year) < 5 ? 5 : 0)
    
    const totalScore = citationScore + breadthScore + recencyScore
    
    return {
      id: node.id,
      title: node.title,
      authors: node.authors.slice(0, 3).join(', '),
      year: node.year,
      citationCount: node.citationCount,
      influenceScore: totalScore,
    }
  })
  
  return influence
    .filter(i => i.influenceScore > 0)
    .sort((a, b) => b.influenceScore - a.influenceScore)
    .slice(0, 10)
}

function formatNetworkMessage(data: any, outputPath: string): string {
  let message = `# Citation Network Analysis\n\n`
  
  message += `Network visualization data saved to: \`${outputPath}\`\n\n`
  
  message += `## Network Overview\n`
  message += `- **Total Papers:** ${data.metadata.totalNodes}\n`
  message += `- **Total Citations:** ${data.metadata.totalEdges}\n`
  message += `- **Average Connections:** ${data.metrics.averageDegree} per paper\n`
  message += `- **Network Density:** ${(data.metrics.density * 100).toFixed(1)}%\n`
  message += `- **Max Connections:** ${data.metrics.maxDegree}\n\n`
  
  if (data.metrics.mostCited.length > 0) {
    message += `## Most Cited Papers\n\n`
    data.metrics.mostCited.slice(0, 5).forEach((paper: any, index: number) => {
      message += `${index + 1}. **${paper.title}** (${paper.citations} citations)\n`
    })
    message += `\n`
  }
  
  if (data.influentialPapers.length > 0) {
    message += `## Most Influential Papers\n\n`
    message += `Based on citation count, breadth, and recency:\n\n`
    data.influentialPapers.slice(0, 5).forEach((paper: any, index: number) => {
      message += `${index + 1}. **${paper.title}** (${paper.year})\n`
      message += `   - Authors: ${paper.authors}\n`
      message += `   - Citations: ${paper.citationCount}\n`
      message += `   - Influence Score: ${paper.influenceScore}\n\n`
    })
  }
  
  if (data.communities.length > 0) {
    message += `## Research Communities\n\n`
    message += `Identified ${data.communities.length} research clusters:\n\n`
    data.communities.forEach((community: any, index: number) => {
      message += `**Community ${community.id}** (${community.size} papers)\n`
    })
    message += `\n`
  }
  
  message += `## Visualization Guide\n\n`
  message += `The network data includes:\n`
  message += `- **Nodes:** Papers/references with metadata\n`
  message += `- **Edges:** Citation relationships (cites, cited_by, co-cited)\n`
  message += `- **Communities:** Research clusters and subfields\n`
  message += `- **Metrics:** Quantitative network analysis\n\n`
  
  message += `You can visualize this network using tools like:\n`
  message += `- D3.js for web-based visualization\n`
  message += `- Gephi for advanced network analysis\n`
  message += `- Cytoscape for biological/citation networks\n`
  message += `- Python NetworkX for programmatic analysis\n`
  
  return message
}
