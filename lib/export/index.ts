/**
 * Unified Export API for Vibe University
 * 
 * Provides a single interface for exporting content to multiple formats
 */

export * from './pdf-generator';
export * from './docx-generator';
export * from './pptx-generator';
export * from './xlsx-generator';

import { exportToPDF, type PDFExportOptions } from './pdf-generator';
import { exportToDOCX, type DOCXExportOptions } from './docx-generator';
import { exportToPPTX, type PPTXExportOptions, type PPTXSlide } from './pptx-generator';
import { exportToXLSX, type XLSXExportOptions, type XLSXSheet } from './xlsx-generator';

export type ExportFormat = 'pdf' | 'docx' | 'pptx' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  content?: string; // For PDF and DOCX
  slides?: PPTXSlide[]; // For PPTX
  sheets?: XLSXSheet[]; // For XLSX
  options?: PDFExportOptions | DOCXExportOptions | PPTXExportOptions | XLSXExportOptions;
}

/**
 * Universal export function
 * Detects format and exports accordingly
 */
export async function exportDocument(config: ExportOptions): Promise<void> {
  const { format, filename, content, slides, sheets, options } = config;
  
  switch (format) {
    case 'pdf':
      if (!content) {
        throw new Error('Content is required for PDF export');
      }
      await exportToPDF(content, filename, options as PDFExportOptions);
      break;
      
    case 'docx':
      if (!content) {
        throw new Error('Content is required for DOCX export');
      }
      await exportToDOCX(content, filename, options as DOCXExportOptions);
      break;
      
    case 'pptx':
      if (!slides) {
        throw new Error('Slides are required for PPTX export');
      }
      await exportToPPTX(slides, filename, options as PPTXExportOptions);
      break;
      
    case 'xlsx':
      if (!sheets) {
        throw new Error('Sheets are required for XLSX export');
      }
      await exportToXLSX(sheets, filename, options as XLSXExportOptions);
      break;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Quick export markdown to PDF
 */
export async function quickExportPDF(
  content: string,
  filename: string
): Promise<void> {
  await exportToPDF(content, filename, {
    fontSize: 12,
    lineSpacing: 'double',
    includePageNumbers: true,
  });
}

/**
 * Quick export markdown to DOCX
 */
export async function quickExportDOCX(
  content: string,
  filename: string
): Promise<void> {
  await exportToDOCX(content, filename, {
    fontSize: 12,
    lineSpacing: 2.0,
  });
}

/**
 * Quick export markdown to PPTX
 * Automatically parses markdown into slides
 */
export async function quickExportPPTX(
  content: string,
  filename: string
): Promise<void> {
  const slides = parseMarkdownToSlides(content);
  await exportToPPTX(slides, filename, {
    includeTitleSlide: true,
  });
}

/**
 * Export research paper with academic formatting
 */
export async function exportResearchPaper(
  content: string,
  filename: string,
  format: 'pdf' | 'docx',
  metadata: {
    title: string;
    author: string;
    abstract?: string;
  }
): Promise<void> {
  if (format === 'pdf') {
    await exportToPDF(content, filename, {
      title: metadata.title,
      author: metadata.author,
      fontSize: 12,
      lineSpacing: 'double',
      fontFamily: 'times',
      includePageNumbers: true,
      pageNumberStyle: 'arabic',
      includeTOC: true,
      includeBibliography: true,
    });
  } else {
    await exportToDOCX(content, filename, {
      title: metadata.title,
      author: metadata.author,
      abstractText: metadata.abstract,
      fontSize: 12,
      lineSpacing: 2.0,
      fontFamily: 'Times New Roman',
      includeTitlePage: true,
      includeAbstract: !!metadata.abstract,
      includeTOC: true,
      includeBibliography: true,
    });
  }
}

/**
 * Get available export formats for content type
 */
export function getAvailableFormats(contentType: 'document' | 'presentation' | 'spreadsheet'): ExportFormat[] {
  switch (contentType) {
    case 'document':
      return ['pdf', 'docx'];
    case 'presentation':
      return ['pptx', 'pdf'];
    case 'spreadsheet':
      return ['xlsx'];
    default:
      return ['pdf', 'docx', 'pptx', 'xlsx'];
  }
}

/**
 * Validate export configuration
 */
export function validateExportConfig(config: ExportOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!config.filename) {
    errors.push('Filename is required');
  }
  
  if (!config.format) {
    errors.push('Format is required');
  }
  
  if (config.format === 'pdf' || config.format === 'docx') {
    if (!config.content) {
      errors.push(`Content is required for ${config.format.toUpperCase()} export`);
    }
  }
  
  if (config.format === 'pptx') {
    if (!config.slides || config.slides.length === 0) {
      errors.push('At least one slide is required for PPTX export');
    }
  }
  
  if (config.format === 'xlsx') {
    if (!config.sheets || config.sheets.length === 0) {
      errors.push('At least one sheet is required for XLSX export');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    pdf: '.pdf',
    docx: '.docx',
    pptx: '.pptx',
    xlsx: '.xlsx',
  };
  
  return extensions[format] || '.txt';
}

/**
 * Get MIME type for format
 */
export function getMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  
  return mimeTypes[format] || 'application/octet-stream';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
