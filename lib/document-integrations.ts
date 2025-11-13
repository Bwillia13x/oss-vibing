/**
 * Document Import/Export Integration Service
 * Supports Google Docs, Microsoft Word, and LaTeX formats
 */

import monitoring from './monitoring'

export interface ImportOptions {
  format: 'docx' | 'gdocs' | 'latex' | 'html' | 'markdown'
  preserveFormatting?: boolean
  extractImages?: boolean
}

export interface ExportOptions {
  format: 'docx' | 'pdf' | 'latex' | 'html' | 'markdown'
  template?: string
  includeImages?: boolean
  pageSize?: 'letter' | 'a4'
}

export interface DocumentContent {
  title: string
  content: string // Markdown or HTML
  metadata?: {
    author?: string
    created?: Date
    modified?: Date
    wordCount?: number
  }
  images?: Array<{
    id: string
    url: string
    alt?: string
  }>
  citations?: Array<{
    id: string
    text: string
    source?: string
  }>
}

/**
 * Import document from Google Docs
 * Requires Google Drive API access
 */
export async function importFromGoogleDocs(
  documentId: string,
  accessToken: string
): Promise<DocumentContent> {
  const startTime = Date.now()
  
  try {
    // Google Docs API endpoint
    const apiUrl = `https://docs.googleapis.com/v1/documents/${documentId}`
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Doc: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Convert Google Docs structure to markdown
    // This is a simplified implementation - full conversion would be more complex
    const content = convertGoogleDocsToMarkdown(data)
    
    const doc: DocumentContent = {
      title: data.title || 'Untitled Document',
      content,
      metadata: {
        author: data.documentStyle?.useFirstPageHeaderFooter ? 'Unknown' : undefined,
        wordCount: content.split(/\s+/).length,
      },
    }
    
    monitoring.trackMetric('document_import_time', Date.now() - startTime, {
      format: 'gdocs',
      wordCount: (doc.metadata?.wordCount || 0).toString(),
    })
    
    return doc
  } catch (error) {
    console.error('Error importing from Google Docs:', error)
    monitoring.trackError(error as Error, {
      method: 'importFromGoogleDocs',
      documentId,
    })
    throw error
  }
}

/**
 * Convert Google Docs structure to Markdown
 */
function convertGoogleDocsToMarkdown(data: any): string {
  if (!data.body || !data.body.content) {
    return ''
  }
  
  let markdown = ''
  
  for (const element of data.body.content) {
    if (element.paragraph) {
      const paragraph = element.paragraph
      let text = ''
      
      if (paragraph.elements) {
        for (const elem of paragraph.elements) {
          if (elem.textRun) {
            text += elem.textRun.content
          }
        }
      }
      
      // Handle paragraph styles
      const style = paragraph.paragraphStyle?.namedStyleType
      if (style === 'HEADING_1') {
        markdown += `# ${text}\n`
      } else if (style === 'HEADING_2') {
        markdown += `## ${text}\n`
      } else if (style === 'HEADING_3') {
        markdown += `### ${text}\n`
      } else {
        markdown += `${text}\n`
      }
    }
  }
  
  return markdown.trim()
}

/**
 * Export document to Google Docs
 */
export async function exportToGoogleDocs(
  doc: DocumentContent,
  accessToken: string,
  folderId?: string
): Promise<string> {
  const startTime = Date.now()
  
  try {
    // Create new Google Doc
    const createUrl = 'https://docs.googleapis.com/v1/documents'
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: doc.title,
      }),
    })
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create Google Doc: ${createResponse.statusText}`)
    }
    
    const createdDoc = await createResponse.json()
    const documentId = createdDoc.documentId
    
    // Insert content
    const batchUpdateUrl = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`
    
    await fetch(batchUpdateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: doc.content,
            },
          },
        ],
      }),
    })
    
    monitoring.trackMetric('document_export_time', Date.now() - startTime, {
      format: 'gdocs',
      wordCount: (doc.metadata?.wordCount || 0).toString(),
    })
    
    return documentId
  } catch (error) {
    console.error('Error exporting to Google Docs:', error)
    monitoring.trackError(error as Error, {
      method: 'exportToGoogleDocs',
    })
    throw error
  }
}

/**
 * Import document from Word (.docx)
 * Uses docx library (already in package.json)
 */
export async function importFromDocx(
  fileBuffer: ArrayBuffer
): Promise<DocumentContent> {
  const startTime = Date.now()
  
  try {
    // Import docx library dynamically
    const mammoth = await import('mammoth')
    
    // Extract HTML from DOCX
    const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer })
    const html = result.value
    
    // Convert HTML to Markdown (simplified)
    const markdown = convertHtmlToMarkdown(html)
    
    // Extract title from first heading or first line
    const titleMatch = markdown.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : 'Imported Document'
    
    const doc: DocumentContent = {
      title,
      content: markdown,
      metadata: {
        wordCount: markdown.split(/\s+/).length,
      },
    }
    
    monitoring.trackMetric('document_import_time', Date.now() - startTime, {
      format: 'docx',
      wordCount: (doc.metadata?.wordCount || 0).toString(),
    })
    
    return doc
  } catch (error) {
    console.error('Error importing from DOCX:', error)
    monitoring.trackError(error as Error, {
      method: 'importFromDocx',
    })
    throw error
  }
}

/**
 * Export document to Word (.docx)
 * Uses docx library
 */
export async function exportToDocx(
  doc: DocumentContent
): Promise<Buffer> {
  const startTime = Date.now()
  
  try {
    // Import docx library
    const { Document, Paragraph, TextRun, Packer, HeadingLevel } = await import('docx')
    
    // Convert markdown to docx paragraphs
    const paragraphs: any[] = []
    const lines = doc.content.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('# ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
          })
        )
      } else if (line.startsWith('## ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
          })
        )
      } else if (line.startsWith('### ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3,
          })
        )
      } else if (line.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(line)],
          })
        )
      }
    }
    
    const document = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    })
    
    const buffer = await Packer.toBuffer(document)
    
    monitoring.trackMetric('document_export_time', Date.now() - startTime, {
      format: 'docx',
      wordCount: (doc.metadata?.wordCount || 0).toString(),
    })
    
    return buffer
  } catch (error) {
    console.error('Error exporting to DOCX:', error)
    monitoring.trackError(error as Error, {
      method: 'exportToDocx',
    })
    throw error
  }
}

/**
 * Convert document to LaTeX
 */
export function convertToLaTeX(doc: DocumentContent): string {
  const startTime = Date.now()
  
  try {
    let latex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}

\\title{${escapeLatex(doc.title)}}
\\author{${escapeLatex(doc.metadata?.author || '')}}
\\date{\\today}

\\begin{document}

\\maketitle

`
    
    // Convert markdown to LaTeX
    const lines = doc.content.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('# ')) {
        latex += `\\section{${escapeLatex(line.substring(2))}}\n\n`
      } else if (line.startsWith('## ')) {
        latex += `\\subsection{${escapeLatex(line.substring(3))}}\n\n`
      } else if (line.startsWith('### ')) {
        latex += `\\subsubsection{${escapeLatex(line.substring(4))}}\n\n`
      } else if (line.trim()) {
        latex += `${escapeLatex(line)}\n\n`
      } else {
        latex += '\n'
      }
    }
    
    latex += '\\end{document}'
    
    monitoring.trackMetric('document_conversion_time', Date.now() - startTime, {
      format: 'latex',
      wordCount: (doc.metadata?.wordCount || 0).toString(),
    })
    
    return latex
  } catch (error) {
    console.error('Error converting to LaTeX:', error)
    monitoring.trackError(error as Error, {
      method: 'convertToLaTeX',
    })
    throw error
  }
}

/**
 * Convert LaTeX to Markdown (simplified)
 */
export function convertFromLaTeX(latex: string): DocumentContent {
  const startTime = Date.now()
  
  try {
    // Extract title
    const titleMatch = latex.match(/\\title\{([^}]+)\}/)
    const title = titleMatch ? unescapeLatex(titleMatch[1]) : 'Untitled'
    
    // Extract author
    const authorMatch = latex.match(/\\author\{([^}]+)\}/)
    const author = authorMatch ? unescapeLatex(authorMatch[1]) : undefined
    
    // Extract content between \begin{document} and \end{document}
    const contentMatch = latex.match(/\\begin\{document\}([\s\S]+)\\end\{document\}/)
    let content = contentMatch ? contentMatch[1] : latex
    
    // Remove \maketitle
    content = content.replace(/\\maketitle\s*/g, '')
    
    // Convert LaTeX commands to Markdown
    content = content
      .replace(/\\section\{([^}]+)\}/g, '# $1')
      .replace(/\\subsection\{([^}]+)\}/g, '## $1')
      .replace(/\\subsubsection\{([^}]+)\}/g, '### $1')
      .replace(/\\textbf\{([^}]+)\}/g, '**$1**')
      .replace(/\\textit\{([^}]+)\}/g, '*$1*')
      .replace(/\\emph\{([^}]+)\}/g, '*$1*')
      .replace(/``/g, '"')
      .replace(/''/g, '"')
      .replace(/\\cite\{([^}]+)\}/g, '[@$1]')
      .replace(/\\ref\{([^}]+)\}/g, '@ref($1)')
      .replace(/\\\\/g, '\n')
      .trim()
    
    const doc: DocumentContent = {
      title,
      content,
      metadata: {
        author,
        wordCount: content.split(/\s+/).length,
      },
    }
    
    monitoring.trackMetric('document_conversion_time', Date.now() - startTime, {
      format: 'latex-to-markdown',
      wordCount: (doc.metadata?.wordCount || 0).toString(),
    })
    
    return doc
  } catch (error) {
    console.error('Error converting from LaTeX:', error)
    monitoring.trackError(error as Error, {
      method: 'convertFromLaTeX',
    })
    throw error
  }
}

/**
 * Helper: Escape LaTeX special characters
 */
function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}

/**
 * Helper: Unescape LaTeX special characters
 */
function unescapeLatex(text: string): string {
  return text
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\([&%$#_{}])/g, '$1')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
}

/**
 * Helper: Convert HTML to Markdown (simplified)
 */
function convertHtmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

/**
 * Check if mammoth is available for DOCX import
 */
let mammothAvailable: boolean | null = null

export async function isMammothAvailable(): Promise<boolean> {
  if (mammothAvailable !== null) {
    return mammothAvailable
  }
  
  try {
    await import('mammoth')
    mammothAvailable = true
    return true
  } catch {
    mammothAvailable = false
    return false
  }
}
