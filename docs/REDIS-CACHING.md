# Redis Caching Implementation Guide

## Overview

This guide covers the Redis caching implementation for Vibe University, designed to achieve Sprint 3 performance targets:
- Cache hit rate > 70%
- API response times < 200ms (95th percentile)

## Table of Contents

1. [Architecture](#architecture)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Cache Strategies](#cache-strategies)
5. [Performance Monitoring](#performance-monitoring)
6. [Troubleshooting](#troubleshooting)

## Architecture

### Components

1. **Redis Client** (`lib/cache/redis-client.ts`)
   - Singleton pattern for connection management
   - Graceful degradation when Redis unavailable
   - Automatic retry logic

2. **Cache Service** (`lib/cache/cache-service.ts`)
   - High-level caching interface
   - TTL (Time-To-Live) management
   - Pattern-based cache invalidation
   - Memory fallback when Redis unavailable

3. **Cache Monitoring** (`lib/monitoring.ts`)
   - Hit/miss rate tracking
   - Performance metrics
   - Response time monitoring

## Local Development Setup

### Option 1: Docker (Recommended)

Add to `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: vibe-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis-data:
```

Start Redis:
```bash
docker-compose up -d redis
```

### Option 2: Native Installation

**macOS (Homebrew)**:
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Windows**:
```bash
# Using Windows Subsystem for Linux (WSL)
wsl --install
# Then follow Ubuntu instructions above
```

### Environment Configuration

Add to `.env.local`:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_password  # Uncomment for production
REDIS_DB=0
```

### Verify Installation

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Or use Node.js
node -e "const Redis = require('ioredis'); const redis = new Redis('redis://localhost:6379'); redis.ping().then(res => console.log(res)).then(() => redis.quit());"
```

## Production Deployment

### Managed Redis Options

#### Option 1: Vercel KV (Recommended for Vercel deployments)

```bash
# Install Vercel CLI
npm install -g vercel

# Create KV store
vercel kv create

# Link to your project
vercel link
```

Environment variables are automatically set. Vercel KV is based on Redis.

#### Option 2: Upstash (Serverless Redis)

1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy connection string
4. Add to environment variables:

```bash
REDIS_URL=rediss://default:xxxxx@us1-xxx.upstash.io:6379
```

#### Option 3: Redis Cloud

1. Sign up at [redis.com/cloud](https://redis.com/cloud)
2. Create a subscription
3. Configure connection:

```bash
REDIS_URL=rediss://default:password@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
REDIS_PASSWORD=your_secure_password
```

#### Option 4: AWS ElastiCache

1. Create ElastiCache Redis cluster in AWS Console
2. Note the endpoint
3. Configure:

```bash
REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379
```

### Security Configuration

#### Enable TLS (Production)

```typescript
// lib/cache/redis-client.ts
const redis = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: true,
  },
  // ... other options
});
```

#### Password Authentication

```bash
# In .env
REDIS_PASSWORD=your_strong_password_here
```

#### Network Security

- Use VPC peering for AWS/GCP
- Whitelist application IP addresses
- Use private networking when possible
- Enable Redis AUTH
- Disable dangerous commands (CONFIG, FLUSHALL)

## Cache Strategies

### TTL (Time-To-Live) Configuration

Defined in `lib/cache/cache-service.ts`:

```typescript
export const DEFAULT_TTL = {
  SHORT: 60,           // 1 minute - frequently changing data
  MEDIUM: 300,         // 5 minutes - semi-static data
  LONG: 3600,          // 1 hour - stable data  
  VERY_LONG: 86400,    // 24 hours - rarely changing data
  CITATION: 604800,    // 7 days - citations rarely change
};
```

### Caching Patterns

#### 1. Citation API Results (High Priority)

**Why**: External API calls are expensive and slow
**TTL**: 7 days (citations rarely change)

```typescript
import { getOrSetCached, DEFAULT_TTL, generateCacheKey } from '@/lib/cache/cache-service';
import { lookupDOI } from '@/lib/api/crossref';

async function getCitationWithCache(doi: string) {
  const cacheKey = generateCacheKey('citation', 'crossref', doi);
  
  return getOrSetCached(
    cacheKey,
    async () => await lookupDOI(doi),
    DEFAULT_TTL.CITATION
  );
}
```

#### 2. User Sessions (Medium Priority)

**Why**: Reduce database queries for authentication
**TTL**: 1 hour

```typescript
const cacheKey = generateCacheKey('session', userId);
return getOrSetCached(cacheKey, fetchSession, DEFAULT_TTL.LONG);
```

#### 3. Analytics Data (High Priority)

**Why**: Complex aggregations are expensive
**TTL**: 5 minutes

```typescript
const cacheKey = generateCacheKey('analytics', institutionId, period);
return getOrSetCached(cacheKey, computeAnalytics, DEFAULT_TTL.MEDIUM);
```

#### 4. Document Metadata (Medium Priority)

**Why**: Frequently accessed, infrequently changed
**TTL**: 1 hour

```typescript
const cacheKey = generateCacheKey('document', 'meta', documentId);
return getOrSetCached(cacheKey, fetchMetadata, DEFAULT_TTL.LONG);
```

### Cache Invalidation

#### Pattern-Based Invalidation

```typescript
import { deleteCachedPattern } from '@/lib/cache/cache-service';

// When user updates profile
await deleteCachedPattern(`session:${userId}:*`);
await deleteCachedPattern(`user:${userId}:*`);

// When institution data changes
await deleteCachedPattern(`analytics:${institutionId}:*`);

// When document is updated
await deleteCachedPattern(`document:*:${documentId}`);
```

#### Explicit Invalidation

```typescript
import { deleteCached } from '@/lib/cache/cache-service';

// Single key invalidation
await deleteCached(`session:${userId}`);
```

#### Cache-Aside Pattern

```typescript
// 1. Check cache
const cached = await getCached(key);
if (cached) return cached;

// 2. Fetch from source
const data = await fetchFromDB();

// 3. Update cache
await setCached(key, data, ttl);

// 4. Return data
return data;
```

#### Write-Through Pattern

```typescript
// Update both cache and database
async function updateUser(userId: string, data: UserData) {
  // 1. Update database
  const user = await db.user.update({ where: { id: userId }, data });
  
  // 2. Update cache
  const cacheKey = generateCacheKey('user', userId);
  await setCached(cacheKey, user, DEFAULT_TTL.LONG);
  
  // 3. Invalidate related caches
  await deleteCachedPattern(`session:${userId}:*`);
  
  return user;
}
```

## Performance Monitoring

### Cache Statistics

```typescript
import { getCacheStats } from '@/lib/cache/cache-service';

const stats = await getCacheStats();
console.log({
  memoryHits: stats.memoryHits,
  memoryMisses: stats.memoryMisses,
  hitRate: (stats.memoryHits / (stats.memoryHits + stats.memoryMisses)) * 100
});
```

### API Performance Tracking

```typescript
import { trackApiPerformance } from '@/lib/monitoring';

const result = await trackApiPerformance('crossref-lookup', async () => {
  return await getCitationWithCache(doi);
});
```

### Redis Monitoring Commands

```bash
# Check Redis info
redis-cli INFO

# Monitor cache hit rate
redis-cli INFO stats | grep keyspace

# See current keys
redis-cli KEYS "*"

# Check memory usage
redis-cli INFO memory

# Monitor commands in real-time
redis-cli MONITOR
```

### Performance Targets

**Sprint 3 Goals**:
- ✅ Cache hit rate > 70%
- ✅ API response time < 200ms (p95)
- ✅ Build time < 10s
- ✅ Page load < 2s

### Monitoring Dashboard

Set up monitoring to track:

1. **Cache Hit Rate**
   ```typescript
   const hitRate = (hits / (hits + misses)) * 100;
   // Target: > 70%
   ```

2. **Response Times**
   ```typescript
   const p95 = calculatePercentile(responseTimes, 95);
   // Target: < 200ms
   ```

3. **Memory Usage**
   ```bash
   redis-cli INFO memory | grep used_memory_human
   ```

4. **Connection Count**
   ```bash
   redis-cli INFO clients | grep connected_clients
   ```

## Cache Warming

### On Application Start

```typescript
// Warm up frequently accessed data
async function warmCache() {
  const popularDOIs = await getPopularDOIs();
  
  for (const doi of popularDOIs) {
    await getCitationWithCache(doi);
  }
  
  console.log(`Cache warmed with ${popularDOIs.length} citations`);
}
```

### Scheduled Warming

```typescript
import cron from 'node-cron';

// Refresh cache every 6 hours
cron.schedule('0 */6 * * *', async () => {
  await warmCache();
});
```

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to Redis

**Solutions**:
```bash
# Check if Redis is running
redis-cli ping

# Check connection details
echo $REDIS_URL

# Test connection with different host
redis-cli -h localhost -p 6379 ping

# Check firewall rules
sudo ufw status  # Ubuntu
```

### High Memory Usage

**Problem**: Redis memory growing too large

**Solutions**:
```bash
# Set max memory limit
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Or in redis.conf:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
```

### Low Cache Hit Rate

**Problem**: Hit rate below 70%

**Solutions**:
1. Increase TTL for stable data
2. Implement cache warming
3. Review cache key patterns
4. Check for cache invalidation bugs

```typescript
// Debug cache usage
const stats = await getCacheStats();
console.log('Hit rate:', stats.hitRate);

// Analyze most frequently accessed keys
// redis-cli --bigkeys
```

### Slow Performance

**Problem**: Cache not improving performance

**Checklist**:
- [ ] Verify Redis is actually being used (check stats)
- [ ] Ensure network latency is low (< 5ms to Redis)
- [ ] Check if keys are being cached (monitor hit rate)
- [ ] Verify TTL values are appropriate
- [ ] Look for serialization/deserialization overhead

### Memory Fallback Mode

**Problem**: Application running without Redis

**Behavior**: Automatic fallback to in-memory caching

```typescript
// Check if Redis is connected
import { isRedisConnected } from '@/lib/cache/redis-client';

if (!isRedisConnected()) {
  console.warn('Redis unavailable, using memory fallback');
}
```

## Best Practices

1. **Use Appropriate TTLs**
   - Short TTL for frequently changing data
   - Long TTL for stable data
   - Consider data freshness requirements

2. **Implement Cache Invalidation**
   - Invalidate on updates/deletes
   - Use pattern matching for related keys
   - Don't cache everything forever

3. **Monitor Performance**
   - Track hit rates
   - Monitor response times
   - Set up alerts for anomalies

4. **Handle Failures Gracefully**
   - Don't fail if cache is unavailable
   - Log cache errors
   - Have fallback mechanisms

5. **Security**
   - Use TLS in production
   - Set strong passwords
   - Limit network access
   - Regular security audits

6. **Cost Optimization**
   - Right-size your Redis instance
   - Use compression for large values
   - Implement eviction policies
   - Monitor memory usage

## Testing

### Unit Tests

```typescript
import { getCached, setCached } from '@/lib/cache/cache-service';

test('should cache and retrieve data', async () => {
  await setCached('test-key', { foo: 'bar' }, 60);
  const result = await getCached('test-key');
  expect(result).toEqual({ foo: 'bar' });
});
```

### Integration Tests

```typescript
test('should handle Redis unavailability', async () => {
  // Simulate Redis being down
  const result = await getCachedApiResponse('some-key');
  expect(result).toBeNull(); // Graceful degradation
});
```

## Performance Checklist

Sprint 3 requirements:
- [x] Redis client implemented with retry logic
- [x] Cache service with TTL support
- [x] Pattern-based invalidation
- [x] Monitoring and metrics
- [ ] Cache hit rate > 70% (needs production deployment)
- [ ] API response times < 200ms (needs measurement)
- [ ] Production deployment
- [ ] Performance testing

## References

- [Redis Documentation](https://redis.io/docs/)
- [ioredis GitHub](https://github.com/luin/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Caching Strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/Strategies.html)

---

**Last Updated**: November 16, 2025  
**Version**: 1.0  
**Maintained By**: Engineering Team
