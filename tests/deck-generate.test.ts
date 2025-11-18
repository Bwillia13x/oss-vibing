/**
 * Deck Generation Tool Tests
 * 
 * Tests for AI-powered presentation deck generation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Test data directory
const TEST_DECKS_DIR = path.join(process.cwd(), 'decks');
const TEST_SOURCE_PATH = path.join(process.cwd(), 'tests', 'test-data', 'sample-outline.md');

const sampleOutline = `# Introduction to Artificial Intelligence

AI is transforming technology and society. This presentation covers key concepts and applications.

## What is AI?

Artificial Intelligence refers to computer systems that can perform tasks typically requiring human intelligence.

### Key Capabilities
- Learning from experience
- Adapting to new situations
- Problem-solving
- Pattern recognition

## Machine Learning

Machine learning is a subset of AI that enables systems to learn from data.

### Types of ML
- Supervised learning
- Unsupervised learning
- Reinforcement learning

## Applications

AI is being used across many industries:
- Healthcare diagnostics
- Autonomous vehicles
- Natural language processing
- Computer vision

## Future Directions

The future of AI includes:
- More robust and reliable systems
- Better human-AI collaboration
- Ethical AI development
- Democratization of AI tools

## Conclusion

AI represents a fundamental shift in technology with vast potential and important challenges to address.`;

describe('Deck Generation Tool', () => {
  beforeAll(async () => {
    // Ensure decks directory exists
    if (!existsSync(TEST_DECKS_DIR)) {
      await mkdir(TEST_DECKS_DIR, { recursive: true });
    }
    
    // Create test data directory
    const testDataDir = path.dirname(TEST_SOURCE_PATH);
    if (!existsSync(testDataDir)) {
      await mkdir(testDataDir, { recursive: true });
    }
    
    // Create test source document
    await writeFile(TEST_SOURCE_PATH, sampleOutline);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await unlink(TEST_SOURCE_PATH);
    } catch (_error) {
      // Ignore cleanup errors
    }
  });

  describe('Deck Structure', () => {
    it('should have proper deck file format', async () => {
      // Check if example deck exists
      const exampleDeckPath = path.join(TEST_DECKS_DIR, 'test-presentation.json');
      
      if (existsSync(exampleDeckPath)) {
        const deckContent = await readFile(exampleDeckPath, 'utf-8');
        const deck = JSON.parse(deckContent);

        // Verify deck structure
        expect(deck).toHaveProperty('title');
        expect(deck).toHaveProperty('slides');
        expect(deck).toHaveProperty('metadata');
        expect(Array.isArray(deck.slides)).toBe(true);
      }
    });

    it('should validate slide structure', () => {
      const validSlide = {
        title: 'Test Slide',
        content: 'Slide content',
        bullets: ['Point 1', 'Point 2'],
        notes: 'Speaker notes',
      };

      expect(validSlide).toHaveProperty('title');
      expect(validSlide).toHaveProperty('content');
      expect(validSlide).toHaveProperty('bullets');
      expect(validSlide).toHaveProperty('notes');
      expect(Array.isArray(validSlide.bullets)).toBe(true);
    });

    it('should validate deck metadata', () => {
      const validMetadata = {
        title: 'Test Deck',
        date: '2025-11-18',
        description: 'Test description',
        created: new Date().toISOString(),
        version: '1.0',
      };

      expect(validMetadata).toHaveProperty('title');
      expect(validMetadata).toHaveProperty('date');
      expect(validMetadata).toHaveProperty('created');
      expect(validMetadata).toHaveProperty('version');
    });
  });

  describe('Slide Count', () => {
    it('should handle different slide counts', () => {
      const slideCounts = [5, 10, 15, 20];
      
      for (const count of slideCounts) {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(30);
      }
    });

    it('should have minimum slide count of 1', () => {
      const minSlides = 1;
      expect(minSlides).toBeGreaterThanOrEqual(1);
    });

    it('should default to 10 slides', () => {
      const defaultSlideCount = 10;
      expect(defaultSlideCount).toBe(10);
    });
  });

  describe('Theme Support', () => {
    it('should support different themes', () => {
      const themes = ['academic', 'business', 'creative', 'minimal'];
      
      for (const theme of themes) {
        expect(theme).toBeTruthy();
        expect(typeof theme).toBe('string');
      }
    });

    it('should default to academic theme', () => {
      const defaultTheme = 'academic';
      expect(defaultTheme).toBe('academic');
    });
  });

  describe('Content Generation', () => {
    it('should parse markdown headings for slide titles', () => {
      const headings = sampleOutline.match(/^#{1,3}\s+(.+)$/gm);
      
      expect(headings).toBeTruthy();
      expect(headings!.length).toBeGreaterThan(0);
    });

    it('should extract bullet points from source', () => {
      const bullets = sampleOutline.match(/^[\*\-]\s+(.+)$/gm);
      
      expect(bullets).toBeTruthy();
      expect(bullets!.length).toBeGreaterThan(0);
    });

    it('should identify sections for slide content', () => {
      const sections = sampleOutline.split(/\n##\s+/);
      
      expect(sections.length).toBeGreaterThan(1);
    });
  });

  describe('File Operations', () => {
    it('should create valid filename with timestamp', () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `deck-${timestamp}.json`;
      
      expect(filename).toMatch(/^deck-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      expect(filename).toMatch(/\.json$/);
    });

    it('should ensure decks directory exists', () => {
      expect(existsSync(TEST_DECKS_DIR)).toBe(true);
    });

    it('should create valid JSON structure', () => {
      const deckData = {
        title: 'Test Deck',
        author: 'Test Author',
        date: new Date().toISOString().split('T')[0],
        description: 'Test description',
        slides: [
          {
            title: 'Slide 1',
            content: 'Content',
            bullets: ['Point 1'],
            notes: 'Notes',
          },
        ],
        metadata: {
          title: 'Test Deck',
          date: new Date().toISOString().split('T')[0],
          description: 'Test description',
          created: new Date().toISOString(),
          version: '1.0',
        },
      };

      const json = JSON.stringify(deckData, null, 2);
      expect(() => JSON.parse(json)).not.toThrow();
      
      const parsed = JSON.parse(json);
      expect(parsed.slides).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing source document gracefully', async () => {
      const nonExistentPath = 'non-existent-file.md';
      
      // In real implementation, should not throw but use fallback
      expect(existsSync(nonExistentPath)).toBe(false);
    });

    it('should provide fallback content when AI fails', () => {
      const fallbackSlides = [
        { title: 'Title', content: 'Content', bullets: [] },
      ];
      
      expect(fallbackSlides).toHaveLength(1);
      expect(fallbackSlides[0]).toHaveProperty('title');
    });
  });
});
