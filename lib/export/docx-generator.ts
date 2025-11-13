/**
 * DOCX Export Generator for Vibe University
 * 
 * Generates Microsoft Word documents from markdown content
 * Supports academic formatting, citations, and bibliography
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TableOfContents,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
  ImageRun,
} from 'docx';

export interface DOCXExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  
  // Formatting
  fontSize?: number;
  fontFamily?: string;
  lineSpacing?: number;
  
  // Academic features
  includeTitlePage?: boolean;
  includeAbstract?: boolean;
  abstractText?: string;
  includeTOC?: boolean;
  includeBibliography?: boolean;
  
  // Page setup
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const DEFAULT_OPTIONS: Required<DOCXExportOptions> = {
  title: 'Document',
  author: '',
  subject: '',
  keywords: '',
  fontSize: 12,
  fontFamily: 'Times New Roman',
  lineSpacing: 2.0,
  includeTitlePage: false,
  includeAbstract: false,
  abstractText: '',
  includeTOC: false,
  includeBibliography: false,
  margins: {
    top: 1440,    // 1 inch in twips (1/1440 inch)
    right: 1440,
    bottom: 1440,
    left: 1440,
  },
};

/**
 * Generate DOCX from markdown content
 */
export async function generateDOCX(
  content: string,
  options: DOCXExportOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const sections: any[] = [];
  
  // Title page
  if (opts.includeTitlePage) {
    sections.push(...createTitlePage(opts));
  }
  
  // Abstract
  if (opts.includeAbstract && opts.abstractText) {
    sections.push(...createAbstract(opts.abstractText, opts));
  }
  
  // Table of contents
  if (opts.includeTOC) {
    sections.push(new TableOfContents('Table of Contents', {
      hyperlink: true,
      headingStyleRange: '1-3',
    }));
    sections.push(new Paragraph({ text: '', spacing: { after: 400 } }));
  }
  
  // Parse and add content
  const contentSections = parseMarkdownToDOCX(content, opts);
  sections.push(...contentSections);
  
  // Create document
  const doc = new Document({
    creator: opts.author,
    title: opts.title,
    subject: opts.subject,
    keywords: opts.keywords,
    sections: [
      {
        properties: {
          page: {
            margin: opts.margins,
          },
        },
        children: sections,
      },
    ],
  });
  
  // Generate blob
  const buffer = await Packer.toBlob(doc);
  return buffer;
}

/**
 * Create title page
 */
function createTitlePage(options: Required<DOCXExportOptions>): Paragraph[] {
  return [
    new Paragraph({
      text: options.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 4000, after: 400 },
    }),
    new Paragraph({
      text: options.author,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: new Date().toLocaleDateString(),
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: '',
      pageBreakBefore: true,
    }),
  ];
}

/**
 * Create abstract section
 */
function createAbstract(
  abstractText: string,
  options: Required<DOCXExportOptions>
): Paragraph[] {
  return [
    new Paragraph({
      text: 'Abstract',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: abstractText,
      spacing: { after: 400, line: options.lineSpacing * 240 },
    }),
    new Paragraph({
      text: '',
      spacing: { after: 400 },
    }),
  ];
}

/**
 * Parse markdown to DOCX paragraphs
 */
function parseMarkdownToDOCX(
  content: string,
  options: Required<DOCXExportOptions>
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');
  
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        paragraphs.push(createCodeBlock(codeLines.join('\n')));
        codeLines = [];
        inCodeBlock = false;
      } else {
        // Start code block
        if (currentParagraph.length > 0) {
          paragraphs.push(createParagraph(currentParagraph.join(' '), options));
          currentParagraph = [];
        }
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    
    // Empty line - paragraph break
    if (!line.trim()) {
      if (currentParagraph.length > 0) {
        paragraphs.push(createParagraph(currentParagraph.join(' '), options));
        currentParagraph = [];
      }
      continue;
    }
    
    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentParagraph.length > 0) {
        paragraphs.push(createParagraph(currentParagraph.join(' '), options));
        currentParagraph = [];
      }
      paragraphs.push(createHeading(headingMatch[2], headingMatch[1].length));
      continue;
    }
    
    // Lists
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      if (currentParagraph.length > 0) {
        paragraphs.push(createParagraph(currentParagraph.join(' '), options));
        currentParagraph = [];
      }
      const indent = listMatch[1].length;
      const isNumbered = listMatch[2].match(/\d+\./);
      paragraphs.push(createListItem(listMatch[3], indent, isNumbered !== null, options));
      continue;
    }
    
    // Block quotes
    if (line.trim().startsWith('>')) {
      if (currentParagraph.length > 0) {
        paragraphs.push(createParagraph(currentParagraph.join(' '), options));
        currentParagraph = [];
      }
      const quoteText = line.replace(/^>\s*/, '');
      paragraphs.push(createBlockQuote(quoteText, options));
      continue;
    }
    
    // Regular paragraph text
    currentParagraph.push(line);
  }
  
  // Add final paragraph if exists
  if (currentParagraph.length > 0) {
    paragraphs.push(createParagraph(currentParagraph.join(' '), options));
  }
  
  return paragraphs;
}

/**
 * Create heading paragraph
 */
function createHeading(text: string, level: number): Paragraph {
  const headingLevels = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ];
  
  return new Paragraph({
    text: text,
    heading: headingLevels[level - 1] || HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
  });
}

/**
 * Create regular paragraph with formatting
 */
function createParagraph(
  text: string,
  options: Required<DOCXExportOptions>
): Paragraph {
  const children = parseInlineFormatting(text, options);
  
  return new Paragraph({
    children,
    spacing: {
      line: options.lineSpacing * 240,
      after: 200,
    },
  });
}

/**
 * Parse inline formatting (bold, italic, code)
 */
function parseInlineFormatting(
  text: string,
  options: Required<DOCXExportOptions>
): TextRun[] {
  const runs: TextRun[] = [];
  
  // Simple regex-based parsing for inline formatting
  // This is a simplified version - a full markdown parser would be more robust
  
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
  
  for (const part of parts) {
    if (!part) continue;
    
    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
        font: options.fontFamily,
        size: options.fontSize * 2,
      }));
    }
    // Italic: *text*
    else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        italics: true,
        font: options.fontFamily,
        size: options.fontSize * 2,
      }));
    }
    // Inline code: `text`
    else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        font: 'Courier New',
        size: options.fontSize * 2,
        shading: {
          type: 'solid',
          color: 'F5F5F5',
        },
      }));
    }
    // Links: [text](url)
    else if (part.match(/\[.*?\]\(.*?\)/)) {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        runs.push(new TextRun({
          text: linkMatch[1],
          font: options.fontFamily,
          size: options.fontSize * 2,
          color: '0000FF',
          underline: {},
        }));
      }
    }
    // Regular text
    else {
      runs.push(new TextRun({
        text: part,
        font: options.fontFamily,
        size: options.fontSize * 2,
      }));
    }
  }
  
  return runs;
}

/**
 * Create list item
 */
function createListItem(
  text: string,
  indent: number,
  numbered: boolean,
  options: Required<DOCXExportOptions>
): Paragraph {
  const children = parseInlineFormatting(text, options);
  
  return new Paragraph({
    children,
    bullet: numbered ? undefined : { level: Math.floor(indent / 2) },
    numbering: numbered ? { reference: 'default-numbering', level: Math.floor(indent / 2) } : undefined,
    spacing: {
      line: options.lineSpacing * 240,
      after: 100,
    },
  });
}

/**
 * Create block quote
 */
function createBlockQuote(
  text: string,
  options: Required<DOCXExportOptions>
): Paragraph {
  const children = parseInlineFormatting(text, options);
  
  return new Paragraph({
    children,
    indent: {
      left: 720, // 0.5 inch
    },
    spacing: {
      line: options.lineSpacing * 240,
      before: 200,
      after: 200,
    },
    border: {
      left: {
        color: '999999',
        space: 8,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
  });
}

/**
 * Create code block
 */
function createCodeBlock(code: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: code,
        font: 'Courier New',
        size: 20,
      }),
    ],
    shading: {
      type: 'solid',
      color: 'F5F5F5',
    },
    spacing: {
      before: 200,
      after: 200,
    },
  });
}

/**
 * Export to DOCX and trigger download
 */
export async function exportToDOCX(
  content: string,
  filename: string,
  options: DOCXExportOptions = {}
): Promise<void> {
  const blob = await generateDOCX(content, options);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
