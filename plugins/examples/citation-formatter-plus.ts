/**
 * Phase 4.4.1: Example Plugin - Citation Formatter Plus
 * Demonstrates plugin structure and API usage
 */

import {
  Plugin,
  PluginContext,
  PluginPermission,
} from '../../lib/types/plugin'

const citationFormatterPlugin: Plugin = {
  metadata: {
    id: 'citation-formatter-plus',
    name: 'Citation Formatter Plus',
    version: '1.0.0',
    description: 'Advanced citation formatting with IEEE and ACS support',
    author: {
      name: 'Vibe University Team',
      email: 'plugins@vibeuniversity.com',
    },
    license: 'MIT',
    keywords: ['citation', 'formatting', 'IEEE', 'ACS'],
    category: 'citation' as any,
    icon: '📚',
  },
  config: {
    enabled: true,
    permissions: [PluginPermission.ACCESS_CITATIONS],
    settings: {
      defaultStyle: 'IEEE',
    },
  },
  status: 'unloaded' as any,

  onLoad: async () => {
    console.log('Citation Formatter Plus: Loading...')
  },

  onInitialize: async (context: PluginContext) => {
    console.log('Citation Formatter Plus: Initializing...')

    // Register IEEE citation format
    context.api.registerCommand({
      id: 'format-ieee',
      name: 'Format Citation (IEEE)',
      description: 'Format citation in IEEE style',
      execute: async (citation: any) => {
        return formatIEEE(citation)
      },
      icon: '📚',
    })

    // Register ACS citation format
    context.api.registerCommand({
      id: 'format-acs',
      name: 'Format Citation (ACS)',
      description: 'Format citation in ACS style',
      execute: async (citation: any) => {
        return formatACS(citation)
      },
      icon: '🧪',
    })

    context.logger.info('Citation Formatter Plus initialized')
  },

  onActivate: async () => {
    console.log('Citation Formatter Plus: Activated')
  },

  onDeactivate: async () => {
    console.log('Citation Formatter Plus: Deactivated')
  },

  onUnload: async () => {
    console.log('Citation Formatter Plus: Unloaded')
  },
}

/**
 * Format citation in IEEE style
 */
function formatIEEE(citation: any): string {
  // IEEE format: [1] A. Author, "Title," Journal, vol. X, no. Y, pp. Z-Z, Month Year.
  const { authors, title, journal, volume, issue, pages, year } = citation

  let formatted = ''

  if (authors && authors.length > 0) {
    // Format first author: A. B. LastName
    const firstAuthor = authors[0]
    const initials = firstAuthor.given
      ?.split(' ')
      .map((n: string) => n[0] + '.')
      .join(' ')
    formatted += `${initials} ${firstAuthor.family}`

    // Add "et al." if more than 3 authors
    if (authors.length > 3) {
      formatted += ' et al.'
    } else if (authors.length > 1) {
      // Add remaining authors
      for (let i = 1; i < authors.length; i++) {
        const author = authors[i]
        const inits = author.given
          ?.split(' ')
          .map((n: string) => n[0] + '.')
          .join(' ')
        formatted += `, ${inits} ${author.family}`
      }
    }
  }

  if (title) {
    formatted += `, "${title}"`
  }

  if (journal) {
    formatted += `, ${journal}`
  }

  if (volume) {
    formatted += `, vol. ${volume}`
  }

  if (issue) {
    formatted += `, no. ${issue}`
  }

  if (pages) {
    formatted += `, pp. ${pages}`
  }

  if (year) {
    formatted += `, ${year}`
  }

  formatted += '.'

  return formatted
}

/**
 * Format citation in ACS style
 */
function formatACS(citation: any): string {
  // ACS format: Author, A. B. Title. Journal Year, Volume, Pages.
  const { authors, title, journal, volume, pages, year } = citation

  let formatted = ''

  if (authors && authors.length > 0) {
    // Format authors: LastName, A. B.
    for (let i = 0; i < Math.min(authors.length, 10); i++) {
      const author = authors[i]
      const initials = author.given
        ?.split(' ')
        .map((n: string) => n[0] + '.')
        .join(' ')
      formatted += `${author.family}, ${initials}`

      if (i < Math.min(authors.length, 10) - 1) {
        formatted += '; '
      }
    }

    if (authors.length > 10) {
      formatted += '; et al.'
    }
  }

  if (title) {
    formatted += ` ${title}.`
  }

  if (journal) {
    formatted += ` ${journal}`
  }

  if (year) {
    formatted += ` ${year}`
  }

  if (volume) {
    formatted += `, ${volume}`
  }

  if (pages) {
    formatted += `, ${pages}`
  }

  formatted += '.'

  return formatted
}

export default citationFormatterPlugin
