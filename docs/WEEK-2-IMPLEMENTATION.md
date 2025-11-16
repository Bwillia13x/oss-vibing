# Week 2 Implementation Guide: Redis Deployment & Test Expansion

## Overview

Week 2 focuses on:
1. Deploy Redis to production (Upstash)
2. Continue test coverage expansion (60% → 80%)
3. Validate performance metrics

## Day 1: Deploy Redis to Staging

### Upstash Setup (Recommended)

Upstash provides serverless Redis with:
- Global edge deployment
- Automatic scaling
- Pay-per-request pricing
- Built-in TLS/SSL
- Compatible with ioredis

**Steps:**

1. **Create Upstash Account**
   - Go to [upstash.com](https://upstash.com)
   - Sign up with GitHub or email
   - Verify email

2. **Create Redis Database**
   ```
   - Click "Create Database"
   - Name: vibe-university-staging
   - Region: Choose closest to your users (US East recommended)
   - Type: Regional (for best latency) or Global (for multi-region)
   - TLS: Enabled (default)
   - Eviction: allkeys-lru (recommended)
   ```

3. **Get Connection Details**
   ```
   After creation, copy:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
   - Redis URL (for ioredis)
   ```

4. **Configure Environment Variables**

   **For Vercel:**
   ```bash
   # Add to Vercel project environment variables
   vercel env add REDIS_URL
   # Paste: rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
   
   # Or use Vercel CLI
   vercel env pull .env.local
   ```

   **For other platforms:**
   ```bash
   # Add to .env.production
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
   REDIS_HOST=YOUR_ENDPOINT.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=YOUR_PASSWORD
   ```

5. **Verify Connection**
   ```bash
   # Test locally with staging credentials
   REDIS_URL=rediss://... npm run dev
   
   # Check connection in browser console
   # Open /api/health or similar endpoint
   ```

### Alternative: Vercel KV

If deploying to Vercel, consider Vercel KV (built on Upstash):

```bash
# Install Vercel CLI
npm install -g vercel

# Create KV database
vercel kv create

# Link to project
vercel link

# Environment variables auto-configured
```

## Day 2: Performance Validation & Metrics

### 1. Add Performance Tracking

Create `/lib/cache/performance-tracker.ts`:

```typescript
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  totalKeys: number;
  memoryUsage: number;
}

export async function collectCacheMetrics(): Promise<CacheMetrics> {
  const stats = await getCacheStats();
  
  return {
    hits: stats.memoryHits,
    misses: stats.memoryMisses,
    hitRate: (stats.memoryHits / (stats.memoryHits + stats.memoryMisses)) * 100,
    avgResponseTime: stats.avgResponseTime || 0,
    p95ResponseTime: stats.p95ResponseTime || 0,
    totalKeys: stats.totalKeys || 0,
    memoryUsage: stats.memoryUsage || 0,
  };
}
```

### 2. Create Health Check Endpoint

Create `/app/api/health/cache/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { isRedisConnected, pingRedis } from '@/lib/cache/redis-client';
import { getCacheStats } from '@/lib/cache/cache-service';

export async function GET() {
  const connected = isRedisConnected();
  const pingResult = await pingRedis();
  const stats = await getCacheStats();

  return NextResponse.json({
    redis: {
      connected,
      ping: pingResult,
    },
    cache: stats,
    status: connected ? 'healthy' : 'degraded',
  });
}
```

### 3. Performance Benchmarks

Target metrics from Sprint 3:
- ✅ Cache hit rate > 70%
- ✅ API response times < 200ms (p95)
- ✅ Build time < 10s
- ✅ Page load < 2s

## Day 3: Continue Test Expansion

### Priority Areas for 60% → 80%

1. **AI Tools** (Currently: 32.22%)
   - Add tests for AI-powered features
   - Mock OpenAI/LLM responses
   - Test error handling

2. **Database Repositories** (Currently: 54.62%)
   - Add CRUD operation tests
   - Test error scenarios
   - Validate data integrity

3. **Monitoring** (Currently: 53.57%)
   - Test metric collection
   - Validate logging
   - Error tracking tests

4. **Collaboration** (Currently: 46.07%)
   - More WebSocket tests
   - Yjs CRDT tests
   - Persistence tests

### Test Templates

```typescript
// Template for AI tools tests
describe('AI Tools - Extended Coverage', () => {
  it('should handle AI responses', async () => {
    // Mock AI service
    // Test processing
    // Validate output
  });
});

// Template for database tests
describe('Database Repositories', () => {
  it('should perform CRUD operations', async () => {
    // Create record
    // Read record
    // Update record
    // Delete record
  });
});
```

## Day 4: Redis Production Deployment

### Pre-deployment Checklist

- [ ] Staging Redis tested and validated
- [ ] Performance metrics collected
- [ ] Cache hit rate measured
- [ ] Response times verified
- [ ] Error handling tested
- [ ] Monitoring configured
- [ ] Backup strategy defined
- [ ] Rollback plan prepared

### Production Deployment Steps

1. **Create Production Redis Instance**
   - Name: vibe-university-production
   - Region: Same as application
   - Type: Regional with read replicas
   - TLS: Required
   - Max memory: Based on staging usage

2. **Configure Production Environment**
   ```bash
   # Set in production environment
   REDIS_URL=rediss://default:PROD_PASSWORD@prod-endpoint.upstash.io:6379
   NODE_ENV=production
   ```

3. **Deploy Application**
   ```bash
   # Using Vercel
   vercel --prod
   
   # Or your deployment method
   npm run build
   npm run start
   ```

4. **Validate Deployment**
   ```bash
   # Check health endpoint
   curl https://your-domain.com/api/health/cache
   
   # Monitor logs
   vercel logs --prod
   ```

### Post-Deployment Validation

1. **Check Cache Hit Rate**
   ```bash
   # Should be > 70% within 1 hour
   curl https://your-domain.com/api/health/cache | jq .cache.hitRate
   ```

2. **Monitor Response Times**
   ```bash
   # p95 should be < 200ms
   curl https://your-domain.com/api/health/cache | jq .cache.p95ResponseTime
   ```

3. **Verify Redis Connection**
   ```bash
   # Connection should be healthy
   curl https://your-domain.com/api/health/cache | jq .redis.connected
   ```

## Day 5: Performance Optimization

### Cache Warming Strategy

```typescript
// Warm cache on startup
export async function warmProductionCache() {
  console.log('Starting cache warming...');
  
  // Popular citations
  const popularDOIs = await getTopCitations(100);
  for (const doi of popularDOIs) {
    await getCitationWithCache(doi);
  }
  
  // Frequently accessed documents
  const recentDocs = await getRecentDocuments(50);
  for (const doc of recentDocs) {
    await getDocumentWithCache(doc.id);
  }
  
  console.log('Cache warming complete');
}
```

### Monitoring Dashboard

Metrics to track:
1. Cache hit/miss ratio
2. Response time distribution
3. Redis memory usage
4. Connection count
5. Error rate

### Performance Tuning

```typescript
// Optimize TTL values based on access patterns
export const PRODUCTION_TTL = {
  CITATION: 604800,      // 7 days (stable)
  SESSION: 3600,         // 1 hour (dynamic)
  ANALYTICS: 300,        // 5 minutes (computed)
  METADATA: 3600,        // 1 hour (semi-static)
  SEARCH_RESULTS: 1800,  // 30 minutes (moderate)
};
```

## Success Criteria

**Week 2 Completion Requirements:**

- [ ] Redis deployed to staging ✓
- [ ] Redis deployed to production ✓
- [ ] Cache hit rate > 70% verified
- [ ] Response times < 200ms (p95) verified
- [ ] Test coverage 60% → 80%
- [ ] Performance metrics documented
- [ ] Monitoring dashboard configured
- [ ] Rollback procedures tested

## Rollback Plan

If issues arise:

1. **Disable Redis**
   ```bash
   # Remove REDIS_URL from environment
   vercel env rm REDIS_URL production
   
   # Application auto-falls back to memory cache
   ```

2. **Revert Deployment**
   ```bash
   # Vercel
   vercel rollback
   
   # Or redeploy previous version
   git revert HEAD
   vercel --prod
   ```

3. **Investigate Issues**
   - Check error logs
   - Review metrics
   - Test in staging

## Documentation Updates

Update after Week 2:
- [ ] REDIS-CACHING.md with production details
- [ ] README.md with deployment status
- [ ] Admin guide with cache management
- [ ] Developer guide with best practices

## Next Steps (Week 3)

- E2E workflow tests
- Documentation completion
- Training materials
- Buffer for delays

---

**Last Updated**: November 16, 2025  
**Owner**: Engineering Team  
**Status**: Ready for execution
