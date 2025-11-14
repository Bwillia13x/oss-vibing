# PDF Processing Module

This module provides functionality to extract metadata, citations, and full text from academic PDF files using the GROBID service.

## Overview

The PDF processing module integrates with GROBID (GeneRation Of BIbliographic Data), a machine learning library specialized in extracting structured information from academic papers.

## Features

- **Metadata Extraction**: Extract title, authors, abstract, publication info
- **Citation Parsing**: Extract bibliographic references with DOI, journal, year
- **Full Text Extraction**: Extract complete document text with sections
- **Batch Processing**: Process multiple PDFs concurrently
- **Error Handling**: Graceful degradation when GROBID unavailable

## Setup

### 1. Start GROBID Service

Using Docker Compose (recommended):

```bash
docker-compose up -d grobid
```

Or using Docker directly:

```bash
docker run -d -p 8070:8070 lfoppiano/grobid:0.8.0
```

### 2. Configure Environment

Add to your `.env` file:

```bash
GROBID_URL="http://localhost:8070"
GROBID_TIMEOUT="30000"
GROBID_MAX_FILE_SIZE="52428800"
```

### 3. Verify Service

```bash
curl http://localhost:8070/api/isalive
# Should return: true
```

## Usage

### Basic Metadata Extraction

```typescript
import { processPDF } from '@/lib/pdf'

const result = await processPDF({
  pdfPath: './research-paper.pdf'
})

console.log(result.metadata.title)
console.log(result.metadata.authors)
console.log(result.metadata.doi)
```

### Extract Citations

```typescript
const result = await processPDF({
  pdfPath: './paper.pdf',
  extractCitations: true
})

result.citations.forEach(citation => {
  console.log(`${citation.title} (${citation.year})`)
  console.log(`DOI: ${citation.doi}`)
})
```

### Extract Full Text with Sections

```typescript
const result = await processPDF({
  pdfPath: './paper.pdf',
  extractFullText: true,
  extractSections: true
})

console.log('Full text:', result.fullText)

result.sections.forEach(section => {
  console.log(`Section: ${section.heading}`)
  console.log(section.content)
})
```

### Process from Buffer

```typescript
import { readFile } from 'fs/promises'

const pdfBuffer = await readFile('./paper.pdf')

const result = await processPDF({
  pdfBuffer,
  extractCitations: true
})
```

### Batch Processing

```typescript
import { processPDFBatch } from '@/lib/pdf'

const pdfs = [
  { id: '1', path: './paper1.pdf' },
  { id: '2', path: './paper2.pdf' },
  { id: '3', path: './paper3.pdf' }
]

const results = await processPDFBatch(pdfs, {
  extractCitations: true
})

results.forEach(({ id, metadata, citations }) => {
  console.log(`Paper ${id}: ${metadata.title}`)
  console.log(`Citations: ${citations.length}`)
})
```

### Check Service Availability

```typescript
import { isGROBIDAvailable } from '@/lib/pdf'

const available = await isGROBIDAvailable()
if (!available) {
  console.error('GROBID service is not running')
}
```

## API Reference

### `processPDF(options: PDFProcessingOptions): Promise<PDFProcessingResult>`

Process a PDF file to extract structured information.

**Options:**
- `pdfPath?: string` - Path to PDF file
- `pdfBuffer?: Buffer` - PDF file as buffer
- `extractCitations?: boolean` - Extract references (default: false)
- `extractFullText?: boolean` - Extract full document text (default: false)
- `extractSections?: boolean` - Extract document sections (default: false)
- `timeout?: number` - Request timeout in ms

**Returns:**
```typescript
{
  success: boolean
  metadata: PDFMetadata
  citations: PDFCitation[]
  fullText?: string
  sections?: PDFSection[]
  error?: string
}
```

### `processPDFBatch(pdfs, options): Promise<PDFProcessingResult[]>`

Process multiple PDFs concurrently.

**Parameters:**
- `pdfs: Array<{ id: string, path: string }>` - PDF files to process
- `options: PDFProcessingOptions` - Processing options (excluding pdfPath/pdfBuffer)

### `isGROBIDAvailable(): Promise<boolean>`

Check if GROBID service is available and responding.

## Types

### `PDFMetadata`

```typescript
{
  title?: string
  authors?: Array<{
    firstName?: string
    lastName?: string
    email?: string
    affiliation?: string
  }>
  abstract?: string
  keywords?: string[]
  publicationDate?: string
  doi?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
}
```

### `PDFCitation`

```typescript
{
  id: string
  authors?: string[]
  title?: string
  journal?: string
  year?: number
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  rawText?: string
}
```

### `PDFSection`

```typescript
{
  heading?: string
  content: string
  subsections?: PDFSection[]
}
```

## Performance

### Processing Times (approximate)

- **Header only**: 2-5 seconds
- **With citations**: 5-10 seconds  
- **Full text**: 10-30 seconds (varies by PDF size)

### Throughput

- Single instance: ~3-5 PDFs per second
- Scale horizontally for higher throughput

### Resource Usage

- Memory: ~2-4GB per GROBID instance
- CPU: 1-2 cores recommended

## Error Handling

The module handles errors gracefully:

```typescript
const result = await processPDF({ pdfPath: './paper.pdf' })

if (!result.success) {
  console.error('Processing failed:', result.error)
  // Handle error appropriately
}
```

Common errors:
- **GROBID unavailable**: Service not running or unreachable
- **File too large**: Exceeds GROBID_MAX_FILE_SIZE
- **Invalid PDF**: Corrupt or non-PDF file
- **Timeout**: Processing took longer than GROBID_TIMEOUT

## Integration with Citation APIs

Extracted DOIs can be validated using the citation API client:

```typescript
import { processPDF } from '@/lib/pdf'
import { validateDOI } from '@/lib/api/citation-client'

const result = await processPDF({
  pdfPath: './paper.pdf',
  extractCitations: true
})

// Validate extracted DOIs
for (const citation of result.citations) {
  if (citation.doi) {
    const isValid = await validateDOI(citation.doi)
    console.log(`${citation.title}: ${isValid ? 'Valid' : 'Invalid'}`)
  }
}
```

## Testing

Run the test suite:

```bash
# Requires GROBID service running
docker-compose up -d grobid

# Run tests
npm test -- tests/pdf-processing.test.ts
```

Tests will be skipped if GROBID is not available.

## Production Deployment

For production:

1. **Scale horizontally**: Run multiple GROBID instances
2. **Load balancing**: Distribute requests across instances
3. **Monitoring**: Track processing times and error rates
4. **Caching**: Cache results for frequently accessed PDFs
5. **Queue system**: Process PDFs asynchronously with job queue

Example production Docker Compose:

```yaml
services:
  grobid:
    image: lfoppiano/grobid:0.8.0
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G
    environment:
      - JAVA_OPTS=-Xmx8g
```

## Limitations

- Maximum PDF size: 50MB (configurable)
- Processing is synchronous (consider async queue for production)
- TEI XML parsing is simplified (works for most cases)
- Requires GROBID service running

## Further Reading

- [GROBID Documentation](https://grobid.readthedocs.io/)
- [GROBID Setup Guide](../docs/grobid-setup.md)
- [Citation API Client](../lib/api/README.md)
