# Redis Deployment Guide - Quick Start

## Prerequisites

- ✅ Code deployed (Week 1 complete)
- ✅ Health check endpoint ready (`/api/health/cache`)
- ✅ Validation script ready (`scripts/validate-redis.js`)
- [ ] Upstash account (or alternative Redis provider)
- [ ] Deployment platform access (Vercel, etc.)

## Deployment Steps

### Step 1: Create Upstash Redis Database

**Option A: Upstash (Recommended)**

1. Go to https://console.upstash.com
2. Click "Create Database"
3. Configure:
   - Name: `oss-vibing-staging` or `oss-vibing-production`
   - Region: Choose closest to your app deployment
   - Type: Regional or Global (Global for multi-region)
   - TLS: Enabled (default)
4. Click "Create"
5. Copy the `REDIS_URL` from dashboard
   - Format: `rediss://:PASSWORD@HOST:PORT`

**Option B: Vercel KV (if using Vercel)**

1. Go to Vercel project dashboard
2. Navigate to Storage tab
3. Create KV Database
4. Copy environment variables automatically added

**Option C: Redis Cloud**

1. Go to https://redis.com/cloud/
2. Create free tier database
3. Configure TLS and get connection URL

### Step 2: Configure Environment Variables

**For Staging:**

```bash
# Copy staging template
cp .env.redis.staging .env.local

# Edit .env.local and add your REDIS_URL
# REDIS_URL=rediss://:your-password@your-host.upstash.io:6379
```

**For Vercel/Production:**

1. Go to project settings → Environment Variables
2. Add:
   ```
   REDIS_URL=rediss://:your-password@your-host.upstash.io:6379
   NODE_ENV=production
   REDIS_TTL=3600
   ```
3. Select environments: Production, Preview, Development (as needed)
4. Save

### Step 3: Deploy Application

**Vercel:**
```bash
# Deploy to staging/preview
vercel

# Deploy to production
vercel --prod
```

**Other platforms:**
- Follow platform-specific deployment process
- Ensure environment variables are set

### Step 4: Validate Deployment

**Local validation (if testing locally):**
```bash
# Start app with Redis URL
REDIS_URL="your-redis-url" npm run dev

# In another terminal, run validator
node scripts/validate-redis.js
```

**Production validation:**
```bash
# Validate staging
node scripts/validate-redis.js --url https://your-app-staging.vercel.app

# Validate production
node scripts/validate-redis.js --url https://your-app.vercel.app
```

**Manual validation:**
```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health/cache

# Expected response:
# {
#   "status": "healthy",
#   "redis": { "connected": true, "ping": "PONG" },
#   "cache": { "hitRate": "X%" },
#   "performance": { ... }
# }
```

### Step 5: Monitor Performance

**Week 1 (Initial monitoring):**
- Run validation script daily
- Monitor cache hit rate (target: >70%)
- Monitor API latency (target: <200ms p95)
- Check for errors in logs

**Ongoing:**
- Set up alerts for Redis disconnections
- Monitor Upstash dashboard for usage patterns
- Optimize TTL values based on hit rate
- Review cache keys and access patterns

## Troubleshooting

### Redis not connecting

**Check:**
```bash
# Verify REDIS_URL format
echo $REDIS_URL

# Should start with rediss:// (with TLS)
# Format: rediss://:PASSWORD@HOST:PORT
```

**Common issues:**
- Wrong URL format (should be `rediss://` not `redis://`)
- Missing password
- Network/firewall blocking connection
- Upstash database not running

**Solutions:**
- Regenerate credentials in Upstash dashboard
- Check deployment logs for connection errors
- Verify TLS is enabled
- Test connection with Redis CLI: `redis-cli -u $REDIS_URL ping`

### Low cache hit rate

**Possible causes:**
- Cache recently deployed (needs warming)
- TTL too short
- Cache keys not consistent
- Low traffic

**Solutions:**
- Run app for 24-48 hours to warm cache
- Increase TTL values if appropriate
- Review cache key generation logic
- Monitor specific endpoints

### High latency

**Possible causes:**
- Redis instance far from app
- Network latency
- Large cached values
- Redis instance overloaded

**Solutions:**
- Move Redis to same region as app
- Upgrade Upstash plan if on free tier
- Optimize cached data size
- Add compression for large values

## Success Criteria

✅ **Staging Validation (Day 1-2)**
- [ ] Redis connected: `true`
- [ ] Health endpoint responding
- [ ] No connection errors in logs

✅ **Performance Validation (Day 3-7)**
- [ ] Cache hit rate: >70%
- [ ] API p95 latency: <200ms
- [ ] No degraded performance vs. memory fallback

✅ **Production Ready (Day 7-14)**
- [ ] Staging stable for 1 week
- [ ] Performance targets met
- [ ] Monitoring alerts configured
- [ ] Rollback plan tested

## Rollback Plan

If issues occur:

1. **Immediate rollback:**
   ```bash
   # Remove REDIS_URL environment variable
   # App will fall back to memory cache
   vercel env rm REDIS_URL production
   ```

2. **Redeploy without Redis:**
   ```bash
   vercel --prod
   ```

3. **App continues working:**
   - Memory fallback is automatic
   - No data loss (cache only)
   - Performance may decrease slightly

## Next Steps After Deployment

1. **Week 2 remaining:**
   - Continue test expansion to 60%+
   - Monitor Redis performance
   - Optimize based on metrics

2. **Week 3:**
   - Add E2E tests
   - Update documentation
   - Create training materials

3. **Week 4:**
   - Performance optimization
   - Security audit
   - Final production hardening
