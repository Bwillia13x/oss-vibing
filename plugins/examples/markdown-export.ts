/**
 * Phase 4.4.1: Example Plugin - Markdown Export
 * Demonstrates export format plugin
 */

import {
  Plugin,
  PluginContext,
  PluginPermission,
} from '../../lib/types/plugin'

const markdownExportPlugin: Plugin = {
  metadata: {
    id: 'markdown-export',
    name: 'Markdown Export',
    version: '1.2.1',
    description: 'Export documents to GitHub-flavored Markdown',
    author: {
      name: 'Community Developer',
      email: 'dev@example.com',
    },
    license: 'MIT',
    keywords: ['export', 'markdown', 'github'],
    category: 'export' as any,
    icon: '📝',
  },
  config: {
    enabled: true,
    permissions: [PluginPermission.READ_FILES, PluginPermission.WRITE_FILES],
    settings: {
      includeMetadata: true,
      includeFrontmatter: true,
    },
  },
  status: 'unloaded' as any,

  onLoad: async () => {
    console.log('Markdown Export: Loading...')
  },

  onInitialize: async (context: PluginContext) => {
    console.log('Markdown Export: Initializing...')

    // Register export format
    context.api.registerExportFormat({
      id: 'github-markdown',
      name: 'GitHub Markdown',
      extension: '.md',
      mimeType: 'text/markdown',
      export: async (document: any) => {
        const markdown = await convertToMarkdown(document, context.config.settings)
        const blob = new Blob([markdown], { type: 'text/markdown' })
        return blob
      },
    })

    // Register export command
    context.api.registerCommand({
      id: 'export-markdown',
      name: 'Export as Markdown',
      description: 'Export document to GitHub-flavored Markdown',
      execute: async (document: any) => {
        const markdown = await convertToMarkdown(document, context.config.settings)
        context.api.notifications.show(
          'Document exported to Markdown',
          'success'
        )
        return markdown
      },
      icon: '📝',
      shortcut: 'Ctrl+Shift+M',
    })

    context.logger.info('Markdown Export initialized')
  },

  onActivate: async () => {
    console.log('Markdown Export: Activated')
  },

  onDeactivate: async () => {
    console.log('Markdown Export: Deactivated')
  },

  onUnload: async () => {
    console.log('Markdown Export: Unloaded')
  },
}

/**
 * Convert document to GitHub-flavored Markdown
 */
async function convertToMarkdown(
  document: any,
  settings: any
): Promise<string> {
  let markdown = ''

  // Add frontmatter if enabled
  if (settings.includeFrontmatter) {
    markdown += '---\n'
    markdown += `title: ${document.title || 'Untitled'}\n`
    if (document.author) {
      markdown += `author: ${document.author}\n`
    }
    if (document.date) {
      markdown += `date: ${document.date}\n`
    }
    markdown += '---\n\n'
  }

  // Add title
  if (document.title) {
    markdown += `# ${document.title}\n\n`
  }

  // Add metadata section if enabled
  if (settings.includeMetadata && document.metadata) {
    markdown += '## Document Information\n\n'
    if (document.metadata.author) {
      markdown += `**Author:** ${document.metadata.author}\n\n`
    }
    if (document.metadata.date) {
      markdown += `**Date:** ${document.metadata.date}\n\n`
    }
    if (document.metadata.wordCount) {
      markdown += `**Word Count:** ${document.metadata.wordCount}\n\n`
    }
    markdown += '---\n\n'
  }

  // Convert content
  if (document.content) {
    markdown += convertContentToMarkdown(document.content)
  }

  // Add citations section if present
  if (document.citations && document.citations.length > 0) {
    markdown += '\n\n## References\n\n'
    document.citations.forEach((citation: any, index: number) => {
      markdown += `${index + 1}. ${formatCitation(citation)}\n`
    })
  }

  return markdown
}

/**
 * Convert content blocks to markdown
 */
function convertContentToMarkdown(content: string): string {
  // This is a simplified conversion
  // In a real implementation, would handle various formatting types
  return content
}

/**
 * Format a citation for markdown
 */
function formatCitation(citation: any): string {
  const { authors, title, year, url } = citation

  let formatted = ''

  if (authors && authors.length > 0) {
    formatted += authors
      .map((a: any) => `${a.family}, ${a.given?.[0]}.`)
      .join(', ')
  }

  if (year) {
    formatted += ` (${year})`
  }

  if (title) {
    formatted += `. *${title}*`
  }

  if (url) {
    formatted += `. Available at: [${url}](${url})`
  }

  return formatted
}

export default markdownExportPlugin
