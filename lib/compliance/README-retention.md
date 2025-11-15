# Automated Data Retention Cleanup

This directory contains the automated data retention cleanup system for FERPA compliance.

## Components

### 1. Retention Cleanup Service
**File:** `lib/compliance/retention-cleanup.ts`

Implements the core cleanup logic for:
- Permanently deleting users past the 90-day retention period
- Cleaning up documents from deleted users
- Removing old audit logs (5+ years old)
- Marking inactive accounts (2+ years without login)

### 2. API Endpoint
**File:** `app/api/compliance/cleanup/route.ts`

Provides endpoints to:
- `POST /api/compliance/cleanup` - Manually trigger cleanup
- `GET /api/compliance/cleanup` - Get cleanup schedule and policies

### 3. Cron Job Configuration
**File:** `scripts/cron/retention-cleanup.sh`

Shell script to run the cleanup job via cron.

## Setup

### Option 1: Node.js Script (Recommended for Development)

Run the cleanup script directly:

```bash
# Run once
npx tsx lib/compliance/retention-cleanup.ts

# Or with npm script
npm run retention:cleanup
```

### Option 2: API Endpoint (Recommended for Production)

Set up a cron job to call the API endpoint:

```bash
# Add to crontab (runs daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * curl -X POST http://localhost:3000/api/compliance/cleanup
```

### Option 3: Vercel Cron Jobs (For Vercel Deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/compliance/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Option 4: GitHub Actions (For Scheduled Automation)

Create `.github/workflows/retention-cleanup.yml`:

```yaml
name: Data Retention Cleanup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Cleanup
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/compliance/cleanup \
            -H "Authorization: Bearer ${{ secrets.ADMIN_API_KEY }}"
```

## Retention Policies

| Data Type | Retention Period | Action |
|-----------|-----------------|--------|
| Deleted User Data | 90 days | Permanent deletion |
| Audit Logs | 5 years | Deletion |
| Active Documents | 7 years | Archive (future) |
| Inactive Accounts | 2 years | Mark as inactive |

## Monitoring

The cleanup job logs results to:
1. Console output (for cron job logs)
2. Audit log table (for compliance tracking)

Example audit log entry:

```json
{
  "action": "RETENTION_CLEANUP",
  "resource": "system",
  "resourceId": "retention-job",
  "severity": "INFO",
  "details": {
    "deletedUsers": 5,
    "deletedDocuments": 123,
    "deletedAuditLogs": 4567,
    "errors": [],
    "duration": 2345
  }
}
```

## Testing

Test the cleanup job manually:

```bash
# 1. Check cleanup schedule and policies
curl http://localhost:3000/api/compliance/cleanup

# 2. Run cleanup manually
curl -X POST http://localhost:3000/api/compliance/cleanup
```

## Security Considerations

⚠️ **Important:** The cleanup endpoint should be restricted to admin users only.

Add authentication middleware before production deployment:

```typescript
// app/api/compliance/cleanup/route.ts
export async function POST(request: NextRequest) {
  // Check admin authentication
  const session = await getServerSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ... rest of cleanup logic
}
```

## Troubleshooting

### Cleanup Not Running

1. Check cron job logs: `grep CRON /var/log/syslog`
2. Verify database connection
3. Check audit logs for errors

### Partial Cleanup Failures

The job is designed to continue even if individual operations fail. Check the `errors` array in the response for details.

### Performance Issues

If cleanup takes too long:
1. Consider running during off-peak hours
2. Implement pagination for large deletions
3. Add database indexes on timestamp columns

## Future Enhancements

- [ ] Add email notifications for cleanup results
- [ ] Implement data archival before deletion
- [ ] Add metrics and monitoring dashboard
- [ ] Implement incremental cleanup for large datasets
- [ ] Add dry-run mode for testing
