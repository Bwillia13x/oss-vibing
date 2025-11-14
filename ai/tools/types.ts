/**
 * Common type definitions for AI tools
 */

// Document section type
export interface DocumentSection {
  title: string;
  content: string;
}

// JSON document structure
export interface JsonDocument {
  sections?: DocumentSection[];
  content?: string;
  [key: string]: unknown;
}

// Document data structure for exports
export interface DocumentData {
  title?: string;
  author?: string;
  date?: string;
  content?: string;
  text?: string;
  sections?: DocumentSection[];
  bibliography?: {
    formatted?: string;
    entries?: Reference[];
  };
  provenance?: unknown;
  [key: string]: unknown;
}

// Sheet data structure
export interface SheetData {
  tables: Record<string, {
    headers: string[];
    data: unknown[][];
  }>;
  [key: string]: unknown;
}

// Deck/Presentation data structure
export interface DeckData {
  title?: string;
  author?: string;
  slides?: Array<{
    title?: string;
    content?: string;
    bullets?: string[];
  }>;
  [key: string]: unknown;
}

// Export options
export interface ExportOptionsType {
  includeProvenance?: boolean;
  includeMetadata?: boolean;
  format?: 'pdf' | 'docx' | 'pptx' | 'json' | 'csv';
  [key: string]: unknown;
}

// Analysis result types
export interface AnalysisResult {
  status: string;
  [key: string]: unknown;
}

export interface ThesisAnalysis {
  present: boolean;
  statement?: string;
  location?: string;
  clarity: 'clear' | 'unclear' | 'absent';
  strength: 'strong' | 'moderate' | 'weak';
  specificity: 'specific' | 'general' | 'vague';
  recommendations?: string[];
  [key: string]: unknown;
}

export interface ClaimsAnalysis {
  count: number;
  claims: Array<{
    text: string;
    type: string;
    support: string;
    strength: string;
  }>;
  [key: string]: unknown;
}

export interface EvidenceAnalysis {
  types: Record<string, number>;
  quality: 'strong' | 'moderate' | 'weak';
  recommendations?: string[];
  [key: string]: unknown;
}

export interface LogicalFlowAnalysis {
  coherence: 'high' | 'moderate' | 'low';
  transitions: Array<{
    from: string;
    to: string;
    quality: string;
  }>;
  recommendations?: string[];
  [key: string]: unknown;
}

export interface CounterargumentsAnalysis {
  present: boolean;
  count: number;
  counterarguments?: Array<{
    text: string;
    response?: string;
  }>;
  recommendations?: string[];
  [key: string]: unknown;
}

export interface ArgumentStructureAnalysis extends AnalysisResult {
  discipline: string;
  documentPath: string;
  thesis?: ThesisAnalysis;
  claims?: ClaimsAnalysis;
  evidence?: EvidenceAnalysis;
  logicalFlow?: LogicalFlowAnalysis;
  counterarguments?: CounterargumentsAnalysis;
  overallScore?: {
    value: number;
    breakdown: Record<string, number>;
  };
}

// Reference and citation types
export interface Reference {
  id?: string;
  doi?: string;
  title?: string;
  authors?: string[];
  year?: number | string;
  journal?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// CSL (Citation Style Language) item
export interface CSLItem {
  type?: string;
  title?: string;
  author?: Array<{ family?: string; given?: string }>;
  issued?: { 'date-parts'?: number[][] };
  'container-title'?: string;
  volume?: string | number;
  issue?: string | number;
  page?: string;
  DOI?: string;
  URL?: string;
  publisher?: string;
  'publisher-place'?: string;
  ISBN?: string;
  ISSN?: string;
  [key: string]: unknown;
}

export interface CitationMetadata {
  page?: number | string;
  location?: string;
  context?: string;
  [key: string]: unknown;
}

// Chart and visualization types
export interface ChartConfig {
  id?: string;
  type: string;
  title?: string;
  data: unknown[];
  xAxis?: {
    dataKey?: string;
    label?: string;
  };
  yAxis?: {
    label?: string;
  };
  series?: Array<{
    dataKey?: string;
    name?: string;
    color?: string;
    [key: string]: unknown;
  }>;
  options?: Record<string, unknown>;
  [key: string]: unknown;
}

// Export artifact types
export interface ExportOptions {
  format?: string;
  includeMetadata?: boolean;
  [key: string]: unknown;
}

// Statistical analysis types
export interface StatisticalSummary {
  mean?: number;
  median?: number;
  mode?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  count?: number;
  [key: string]: unknown;
}

export interface CorrelationResult {
  coefficient: number;
  pValue?: number;
  significance?: string;
  [key: string]: unknown;
}

// Research gap types
export interface ResearchGap {
  area: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  suggestedApproaches?: string[];
  relatedPapers?: Reference[];
  [key: string]: unknown;
}

export interface ResearchGapsAnalysis extends AnalysisResult {
  gaps: ResearchGap[];
  summary: string;
  recommendations?: string[];
}

// Plugin and extension types
export interface PluginContext {
  [key: string]: unknown;
}

export interface PluginResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

