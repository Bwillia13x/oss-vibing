# Developer Guide

## Overview

This guide helps developers contribute to and extend the OSS Vibing academic writing platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture](#architecture)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [API Development](#api-development)
6. [Database](#database)
7. [Deployment](#deployment)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- SQLite (development) or PostgreSQL (production)
- Redis (optional, for caching)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/Bwillia13x/oss-vibing.git
cd oss-vibing

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Environment Variables

Required variables (`.env`):

```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev
# DATABASE_URL="postgresql://..." # PostgreSQL for prod

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Redis Cache (optional)
REDIS_URL="redis://localhost:6379"

# API Keys
CROSSREF_EMAIL="your-email@example.com"
SEMANTIC_SCHOLAR_API_KEY="..."

# GROBID (PDF processing)
GROBID_URL="http://localhost:8070"
```

## Architecture

### Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Prisma ORM (SQLite/PostgreSQL)
- **Cache:** Redis (with in-memory fallback)
- **Authentication:** NextAuth.js
- **Testing:** Vitest
- **Styling:** Tailwind CSS

### Project Structure

```
oss-vibing/
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   │   ├── admin/       # Admin endpoints
│   │   ├── auth/        # Authentication
│   │   ├── documents/   # Document management
│   │   └── health/      # Health checks
│   ├── (routes)/        # Page routes
│   └── layout.tsx       # Root layout
├── lib/                 # Core library code
│   ├── auth/           # Authentication logic
│   ├── cache/          # Caching layer
│   ├── db/             # Database repositories
│   │   └── repositories/ # Data access layer
│   ├── lms/            # LMS integrations
│   ├── pdf/            # PDF processing
│   └── research-integrations.ts # Citation APIs
├── prisma/             # Database schema & migrations
├── tests/              # Test suites
│   ├── e2e/           # End-to-end tests
│   └── *.test.ts      # Unit/integration tests
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

### Key Concepts

**Repository Pattern:**
All database access goes through repository classes:

```typescript
// lib/db/repositories/document-repository.ts
export class DocumentRepository {
  constructor(private prisma: PrismaClient) {}
  
  async create(data: DocumentCreateInput) {
    return this.prisma.document.create({ data })
  }
  
  async findById(id: string) {
    return this.prisma.document.findUnique({ where: { id } })
  }
}
```

**Caching Layer:**
Automatic caching with Redis fallback:

```typescript
import { CacheService } from '@/lib/cache/cache-service'

const cache = new CacheService()
const data = await cache.get('key', async () => {
  // This fetches if not cached
  return await fetchData()
})
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `fix/*` - Bug fixes
- `hotfix/*` - Emergency fixes

### Commit Convention

Use conventional commits:

```bash
feat: add citation export to DOCX
fix: resolve PDF upload buffer issue
docs: update API reference
test: add E2E student workflow tests
refactor: improve cache service performance
```

### Code Style

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

**Style Guidelines:**
- Use TypeScript strict mode
- Prefer named exports
- Use async/await over promises
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Pull Request Process

1. Create feature branch from `develop`
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation
5. Submit PR with description
6. Address review feedback
7. Squash and merge

## Testing

### Test Structure

```
tests/
├── e2e/                        # End-to-end workflows
│   ├── admin-workflow.test.ts
│   ├── student-workflow.test.ts
│   └── instructor-workflow.test.ts
├── unit/                       # Unit tests
├── integration/                # Integration tests
└── *.test.ts                   # Feature-specific tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- student-workflow

# Run with coverage
npm run test:coverage

# Run E2E tests only
npm test -- e2e/

# Watch mode
npm test -- --watch
```

### Writing Tests

**Unit Test Example:**

```typescript
import { describe, it, expect } from 'vitest'
import { calculateStatistics } from '@/lib/statistics'

describe('calculateStatistics', () => {
  it('should calculate mean correctly', () => {
    const data = [1, 2, 3, 4, 5]
    const stats = calculateStatistics(data)
    expect(stats.mean).toBe(3)
  })
})
```

**E2E Test Example:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { DocumentRepository } from '@/lib/db/repositories/document-repository'

const prisma = new PrismaClient()
const repo = new DocumentRepository(prisma)

describe('Document Creation Workflow', () => {
  let userId: string
  
  beforeEach(async () => {
    const user = await createTestUser()
    userId = user.id
  })
  
  it('should create document with citations', async () => {
    const doc = await repo.create({
      title: 'Research Paper',
      content: 'Content',
      userId,
      citations: [{ doi: '10.1234/example', title: 'Paper' }]
    })
    
    expect(doc.citations).toHaveLength(1)
  })
})
```

**Mock Example:**

```typescript
import { vi } from 'vitest'

// Mock external API
vi.mock('@/lib/research-integrations', () => ({
  lookupDOI: vi.fn().mockResolvedValue({
    doi: '10.1234/test',
    title: 'Mocked Paper',
    authors: ['Smith, J.']
  })
}))
```

### Test Coverage Goals

- Overall: 80%+
- Critical paths: 90%+
- New features: 85%+
- Bug fixes: Include regression test

## API Development

### Creating an API Route

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  // Authentication
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Business logic
  const data = await fetchData()
  
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Validation
  if (!body.title) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }
  
  // Create resource
  const result = await createResource(body)
  
  return NextResponse.json(result, { status: 201 })
}
```

### API Best Practices

1. **Authentication:** Always check session/permissions
2. **Validation:** Validate all inputs
3. **Error Handling:** Return appropriate status codes
4. **Pagination:** Use for list endpoints
5. **Rate Limiting:** Implement for public APIs
6. **Caching:** Cache expensive operations
7. **Documentation:** Document request/response formats

### Error Handling

```typescript
try {
  const result = await riskyOperation()
  return NextResponse.json(result)
} catch (error) {
  console.error('Operation failed:', error)
  
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

## Database

### Schema Management

```bash
# Create migration
npx prisma migrate dev --name add_citations

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Writing Migrations

```prisma
// prisma/schema.prisma
model Document {
  id        String   @id @default(cuid())
  title     String
  content   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  citations Json?    // Store citations as JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}
```

### Repository Pattern

```typescript
// lib/db/repositories/document-repository.ts
export class DocumentRepository {
  constructor(private prisma: PrismaClient) {}
  
  async create(data: DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({ data })
  }
  
  async findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({ where: { id } })
  }
  
  async findByUserId(userId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }
  
  async update(id: string, data: Partial<Document>): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data
    })
  }
  
  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({ where: { id } })
  }
}
```

### Query Optimization

```typescript
// Bad: N+1 query problem
const documents = await prisma.document.findMany()
for (const doc of documents) {
  const user = await prisma.user.findUnique({ where: { id: doc.userId } })
}

// Good: Use include
const documents = await prisma.document.findMany({
  include: { user: true }
})
```

## Deployment

### Redis Setup

See `/docs/REDIS-DEPLOYMENT-GUIDE.md` for detailed instructions.

**Quick Start:**

```bash
# Using Upstash (recommended)
1. Create account at console.upstash.com
2. Create Redis database
3. Copy REDIS_URL to environment variables
4. Deploy application
5. Validate: node scripts/validate-redis.js --url https://your-app.com
```

### Environment Setup

**Staging:**
```bash
# .env.staging
DATABASE_URL="postgresql://staging-db..."
REDIS_URL="redis://staging-redis..."
NEXTAUTH_URL="https://staging.yourapp.com"
```

**Production:**
```bash
# .env.production
DATABASE_URL="postgresql://prod-db..."
REDIS_URL="redis://prod-redis..."
NEXTAUTH_URL="https://yourapp.com"
```

### Deployment Checklist

- [ ] All tests passing
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Redis connection validated
- [ ] Security audit completed (CodeQL)
- [ ] Performance benchmarks met
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Monitoring

**Health Checks:**
```bash
# Application health
GET /api/health

# Cache health
GET /api/health/cache

# Database health
GET /api/health/db
```

**Metrics:**
- Response times (target: p95 < 200ms)
- Error rates (target: < 0.1%)
- Cache hit rate (target: > 70%)
- Database query performance

## Contributing

### Getting Help

- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas
- Pull Requests: Submit code contributions

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on technical merit
- Welcome newcomers

### License

MIT License - see LICENSE file for details

## Additional Resources

- [API Reference](/docs/API-REFERENCE.md)
- [User Guide](/docs/USER-GUIDE.md)
- [Admin Guide](/docs/ADMIN-GUIDE.md)
- [FERPA Compliance](/docs/FERPA-COMPLIANCE.md)
- [Security Audit Checklist](/docs/SECURITY-AUDIT-CHECKLIST.md)
