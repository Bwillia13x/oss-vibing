# GROBID Setup Guide

GROBID (GeneRation Of BIbliographic Data) is a machine learning library for extracting, parsing, and re-structuring raw documents such as PDF into structured TEI-encoded documents with a particular focus on technical and scientific publications.

## Overview

GROBID is used in Vibe University to:
- Extract metadata from PDF files (title, authors, abstract, references)
- Parse citations and bibliographic information
- Extract structured content from academic papers
- Support the PDF processing pipeline

## Prerequisites

- Docker installed on your system
- At least 4GB of RAM available
- Port 8070 available (default GROBID port)

## Quick Start with Docker

### 1. Pull the GROBID Docker Image

```bash
docker pull lfoppiano/grobid:0.8.0
```

### 2. Run GROBID Service

```bash
docker run --rm -it -p 8070:8070 lfoppiano/grobid:0.8.0
```

Or run in detached mode:

```bash
docker run -d --name grobid -p 8070:8070 lfoppiano/grobid:0.8.0
```

### 3. Verify Service is Running

```bash
curl http://localhost:8070/api/isalive
```

Expected response: `true`

## Docker Compose Setup (Recommended)

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3'

services:
  grobid:
    image: lfoppiano/grobid:0.8.0
    container_name: vibe-grobid
    ports:
      - "8070:8070"
    environment:
      # Increase memory if processing large PDFs
      - JAVA_OPTS=-Xmx4g
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8070/api/isalive"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Start the service:

```bash
docker-compose up -d grobid
```

Stop the service:

```bash
docker-compose down
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# GROBID Service Configuration
GROBID_URL=http://localhost:8070
GROBID_TIMEOUT=30000  # 30 seconds
GROBID_MAX_FILE_SIZE=52428800  # 50MB
```

### Production Configuration

For production deployment, consider:

1. **Scaling**: Run multiple GROBID instances behind a load balancer
2. **Memory**: Allocate more memory for large PDFs (`-Xmx8g` or more)
3. **Network**: Use internal network, don't expose port 8070 publicly
4. **Monitoring**: Add health checks and monitoring

Example production setup:

```yaml
version: '3'

services:
  grobid:
    image: lfoppiano/grobid:0.8.0
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 8G
        reservations:
          cpus: '1'
          memory: 4G
    environment:
      - JAVA_OPTS=-Xmx8g
    networks:
      - internal
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8070/api/isalive"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "8070:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - grobid
    networks:
      - internal
      - public

networks:
  internal:
    internal: true
  public:
```

## API Endpoints

### Process Full Text PDF

Extract complete structured data from a PDF:

```bash
curl -X POST \
  -F "input=@paper.pdf" \
  http://localhost:8070/api/processFulltextDocument
```

### Process Header Only

Extract just the header metadata (faster):

```bash
curl -X POST \
  -F "input=@paper.pdf" \
  http://localhost:8070/api/processHeaderDocument
```

### Process Citations

Extract only references/citations:

```bash
curl -X POST \
  -F "input=@paper.pdf" \
  http://localhost:8070/api/processReferences
```

## Usage in Vibe University

The PDF processor in `lib/pdf/processor.ts` uses GROBID to:

1. **Extract metadata**: Title, authors, abstract, keywords
2. **Parse structure**: Sections, paragraphs, figures, tables
3. **Extract citations**: Bibliographic references with metadata
4. **Generate structured output**: TEI XML format converted to JSON

Example usage:

```typescript
import { processPDF } from '@/lib/pdf/processor'

const result = await processPDF({
  pdfPath: './paper.pdf',
  extractCitations: true,
  extractFullText: true,
})

console.log(result.metadata.title)
console.log(result.citations.length)
```

## Performance Considerations

### Processing Time

- Header only: ~2-5 seconds per PDF
- Full text: ~10-30 seconds per PDF (depending on size)
- References only: ~5-10 seconds per PDF

### Resource Usage

- Memory: ~2-4GB per instance
- CPU: 1-2 cores recommended per instance
- Disk: Minimal (no persistent storage needed)

### Rate Limiting

GROBID can handle approximately:
- 3-5 requests per second per instance
- ~300-500 PDFs per hour per instance

For higher throughput, scale horizontally with multiple instances.

## Troubleshooting

### Service Won't Start

```bash
# Check if port is in use
lsof -i :8070

# Check Docker logs
docker logs grobid

# Try with more memory
docker run -e JAVA_OPTS=-Xmx8g -p 8070:8070 lfoppiano/grobid:0.8.0
```

### Timeout Errors

Increase timeout in environment variables or use streaming for large files:

```bash
GROBID_TIMEOUT=60000  # 60 seconds
```

### Out of Memory Errors

Increase JVM heap size:

```bash
docker run -e JAVA_OPTS=-Xmx8g -p 8070:8070 lfoppiano/grobid:0.8.0
```

### Slow Processing

- Use header-only extraction if full text not needed
- Process PDFs in parallel (but respect rate limits)
- Cache results to avoid reprocessing

## Testing

Test GROBID is working correctly:

```bash
# Download a sample PDF
curl -o test.pdf https://arxiv.org/pdf/2301.00000.pdf

# Process it
curl -X POST -F "input=@test.pdf" \
  http://localhost:8070/api/processHeaderDocument \
  > output.xml

# Check output
cat output.xml
```

## Development

For local development:

```bash
# Start GROBID
docker-compose up -d grobid

# Check it's running
curl http://localhost:8070/api/isalive

# Run tests
npm test -- tests/pdf-processing.test.ts
```

## References

- [GROBID Official Documentation](https://grobid.readthedocs.io/)
- [GROBID Docker Hub](https://hub.docker.com/r/lfoppiano/grobid)
- [GROBID GitHub](https://github.com/kermitt2/grobid)
- [TEI XML Format](https://tei-c.org/)

## Security Considerations

1. **Network Security**: Don't expose GROBID port publicly
2. **Input Validation**: Validate PDF files before processing
3. **Resource Limits**: Set memory and CPU limits to prevent DoS
4. **File Size Limits**: Limit PDF size to prevent memory issues
5. **Authentication**: Add authentication layer if exposing API

## License

GROBID is licensed under Apache License 2.0.
