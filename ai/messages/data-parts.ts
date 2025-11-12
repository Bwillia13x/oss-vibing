import z from 'zod/v3'

export const errorSchema = z.object({
  message: z.string(),
})

export const dataPartSchema = z.object({
  'create-sandbox': z.object({
    sandboxId: z.string().optional(),
    status: z.enum(['loading', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'generating-files': z.object({
    paths: z.array(z.string()),
    status: z.enum(['generating', 'uploading', 'uploaded', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'run-command': z.object({
    sandboxId: z.string(),
    commandId: z.string().optional(),
    command: z.string(),
    args: z.array(z.string()),
    status: z.enum(['executing', 'running', 'waiting', 'done', 'error']),
    exitCode: z.number().optional(),
    error: errorSchema.optional(),
  }),
  'get-sandbox-url': z.object({
    url: z.string().optional(),
    status: z.enum(['loading', 'done']),
  }),
  'report-errors': z.object({
    summary: z.string(),
    paths: z.array(z.string()).optional(),
  }),
  'uni-outline': z.object({
    topic: z.string(),
    level: z.string(),
    thesis: z.string().optional(),
    sectionHeads: z.array(z.string()),
    status: z.enum(['generating', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-citations': z.object({
    style: z.enum(['APA', 'MLA', 'Chicago']),
    items: z.array(z.object({
      id: z.string(),
      title: z.string(),
      author: z.string().optional(),
      doi: z.string().optional(),
      url: z.string().optional(),
    })),
    inserted: z.array(z.string()),
    timestamp: z.string(),
    status: z.enum(['searching', 'inserting', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-pdf-summary': z.object({
    source: z.string(),
    highlights: z.array(z.string()),
    quotes: z.array(z.object({
      text: z.string(),
      page: z.number(),
      locator: z.string().optional(),
    })),
    notes: z.array(z.string()),
    status: z.enum(['processing', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-sheet-analyze': z.object({
    range: z.string(),
    ops: z.array(z.enum(['describe', 'pivot', 'regress', 'corr', 'clean', 'ttest', 'anova', 'chisquare', 'confidence'])),
    tables: z.array(z.object({
      name: z.string(),
      data: z.any(),
    })).optional(),
    charts: z.array(z.object({
      type: z.string(),
      title: z.string(),
    })).optional(),
    status: z.enum(['analyzing', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-deck-generate': z.object({
    slideTitles: z.array(z.string()),
    slides: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    speakerNotes: z.array(z.string()).optional(),
    status: z.enum(['generating', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-flashcards': z.object({
    count: z.number(),
    cards: z.array(z.object({
      front: z.string(),
      back: z.string(),
      type: z.enum(['cloze', 'qa', 'term']).optional(),
    })),
    scheduleMeta: z.object({
      nextReview: z.string().optional(),
      interval: z.number().optional(),
    }).optional(),
    status: z.enum(['generating', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-integrity': z.object({
    coveragePct: z.number(),
    missingCites: z.array(z.string()),
    quoteMismatches: z.array(z.object({
      quote: z.string(),
      issue: z.string(),
    })),
    actions: z.array(z.string()),
    status: z.enum(['checking', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-export': z.object({
    artifactPath: z.string(),
    format: z.string(),
    exportPath: z.string().optional(),
    status: z.enum(['exporting', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-grammar': z.object({
    grammar: z.object({
      totalIssues: z.number(),
      errors: z.number(),
      warnings: z.number(),
      suggestions: z.number(),
      passiveVoiceCount: z.number(),
      issues: z.array(z.object({
        type: z.string(),
        severity: z.string(),
        message: z.string(),
        suggestion: z.string().optional(),
        sentence: z.string().optional(),
      })),
    }).optional(),
    readability: z.object({
      statistics: z.object({
        words: z.number(),
        sentences: z.number(),
        averageWordsPerSentence: z.number(),
        complexWords: z.number(),
      }),
      scores: z.object({
        fleschReadingEase: z.number(),
        fleschKincaidGrade: z.number(),
        gunningFog: z.number(),
      }),
      interpretation: z.string(),
      academicRecommendation: z.string(),
    }).optional(),
    status: z.enum(['checking', 'done', 'error']),
    error: errorSchema.optional(),
  }),
  'uni-plagiarism': z.object({
    originalityScore: z.number(),
    recommendation: z.string(),
    statistics: z.object({
      totalSentences: z.number(),
      suspiciousSentences: z.number(),
      uncitedQuotes: z.number(),
      missingCitations: z.number(),
      overallRisk: z.enum(['low', 'medium', 'high']),
    }),
    issues: z.array(z.object({
      type: z.string(),
      severity: z.string(),
      text: z.string(),
      context: z.string(),
      suggestion: z.string(),
      confidence: z.number(),
    })),
    status: z.enum(['checking', 'done', 'error']),
    error: errorSchema.optional(),
  }),
})

export type DataPart = z.infer<typeof dataPartSchema>
