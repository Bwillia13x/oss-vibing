# Production Deployment Checklist

This checklist ensures all critical steps are completed before and after production deployment.

## Pre-Deployment Checks

### Code Quality
- [ ] All tests passing (585/585)
- [ ] TypeScript build successful with no errors
- [ ] ESLint checks passing
- [ ] Code review completed and approved
- [ ] No TODO or FIXME comments in critical paths

### Security
- [ ] CodeQL analysis completed: 0 alerts
- [ ] All dependencies updated to latest secure versions
- [ ] Security headers configured in next.config.js
- [ ] HTTPS enforced (no HTTP access allowed)
- [ ] Environment variables secured (not in version control)
- [ ] API keys rotated for production
- [ ] CORS configured appropriately
- [ ] Rate limiting enabled on all public endpoints

### Performance
- [ ] Production build optimized (bundle size checked)
- [ ] Database indexes verified
- [ ] Caching strategy implemented
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Compression enabled (Gzip/Brotli)

### Infrastructure
- [ ] Production database created (PostgreSQL)
- [ ] Redis cache deployed (Upstash recommended)
- [ ] Database backups configured (daily automated)
- [ ] Monitoring tools configured
- [ ] Logging aggregation setup
- [ ] Error tracking configured (Sentry or similar)

### Documentation
- [ ] Admin guide published
- [ ] Developer guide published
- [ ] Training materials ready
- [ ] API documentation complete
- [ ] Runbook for common issues created
- [ ] Rollback procedure documented

### Environment Configuration
- [ ] Production environment variables set:
  - [ ] DATABASE_URL (PostgreSQL connection string)
  - [ ] REDIS_URL (Redis connection string with TLS)
  - [ ] NEXTAUTH_URL (production domain)
  - [ ] NEXTAUTH_SECRET (secure random 32+ characters)
  - [ ] GOOGLE_CLIENT_ID (OAuth credentials)
  - [ ] GOOGLE_CLIENT_SECRET (OAuth credentials)
  - [ ] CROSSREF_EMAIL (API rate limit increases)
  - [ ] GROBID_URL (if using external service)
- [ ] Verify no development credentials in production

### Data Migration
- [ ] SQLite data exported
- [ ] PostgreSQL schema created via Prisma migrations
- [ ] Data imported to PostgreSQL
- [ ] Data integrity verified (row counts, relationships)
- [ ] Test queries executed successfully
- [ ] Backup of old database created

## Deployment Steps

### 1. Pre-Deploy
- [ ] Create deployment branch from main
- [ ] Tag release version (e.g., v1.0.0)
- [ ] Notify team of deployment window
- [ ] Put up maintenance page (if downtime expected)

### 2. Database Migration
```bash
# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma db pull
npx prisma generate
```

- [ ] Database backup created
- [ ] Migrations executed successfully
- [ ] Schema verified
- [ ] Test data queries successful

### 3. Redis Deployment
```bash
# Validate Redis connection
node scripts/validate-redis.js --url https://staging.yourdomain.com
```

- [ ] Upstash Redis database created
- [ ] REDIS_URL configured
- [ ] Connection verified
- [ ] Cache warming completed (optional)

### 4. Application Deployment

**Via Vercel:**
```bash
# Deploy to production
vercel --prod

# Verify deployment
vercel inspect <deployment-url>
```

- [ ] Application deployed
- [ ] Deployment URL verified
- [ ] Environment variables verified
- [ ] Custom domain configured
- [ ] SSL certificate verified

**Via Docker:**
```bash
# Build image
docker build -t app:v1.0.0 .

# Push to registry
docker push registry.example.com/app:v1.0.0

# Deploy to production
kubectl apply -f k8s/production.yaml
```

- [ ] Docker image built
- [ ] Image pushed to registry
- [ ] Deployment successful
- [ ] Health checks passing

### 5. Post-Deployment Verification

**Automated Checks:**
```bash
# Run E2E tests against production
npm run test:e2e:prod

# Validate Redis performance
node scripts/validate-redis.js --url https://app.yourdomain.com

# Check health endpoints
curl https://app.yourdomain.com/api/health/cache
```

- [ ] Health check endpoint returning 200 OK
- [ ] E2E tests passing against production
- [ ] Redis validation passed
- [ ] Database connectivity confirmed

**Manual Checks:**
- [ ] Homepage loads correctly
- [ ] User authentication works (sign-up, login, OAuth)
- [ ] Document creation successful
- [ ] Citation search and insertion works
- [ ] Document export (PDF, DOCX) works
- [ ] Collaboration features functional
- [ ] Admin panel accessible
- [ ] All user roles functioning correctly

### 6. Monitoring Setup
- [ ] Application metrics dashboard configured
- [ ] Error tracking active (Sentry, etc.)
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot)
- [ ] Log aggregation working (CloudWatch, Datadog)
- [ ] Alert notifications configured (Slack, email, PagerDuty)

### 7. Performance Validation

**Metrics to Check:**
- [ ] API response time (p95) < 200ms
- [ ] Cache hit rate > 70%
- [ ] Database query time (p95) < 100ms
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s

**Load Testing:**
```bash
# Run load test (if applicable)
artillery run load-test-config.yml
```

- [ ] Load test executed
- [ ] System stable under expected load
- [ ] Auto-scaling configured (if applicable)

## Post-Deployment (First 24-48 Hours)

### Monitoring
- [ ] Monitor error rates (target: < 1%)
- [ ] Monitor response times (target: p95 < 200ms)
- [ ] Monitor cache hit rate (target: > 70%)
- [ ] Monitor user activity and feedback
- [ ] Check database connection pool usage
- [ ] Review server resource usage (CPU, memory)

### Communication
- [ ] Deployment announcement sent to users
- [ ] Status page updated
- [ ] Support team briefed on new features
- [ ] Training materials shared
- [ ] Feedback channels monitored

### Issues & Iterations
- [ ] Document any deployment issues
- [ ] Track user-reported bugs
- [ ] Prioritize critical issues for hotfix
- [ ] Schedule iteration planning

## Rollback Procedure

**If critical issues are detected:**

1. **Immediate Actions:**
   - [ ] Assess severity (P0: immediate rollback, P1: schedule hotfix, P2: next iteration)
   - [ ] Notify team via communication channel
   - [ ] Start incident response process

2. **Rollback Steps (if P0):**
```bash
# Vercel rollback
vercel rollback <previous-deployment-url>

# Database rollback (if needed)
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Clear Redis cache
redis-cli -u $REDIS_URL FLUSHALL
```

- [ ] Application rolled back to previous version
- [ ] Database restored (if migrations caused issues)
- [ ] Redis cache cleared
- [ ] Verify rollback successful
- [ ] Monitor stability

3. **Post-Rollback:**
   - [ ] Root cause analysis conducted
   - [ ] Fix implemented and tested
   - [ ] Schedule re-deployment

## Success Criteria

### Technical Metrics
- ✅ Uptime: > 99.9%
- ✅ Error rate: < 1%
- ✅ Response time p95: < 200ms
- ✅ Cache hit rate: > 70%
- ✅ All health checks: GREEN

### Business Metrics
- ✅ User onboarding successful
- ✅ Support tickets manageable
- ✅ No critical bugs reported
- ✅ User satisfaction positive

### Stability
- ✅ No incidents for 48 hours
- ✅ Monitoring alerts functioning
- ✅ Team confident in system stability
- ✅ Rollback plan tested (in staging)

## Sign-Off

**Deployment Date:** __________________

**Deployed By:** __________________

**Technical Lead Approval:** __________________

**Product Owner Approval:** __________________

## Notes

Use this section to document any deployment-specific notes, issues encountered, or deviations from the plan:

---

---

---

## Post-Deployment Review (After 1 Week)

- [ ] Review deployment process
- [ ] Identify improvements for next deployment
- [ ] Update documentation based on learnings
- [ ] Celebrate successful deployment! 🎉
