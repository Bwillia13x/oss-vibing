/**
 * Smart template suggestions for Phase 3.2.2
 * Provides context-aware template recommendations and auto-complete
 */

interface Template {
  id: string
  name: string
  description: string
  category: string
  discipline: string
  file: string
  icon: string
}

interface TemplateContext {
  userInput?: string
  discipline?: string
  assignmentType?: string
  keywords?: string[]
}

/**
 * Analyze user input to detect context
 */
export function analyzeContext(input: string): TemplateContext {
  const lowerInput = input.toLowerCase()
  
  // Detect discipline
  let discipline = 'general'
  if (lowerInput.match(/biology|chemistry|physics|engineering|math|science|lab|experiment/)) {
    discipline = 'stem'
  } else if (lowerInput.match(/history|literature|philosophy|sociology|psychology|anthropology/)) {
    discipline = 'humanities'
  } else if (lowerInput.match(/business|economics|management|marketing|finance/)) {
    discipline = 'business'
  }

  // Detect assignment type
  let assignmentType = 'essay'
  if (lowerInput.match(/research paper|paper|research/)) {
    assignmentType = 'research'
  } else if (lowerInput.match(/lab report|lab|experiment/)) {
    assignmentType = 'lab-report'
  } else if (lowerInput.match(/presentation|slides|deck/)) {
    assignmentType = 'presentation'
  } else if (lowerInput.match(/thesis|dissertation/)) {
    assignmentType = 'thesis'
  } else if (lowerInput.match(/proposal/)) {
    assignmentType = 'proposal'
  } else if (lowerInput.match(/case study/)) {
    assignmentType = 'case-study'
  } else if (lowerInput.match(/data|analysis|statistics|spreadsheet/)) {
    assignmentType = 'data-analysis'
  } else if (lowerInput.match(/budget/)) {
    assignmentType = 'budget'
  }

  // Extract keywords
  const keywords = lowerInput
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['that', 'this', 'with', 'from', 'have', 'will', 'what'].includes(word))

  return {
    userInput: input,
    discipline,
    assignmentType,
    keywords,
  }
}

/**
 * Score a template based on context
 */
function scoreTemplate(template: Template, context: TemplateContext): number {
  let score = 0

  // Exact category match
  if (template.category === context.assignmentType) {
    score += 10
  }

  // Discipline match
  if (context.discipline && 
      (template.discipline === context.discipline || template.discipline === 'general')) {
    score += 5
  }

  // Keyword matches in name or description
  if (context.keywords) {
    const searchText = `${template.name} ${template.description}`.toLowerCase()
    for (const keyword of context.keywords) {
      if (searchText.includes(keyword)) {
        score += 2
      }
    }
  }

  return score
}

/**
 * Get template suggestions based on context
 */
export function getSuggestedTemplates(
  templates: Template[],
  context: TemplateContext,
  limit = 3
): Template[] {
  // Score all templates
  const scored = templates.map(template => ({
    template,
    score: scoreTemplate(template, context),
  }))

  // Sort by score and return top suggestions
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.template)
}

/**
 * Auto-complete suggestions for common phrases
 */
export interface AutoCompleteItem {
  text: string
  category: 'template' | 'citation' | 'command'
  description: string
}

export function getAutoCompleteSuggestions(input: string): AutoCompleteItem[] {
  const lowerInput = input.toLowerCase()
  const suggestions: AutoCompleteItem[] = []

  // Template suggestions
  if (lowerInput.includes('create') || lowerInput.includes('start') || lowerInput.includes('new')) {
    if (lowerInput.includes('essay')) {
      suggestions.push({
        text: 'Create a new essay using the academic essay template',
        category: 'template',
        description: 'Standard 5-paragraph essay structure',
      })
    }
    if (lowerInput.includes('research') || lowerInput.includes('paper')) {
      suggestions.push({
        text: 'Create a research paper with literature review and methodology',
        category: 'template',
        description: 'Comprehensive research paper template',
      })
    }
    if (lowerInput.includes('lab')) {
      suggestions.push({
        text: 'Create a lab report with experimental data',
        category: 'template',
        description: 'Scientific lab report format',
      })
    }
  }

  // Citation suggestions
  if (lowerInput.includes('cite') || lowerInput.includes('citation') || lowerInput.includes('reference')) {
    suggestions.push({
      text: 'Find and insert citations for this topic',
      category: 'citation',
      description: 'Search academic databases',
    })
    suggestions.push({
      text: 'Check citation integrity and coverage',
      category: 'citation',
      description: 'Verify all citations are properly formatted',
    })
  }

  // Command suggestions
  if (lowerInput.includes('export')) {
    suggestions.push({
      text: 'Export document to PDF or DOCX format',
      category: 'command',
      description: 'Professional document export',
    })
  }

  if (lowerInput.includes('analyze') || lowerInput.includes('data')) {
    suggestions.push({
      text: 'Analyze spreadsheet data with statistics',
      category: 'command',
      description: 'Descriptive statistics and correlations',
    })
  }

  return suggestions
}

/**
 * Detect citation style from document content
 */
export function detectCitationStyle(content: string): 'APA' | 'MLA' | 'Chicago' | 'unknown' {
  // APA: (Author, Year) or Author (Year)
  if (content.match(/\([A-Z][a-z]+,\s*\d{4}\)/)) {
    return 'APA'
  }

  // MLA: (Author page) or (Author page-page)
  if (content.match(/\([A-Z][a-z]+\s+\d+(-\d+)?\)/)) {
    return 'MLA'
  }

  // Chicago: superscript numbers or (Author Year, page)
  if (content.match(/\([A-Z][a-z]+\s+\d{4},\s*\d+\)/)) {
    return 'Chicago'
  }

  return 'unknown'
}

/**
 * Get writing suggestions based on content analysis
 */
export interface WritingSuggestion {
  type: 'citation' | 'structure' | 'clarity' | 'grammar'
  message: string
  position?: { line: number; column: number }
  severity: 'info' | 'warning' | 'error'
}

export function getWritingSuggestions(content: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = []
  const lines = content.split('\n')

  // Check for uncited claims
  const claimIndicators = [
    'studies show',
    'research indicates',
    'according to',
    'it is known that',
    'evidence suggests',
  ]

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase()
    for (const indicator of claimIndicators) {
      if (lowerLine.includes(indicator)) {
        // Check if there's a citation nearby
        const hasCitation = line.match(/\([A-Z][a-z]+,?\s+\d{4}\)/) || 
                           line.match(/\[[^\]]{1,100}\]/)
        if (!hasCitation) {
          suggestions.push({
            type: 'citation',
            message: `This claim may need a citation: "${indicator}"`,
            position: { line: index + 1, column: line.indexOf(indicator) },
            severity: 'warning',
          })
        }
      }
    }

    // Check for weak transitions
    if (lowerLine.startsWith('also') || lowerLine.startsWith('and')) {
      suggestions.push({
        type: 'structure',
        message: 'Consider using a stronger transition word',
        position: { line: index + 1, column: 0 },
        severity: 'info',
      })
    }

    // Check for passive voice
    if (line.match(/\b(was|were|is|are|been)\s+\w+ed\b/)) {
      suggestions.push({
        type: 'clarity',
        message: 'Consider using active voice for clarity',
        position: { line: index + 1, column: 0 },
        severity: 'info',
      })
    }
  })

  return suggestions
}
