/**
 * Unit Tests for Export System
 * Tests PDF, DOCX, PPTX, and XLSX generators
 */

import { describe, it, expect, vi } from 'vitest';
import {
  generatePDF,
  exportToPDF,
  type PDFExportOptions,
} from '@/lib/export/pdf-generator';
import {
  generateDOCX,
  exportToDOCX,
  type DOCXExportOptions,
} from '@/lib/export/docx-generator';
import {
  generatePPTX,
  parseMarkdownToSlides,
  type PPTXSlide,
  type PPTXExportOptions,
} from '@/lib/export/pptx-generator';
import {
  generateXLSX,
  objectsToSheetData,
  createStatisticalSheet,
  createChartDataSheet,
  type XLSXSheet,
} from '@/lib/export/xlsx-generator';
import {
  exportDocument,
  validateExportConfig,
  getFileExtension,
  getMimeType,
  formatFileSize,
} from '@/lib/export';

describe('PDF Generator', () => {
  const testContent = `# Test Document

This is a test paragraph with **bold** and *italic* text.

## Section 1

- Bullet point 1
- Bullet point 2
- Bullet point 3

## Section 2

> This is a block quote

\`\`\`javascript
console.log('Code block');
\`\`\`
`;

  it('should generate PDF blob from markdown', async () => {
    const blob = await generatePDF(testContent);
    
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should apply custom PDF options', async () => {
    const options: PDFExportOptions = {
      title: 'Test Document',
      author: 'Test Author',
      fontSize: 14,
      lineSpacing: 'double',
      includePageNumbers: true,
    };
    
    const blob = await generatePDF(testContent, options);
    
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should handle empty content gracefully', async () => {
    const blob = await generatePDF('');
    
    expect(blob).toBeInstanceOf(Blob);
  });

  it('should parse markdown headings correctly', async () => {
    const content = '# Heading 1\n## Heading 2\n### Heading 3';
    const blob = await generatePDF(content);
    
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('DOCX Generator', () => {
  const testContent = `# Research Paper

## Abstract

This is the abstract of the research paper.

## Introduction

This section introduces the topic with **important** points.

## Methods

1. First method
2. Second method
3. Third method

## Results

The results show significant findings.
`;

  it('should generate DOCX blob from markdown', async () => {
    const blob = await generateDOCX(testContent);
    
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should include title page when requested', async () => {
    const options: DOCXExportOptions = {
      title: 'Research Paper',
      author: 'John Doe',
      includeTitlePage: true,
    };
    
    const blob = await generateDOCX(testContent, options);
    
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should include abstract when provided', async () => {
    const options: DOCXExportOptions = {
      includeAbstract: true,
      abstractText: 'This is the abstract text.',
    };
    
    const blob = await generateDOCX(testContent, options);
    
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should handle inline formatting', async () => {
    const content = 'This is **bold**, *italic*, and `code`.';
    const blob = await generateDOCX(content);
    
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('PPTX Generator', () => {
  const testSlides: PPTXSlide[] = [
    {
      type: 'title',
      title: 'Test Presentation',
      subtitle: 'A test presentation',
    },
    {
      type: 'content',
      title: 'Slide 1',
      content: ['Point 1', 'Point 2', 'Point 3'],
    },
    {
      type: 'two-column',
      title: 'Comparison',
      leftContent: ['Left 1', 'Left 2'],
      rightContent: ['Right 1', 'Right 2'],
    },
  ];

  it('should generate PPTX blob from slides', async () => {
    const blob = await generatePPTX(testSlides);
    
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should parse markdown to slides', () => {
    const markdown = `# Main Title

## Slide 1

- Point 1
- Point 2

## Slide 2

- Point A
- Point B
`;
    
    const slides = parseMarkdownToSlides(markdown);
    
    expect(slides).toHaveLength(2);
    expect(slides[0].title).toBe('Slide 1');
    expect(slides[0].content).toContain('Point 1');
  });

  it('should include speaker notes when enabled', async () => {
    const slidesWithNotes: PPTXSlide[] = [
      {
        type: 'content',
        title: 'Slide with Notes',
        content: ['Content'],
        speakerNotes: 'These are speaker notes',
      },
    ];
    
    const blob = await generatePPTX(slidesWithNotes, {
      includeSpeakerNotes: true,
    });
    
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('XLSX Generator', () => {
  const testSheets: XLSXSheet[] = [
    {
      name: 'Test Data',
      headers: ['Name', 'Age', 'Score'],
      data: [
        ['Alice', 25, 95],
        ['Bob', 30, 87],
        ['Charlie', 28, 92],
      ],
    },
  ];

  it('should generate XLSX blob from sheets', async () => {
    const blob = await generateXLSX(testSheets);
    
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should convert objects to sheet data', () => {
    const objects = [
      { name: 'Alice', age: 25, score: 95 },
      { name: 'Bob', age: 30, score: 87 },
    ];
    
    const { headers, data } = objectsToSheetData(objects);
    
    expect(headers).toEqual(['name', 'age', 'score']);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual(['Alice', 25, 95]);
  });

  it('should create statistical sheet', () => {
    const stats = {
      mean: 10,
      median: 9,
      mode: 8,
      stdDev: 2.5,
      variance: 6.25,
      min: 5,
      max: 15,
      count: 10,
    };
    
    const sheet = createStatisticalSheet([5, 8, 9, 10, 12, 15], stats);
    
    expect(sheet.name).toBe('Statistics');
    expect(sheet.data).toBeDefined();
    expect(sheet.data.length).toBeGreaterThan(0);
  });

  it('should create chart data sheet', () => {
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    const datasets = [
      { name: '2023', data: [10, 20, 30, 40] },
      { name: '2024', data: [15, 25, 35, 45] },
    ];
    
    const sheet = createChartDataSheet(labels, datasets);
    
    expect(sheet.name).toBe('Chart Data');
    expect(sheet.headers).toEqual(['Label', '2023', '2024']);
    expect(sheet.data).toHaveLength(4);
  });

  it('should apply formulas to cells', async () => {
    const sheetWithFormulas: XLSXSheet[] = [
      {
        name: 'Calculations',
        data: [[10, 20], [30, 40]],
        formulas: {
          'C1': 'A1+B1',
          'C2': 'A2+B2',
        },
      },
    ];
    
    const blob = await generateXLSX(sheetWithFormulas);
    
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('Export API', () => {
  it('should validate export config', () => {
    const validConfig = {
      format: 'pdf' as const,
      filename: 'test.pdf',
      content: 'Test content',
    };
    
    const result = validateExportConfig(validConfig);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid config', () => {
    const invalidConfig = {
      format: 'pdf' as const,
      filename: 'test.pdf',
      // Missing content
    };
    
    const result = validateExportConfig(invalidConfig);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should get correct file extension', () => {
    expect(getFileExtension('pdf')).toBe('.pdf');
    expect(getFileExtension('docx')).toBe('.docx');
    expect(getFileExtension('pptx')).toBe('.pptx');
    expect(getFileExtension('xlsx')).toBe('.xlsx');
  });

  it('should get correct MIME type', () => {
    expect(getMimeType('pdf')).toBe('application/pdf');
    expect(getMimeType('docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(getMimeType('pptx')).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    expect(getMimeType('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('should format file size correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});
