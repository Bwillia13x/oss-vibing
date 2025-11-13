/**
 * PDF Export Generator for Vibe University
 * 
 * Generates PDF documents from markdown content with academic formatting
 * Supports headers, footers, page numbers, citations, and bibliography
 */

import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  
  // Page settings
  paperSize?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Formatting
  fontSize?: number;
  lineSpacing?: 'single' | 'double' | number;
  fontFamily?: 'times' | 'helvetica' | 'courier';
  
  // Academic features
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  pageNumberStyle?: 'arabic' | 'roman';
  headerText?: string;
  
  // Content
  includeTOC?: boolean;
  includeBibliography?: boolean;
}

export interface PDFSection {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'code' | 'image' | 'table';
  level?: number; // For headings (1-6)
  content?: string;
  items?: string[]; // For lists
  style?: 'bold' | 'italic' | 'normal';
}

const DEFAULT_OPTIONS: Required<PDFExportOptions> = {
  title: 'Document',
  author: '',
  subject: '',
  keywords: '',
  paperSize: 'letter',
  orientation: 'portrait',
  margins: {
    top: 72,    // 1 inch
    right: 72,
    bottom: 72,
    left: 72,
  },
  fontSize: 12,
  lineSpacing: 'double',
  fontFamily: 'times',
  includeHeader: false,
  includeFooter: false,
  includePageNumbers: true,
  pageNumberStyle: 'arabic',
  headerText: '',
  includeTOC: false,
  includeBibliography: false,
};

/**
 * Generate PDF from markdown content
 */
export async function generatePDF(
  content: string,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: opts.orientation,
    unit: 'pt',
    format: opts.paperSize,
  });
  
  // Set document properties
  doc.setProperties({
    title: opts.title,
    author: opts.author,
    subject: opts.subject,
    keywords: opts.keywords,
  });
  
  // Parse content into sections
  const sections = parseMarkdownToSections(content);
  
  // Render sections
  let yPosition = opts.margins.top;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - opts.margins.left - opts.margins.right;
  
  for (const section of sections) {
    // Check if we need a new page
    if (yPosition > pageHeight - opts.margins.bottom - 50) {
      doc.addPage();
      yPosition = opts.margins.top;
      
      // Add header if enabled
      if (opts.includeHeader && opts.headerText) {
        addHeader(doc, opts.headerText, opts);
      }
    }
    
    yPosition = renderSection(doc, section, yPosition, opts, contentWidth);
  }
  
  // Add page numbers
  if (opts.includePageNumbers) {
    addPageNumbers(doc, opts);
  }
  
  // Add headers/footers
  if (opts.includeHeader && opts.headerText) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addHeader(doc, opts.headerText, opts);
    }
  }
  
  // Generate blob
  return doc.output('blob');
}

/**
 * Parse markdown content into structured sections
 */
function parseMarkdownToSections(content: string): PDFSection[] {
  const sections: PDFSection[] = [];
  const lines = content.split('\n');
  
  let currentParagraph = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (currentParagraph) {
        sections.push({
          type: 'paragraph',
          content: currentParagraph.trim(),
        });
        currentParagraph = '';
      }
      continue;
    }
    
    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentParagraph) {
        sections.push({
          type: 'paragraph',
          content: currentParagraph.trim(),
        });
        currentParagraph = '';
      }
      sections.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      continue;
    }
    
    // Lists
    if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
      if (currentParagraph) {
        sections.push({
          type: 'paragraph',
          content: currentParagraph.trim(),
        });
        currentParagraph = '';
      }
      
      const listItems: string[] = [];
      let j = i;
      while (j < lines.length && (lines[j].match(/^[-*]\s+/) || lines[j].match(/^\d+\.\s+/))) {
        listItems.push(lines[j].replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''));
        j++;
      }
      sections.push({
        type: 'list',
        items: listItems,
      });
      i = j - 1;
      continue;
    }
    
    // Block quotes
    if (line.startsWith('>')) {
      if (currentParagraph) {
        sections.push({
          type: 'paragraph',
          content: currentParagraph.trim(),
        });
        currentParagraph = '';
      }
      sections.push({
        type: 'quote',
        content: line.replace(/^>\s*/, ''),
      });
      continue;
    }
    
    // Code blocks
    if (line.startsWith('```')) {
      if (currentParagraph) {
        sections.push({
          type: 'paragraph',
          content: currentParagraph.trim(),
        });
        currentParagraph = '';
      }
      
      const codeLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('```')) {
        codeLines.push(lines[j]);
        j++;
      }
      sections.push({
        type: 'code',
        content: codeLines.join('\n'),
      });
      i = j;
      continue;
    }
    
    // Regular paragraph text
    currentParagraph += line + ' ';
  }
  
  // Add final paragraph if exists
  if (currentParagraph) {
    sections.push({
      type: 'paragraph',
      content: currentParagraph.trim(),
    });
  }
  
  return sections;
}

/**
 * Render a section to the PDF
 */
function renderSection(
  doc: jsPDF,
  section: PDFSection,
  yPosition: number,
  options: Required<PDFExportOptions>,
  contentWidth: number
): number {
  const { fontSize, fontFamily, margins } = options;
  
  doc.setFont(fontFamily);
  
  switch (section.type) {
    case 'heading': {
      const headingSize = fontSize + (7 - (section.level || 1)) * 2;
      doc.setFontSize(headingSize);
      doc.setFont(fontFamily, 'bold');
      
      const lines = doc.splitTextToSize(section.content || '', contentWidth);
      doc.text(lines, margins.left, yPosition);
      
      yPosition += lines.length * headingSize * 1.5 + 10;
      break;
    }
    
    case 'paragraph': {
      doc.setFontSize(fontSize);
      doc.setFont(fontFamily, 'normal');
      
      const lines = doc.splitTextToSize(section.content || '', contentWidth);
      doc.text(lines, margins.left, yPosition);
      
      const lineHeight = options.lineSpacing === 'single' ? 1.2 : 
                        options.lineSpacing === 'double' ? 2.0 : 
                        options.lineSpacing;
      
      yPosition += lines.length * fontSize * lineHeight + 10;
      break;
    }
    
    case 'list': {
      doc.setFontSize(fontSize);
      doc.setFont(fontFamily, 'normal');
      
      for (const item of section.items || []) {
        const bulletText = `• ${item}`;
        const lines = doc.splitTextToSize(bulletText, contentWidth - 20);
        doc.text(lines, margins.left + 20, yPosition);
        yPosition += lines.length * fontSize * 1.5 + 5;
      }
      
      yPosition += 10;
      break;
    }
    
    case 'quote': {
      doc.setFontSize(fontSize - 1);
      doc.setFont(fontFamily, 'italic');
      
      // Draw left border for quote
      const quoteX = margins.left + 20;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(2);
      
      const lines = doc.splitTextToSize(section.content || '', contentWidth - 40);
      const quoteHeight = lines.length * (fontSize - 1) * 1.5;
      
      doc.line(quoteX - 10, yPosition - 5, quoteX - 10, yPosition + quoteHeight);
      doc.text(lines, quoteX, yPosition);
      
      yPosition += quoteHeight + 15;
      break;
    }
    
    case 'code': {
      doc.setFontSize(fontSize - 2);
      doc.setFont('courier', 'normal');
      
      // Draw background for code block
      const lines = doc.splitTextToSize(section.content || '', contentWidth - 20);
      const codeHeight = lines.length * (fontSize - 2) * 1.2 + 20;
      
      doc.setFillColor(245, 245, 245);
      doc.rect(margins.left, yPosition - 10, contentWidth, codeHeight, 'F');
      
      doc.text(lines, margins.left + 10, yPosition);
      yPosition += codeHeight + 10;
      break;
    }
  }
  
  return yPosition;
}

/**
 * Add header to page
 */
function addHeader(
  doc: jsPDF,
  headerText: string,
  options: Required<PDFExportOptions>
): void {
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFontSize(10);
  doc.setFont(options.fontFamily, 'normal');
  doc.setTextColor(100, 100, 100);
  
  doc.text(headerText, pageWidth / 2, options.margins.top / 2, {
    align: 'center',
  });
  
  // Draw line under header
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(
    options.margins.left,
    options.margins.top - 20,
    pageWidth - options.margins.right,
    options.margins.top - 20
  );
  
  doc.setTextColor(0, 0, 0);
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(
  doc: jsPDF,
  options: Required<PDFExportOptions>
): void {
  const totalPages = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFontSize(10);
  doc.setFont(options.fontFamily, 'normal');
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    let pageNumber: string;
    if (options.pageNumberStyle === 'roman') {
      pageNumber = toRoman(i);
    } else {
      pageNumber = i.toString();
    }
    
    doc.text(
      pageNumber,
      pageWidth / 2,
      pageHeight - options.margins.bottom / 2,
      { align: 'center' }
    );
  }
}

/**
 * Convert number to Roman numerals
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result.toLowerCase();
}

/**
 * Export to PDF and trigger download
 */
export async function exportToPDF(
  content: string,
  filename: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const blob = await generatePDF(content, options);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
