/**
 * Phase 8 AI Tools - Smoke Tests
 * 
 * Smoke tests for the 7 AI research assistant tools added in Phase 8:
 * 1. analyze-argument-structure
 * 2. evaluate-thesis-strength
 * 3. identify-research-gaps
 * 4. semantic-search-papers
 * 5. visualize-citation-network
 * 6. analyze-research-trends
 * 7. synthesize-literature-review
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { analyzeArgumentStructure } from '../ai/tools/analyze-argument-structure'
import { evaluateThesisStrength } from '../ai/tools/evaluate-thesis-strength'
import { identifyResearchGaps } from '../ai/tools/identify-research-gaps'
import { semanticSearchPapers } from '../ai/tools/semantic-search-papers'
import { visualizeCitationNetwork } from '../ai/tools/visualize-citation-network'
import { analyzeResearchTrends } from '../ai/tools/analyze-research-trends'
import { synthesizeLiteratureReview } from '../ai/tools/synthesize-literature-review'

// Mock writer for testing
const mockWriter = {
  write: () => {},
  writeDataPart: () => {},
} as any

// Test data directory
const TEST_DATA_DIR = path.join(process.cwd(), 'tests', 'test-data-ai-tools')
const TEST_DOC_PATH = path.join(TEST_DATA_DIR, 'sample-document.json')
const TEST_TEXT_PATH = path.join(TEST_DATA_DIR, 'sample-document.txt')

// Sample document content
const sampleDocument = {
  title: 'The Impact of Climate Change on Marine Ecosystems',
  sections: [
    {
      title: 'Introduction',
      content: 'Climate change poses a significant threat to marine ecosystems worldwide. This paper examines the various impacts of rising ocean temperatures on coral reefs and marine biodiversity.'
    },
    {
      title: 'Methods',
      content: 'We analyzed data from 50 coral reef sites across the Pacific Ocean over a 10-year period. Temperature measurements, biodiversity surveys, and coral bleaching assessments were conducted annually.'
    },
    {
      title: 'Results',
      content: 'Our findings show a 30% decline in coral coverage at sites experiencing temperature increases above 2°C. Marine biodiversity decreased by 25% in the most affected areas.'
    },
    {
      title: 'Conclusion',
      content: 'The evidence clearly demonstrates that ocean warming is causing significant harm to coral reef ecosystems. Immediate action is needed to mitigate climate change and protect these vital marine habitats.'
    }
  ],
  thesis: 'Rising ocean temperatures due to climate change are causing measurable and significant degradation of coral reef ecosystems, necessitating urgent conservation action.',
  references: [
    {
      id: '1',
      title: 'Global Coral Reef Monitoring Report 2023',
      authors: ['Smith, J.', 'Johnson, M.'],
      year: 2023,
      doi: '10.1000/example.001'
    },
    {
      id: '2',
      title: 'Ocean Temperature Trends in the Pacific',
      authors: ['Brown, A.', 'Davis, R.'],
      year: 2022,
      doi: '10.1000/example.002'
    }
  ]
}

describe('Phase 8 AI Tools - Smoke Tests', () => {
  beforeAll(async () => {
    // Create test data directory
    if (!existsSync(TEST_DATA_DIR)) {
      await mkdir(TEST_DATA_DIR, { recursive: true })
    }
    
    // Create test documents
    await writeFile(TEST_DOC_PATH, JSON.stringify(sampleDocument, null, 2))
    await writeFile(TEST_TEXT_PATH, sampleDocument.sections.map(s => s.content).join('\n\n'))
  })

  afterAll(async () => {
    // Clean up test files
    try {
      await unlink(TEST_DOC_PATH)
      await unlink(TEST_TEXT_PATH)
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('1. analyze-argument-structure', () => {
    it('should export the tool function', () => {
      expect(analyzeArgumentStructure).toBeDefined()
      expect(typeof analyzeArgumentStructure).toBe('function')
    })

    it('should create a tool instance', () => {
      const tool = analyzeArgumentStructure({ writer: mockWriter })
      
      expect(tool).toBeDefined()
      expect(typeof tool.execute).toBe('function')
    })

    it('should analyze a document successfully', async () => {
      const tool = analyzeArgumentStructure({ writer: mockWriter })
      
      const result = await tool.execute({
        documentPath: TEST_DOC_PATH,
        discipline: 'STEM',
        focusAreas: ['all']
      }, { toolCallId: 'test-call-1' } as any)
      
      // Tool executes and returns a result
      expect(result).toBeDefined()
    })
  })

  describe('2. evaluate-thesis-strength', () => {
    it('should export the tool function', () => {
      expect(evaluateThesisStrength).toBeDefined()
      expect(typeof evaluateThesisStrength).toBe('function')
    })

    it('should create a tool instance', () => {
      const tool = evaluateThesisStrength({ writer: mockWriter })
      
      expect(tool).toBeDefined()
      expect(typeof tool.execute).toBe('function')
    })

    it('should evaluate thesis from document', async () => {
      const tool = evaluateThesisStrength({ writer: mockWriter })
      
      const result = await tool.execute({
        documentPath: TEST_DOC_PATH,
        discipline: 'STEM',
        documentType: 'research-paper'
      }, { toolCallId: 'test-call-2' } as any)
      
      // Tool executes and returns a result
      expect(result).toBeDefined()
    })

    it('should evaluate explicit thesis statement', async () => {
      const tool = evaluateThesisStrength({ writer: mockWriter })
      
      const result = await tool.execute({
        documentPath: TEST_DOC_PATH,
        thesisStatement: 'Climate change significantly impacts marine ecosystems.',
        discipline: 'STEM',
        documentType: 'research-paper'
      }, { toolCallId: 'test-call-3' } as any)
      
      // Tool executes and returns a result
      expect(result).toBeDefined()
    })
  })

  describe('3. identify-research-gaps', () => {
    it('should export the tool function', () => {
      expect(identifyResearchGaps).toBeDefined()
      expect(typeof identifyResearchGaps).toBe('function')
    })

    it('should create a tool instance', () => {
      const tool = identifyResearchGaps({ writer: mockWriter })
      
      expect(tool).toBeDefined()
      expect(typeof tool.execute).toBe('function')
    })

    it('should identify research gaps in a topic', async () => {
      const tool = identifyResearchGaps({ writer: mockWriter })
      
      const result = await tool.execute({
        topic: 'Climate change impacts on coral reefs',
        discipline: 'Environmental Science',
        existingLiteraturePath: TEST_DOC_PATH
      }, { toolCallId: 'test-call-4' } as any)
      
      // Tool executes and returns a result
      expect(result).toBeDefined()
    })
  })

  describe('4. semantic-search-papers', () => {
    it('should export the tool function', () => {
      expect(semanticSearchPapers).toBeDefined()
      expect(typeof semanticSearchPapers).toBe('function')
    })

    it('should create a tool instance', () => {
      const tool = semanticSearchPapers({ writer: mockWriter })
      
      expect(tool).toBeDefined()
      expect(typeof tool.execute).toBe('function')
    })

    it('should handle query without reference folder gracefully', async () => {
      const tool = semanticSearchPapers({ writer: mockWriter })
      
      // This should fail gracefully when no reference folder exists
      await expect(
        tool.execute({
          query: 'coral reef climate change',
          maxResults: 5,
          yearRange: { start: 2020, end: 2024 },
          outputPath: path.join(TEST_DATA_DIR, 'search-results.json'),
          referenceFolder: '/nonexistent/folder'
        }, { toolCallId: 'test-call-5' } as any)
      ).rejects.toThrow()
    })
  })

  describe('5. visualize-citation-network', () => {
    it('should export the tool function', () => {
      expect(visualizeCitationNetwork).toBeDefined()
      expect(typeof visualizeCitationNetwork).toBe('function')
    })

    it('should create a tool instance', () => {
      const tool = visualizeCitationNetwork({ writer: mockWriter })
      
      expect(tool).toBeDefined()
      expect(typeof tool.execute).toBe('function')
    })

    it('should handle document analysis with output path', async () => {
      const tool = visualizeCitationNetwork({ writer: mockWriter })
      
      // Test that tool handles path parameter appropriately
      await expect(
        tool.execute({
          documentPath: TEST_DOC_PATH,
          depth: 1,
          layoutAlgorithm: 'force-directed',
          outputPath: '/nonexistent/output.json'
        }, { toolCallId: 'test-call-6' } as any)
      ).rejects.toThrow()
    })
  })

  describe('6. analyze-research-trends', () => {
    it('should export the tool function', () => {
      expect(analyzeResearchTrends).toBeDefined()
      expect(typeof analyzeResearchTrends).toBe('function')
    })

    it('should create a tool instance', () => {
      const tool = analyzeResearchTrends({ writer: mockWriter })
      
      expect(tool).toBeDefined()
      expect(typeof tool.execute).toBe('function')
    })

    it('should handle trends analysis with output path', async () => {
      const tool = analyzeResearchTrends({ writer: mockWriter })
      
      // Test that tool handles path parameter appropriately
      await expect(
        tool.execute({
          topic: 'coral reef conservation',
          timeRange: { start: 2020, end: 2024 },
          disciplines: ['Environmental Science', 'Marine Biology'],
          outputPath: '/nonexistent/trends.json'
        }, { toolCallId: 'test-call-7' } as any)
      ).rejects.toThrow()
    })
  })

  describe('7. synthesize-literature-review', () => {
    it('should export the tool function', () => {
      expect(synthesizeLiteratureReview).toBeDefined()
      expect(typeof synthesizeLiteratureReview).toBe('function')
    })

    it('should create a tool instance', () => {
      const tool = synthesizeLiteratureReview({ writer: mockWriter })
      
      expect(tool).toBeDefined()
      expect(typeof tool.execute).toBe('function')
    })

    it('should handle synthesis with output path', async () => {
      const tool = synthesizeLiteratureReview({ writer: mockWriter })
      
      // Test that tool handles path parameter appropriately
      await expect(
        tool.execute({
          topic: 'Climate change impacts on marine ecosystems',
          sourcesPath: TEST_DOC_PATH,
          synthesisType: 'thematic',
          includeGapAnalysis: true,
          outputPath: '/nonexistent/review.json'
        }, { toolCallId: 'test-call-8' } as any)
      ).rejects.toThrow()
    })
  })

  describe('Research Assistant Dashboard Integration', () => {
    it('should verify all tools are exported', () => {
      const tools = [
        analyzeArgumentStructure,
        evaluateThesisStrength,
        identifyResearchGaps,
        semanticSearchPapers,
        visualizeCitationNetwork,
        analyzeResearchTrends,
        synthesizeLiteratureReview
      ]
      
      tools.forEach(tool => {
        expect(tool).toBeDefined()
        expect(typeof tool).toBe('function')
      })
    })

    it('should verify tools can be instantiated with writer', () => {
      const tools = [
        analyzeArgumentStructure({ writer: mockWriter }),
        evaluateThesisStrength({ writer: mockWriter }),
        identifyResearchGaps({ writer: mockWriter }),
        semanticSearchPapers({ writer: mockWriter }),
        visualizeCitationNetwork({ writer: mockWriter }),
        analyzeResearchTrends({ writer: mockWriter }),
        synthesizeLiteratureReview({ writer: mockWriter })
      ]
      
      tools.forEach(tool => {
        expect(tool).toBeDefined()
        expect(typeof tool.execute).toBe('function')
      })
    })
  })
})
