/**
 * PDF Processing Module
 * 
 * Provides functionality to extract metadata, citations, and text from PDF files
 * using the GROBID service.
 */

export {
  processPDF,
  processPDFBatch,
  isGROBIDAvailable,
  type PDFMetadata,
  type PDFCitation,
  type PDFSection,
  type PDFProcessingResult,
  type PDFProcessingOptions,
} from './processor'
