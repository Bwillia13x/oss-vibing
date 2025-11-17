# Administrator Guide

## Overview

This guide provides comprehensive instructions for system administrators managing the OSS Vibing academic writing platform.

## Table of Contents

1. [User Management](#user-management)
2. [License Management](#license-management)
3. [System Settings](#system-settings)
4. [Analytics & Reporting](#analytics--reporting)
5. [Audit Logs](#audit-logs)
6. [Security & Compliance](#security--compliance)

## User Management

### Creating Users

Administrators can create user accounts with different roles:

```typescript
// Example: Create a new instructor account
POST /api/admin/users
{
  "email": "instructor@university.edu",
  "name": "Dr. Jane Smith",
  "role": "INSTRUCTOR"
}
```

**Available Roles:**
- `USER` - Student with basic access
- `INSTRUCTOR` - Faculty member with grading and assignment capabilities
- `ADMIN` - Full system administration access

### Managing User Roles

Update user roles as needed:

```typescript
// Promote user to instructor
PATCH /api/admin/users/{userId}
{
  "role": "INSTRUCTOR"
}
```

### Suspending Users

Suspend user accounts for policy violations or account issues:

```typescript
// Suspend a user account
PATCH /api/admin/users/{userId}
{
  "status": "SUSPENDED"
}
```

**Best Practices:**
- Document reason for suspension in audit log
- Notify user via email before suspension when possible
- Set review date for suspended accounts

### Deleting Users

Delete user accounts (with FERPA compliance):

```typescript
DELETE /api/admin/users/{userId}
```

**FERPA Compliance:**
- Deleting a user cascades to their documents and data
- Maintains audit trail of deletion
- Irreversible action - use with caution
- Students can request their own data deletion

### User Listings and Search

Retrieve and filter users:

```typescript
// List all users with pagination
GET /api/admin/users?page=1&limit=50

// Filter by role
GET /api/admin/users?role=INSTRUCTOR

// Search by email or name
GET /api/admin/users?search=smith
```

## License Management

### Creating Institutional Licenses

Create licenses for educational institutions:

```typescript
POST /api/admin/licenses
{
  "institutionName": "State University",
  "licenseType": "EDUCATION",
  "seats": 1000,
  "expiresAt": "2026-06-30T23:59:59Z"
}
```

**License Types:**
- `EDUCATION` - Academic institutions
- `ENTERPRISE` - Corporate/commercial use
- `TRIAL` - Limited evaluation period

### Managing License Status

Update license status:

```typescript
PATCH /api/admin/licenses/{licenseId}
{
  "status": "ACTIVE" | "EXPIRED" | "SUSPENDED"
}
```

### Tracking Seat Usage

Monitor license capacity:

```typescript
GET /api/admin/licenses/{licenseId}

// Response includes:
{
  "seats": 1000,
  "seatsUsed": 847,
  "seatsAvailable": 153,
  "utilizationRate": 0.847
}
```

**Alerts:**
- System alerts when seats > 90% utilized
- Email notifications for expiring licenses (30/60 days)

### License Renewal

```typescript
PATCH /api/admin/licenses/{licenseId}
{
  "expiresAt": "2027-06-30T23:59:59Z",
  "status": "ACTIVE"
}
```

## System Settings

### Configuration Management

Manage system-wide settings:

```typescript
// Create or update setting
POST /api/admin/settings
{
  "category": "FEATURES",
  "key": "realtime_collaboration",
  "value": {
    "enabled": true,
    "maxConcurrentUsers": 10
  }
}
```

**Setting Categories:**
- `FEATURES` - Feature flags and toggles
- `SECURITY` - Security policies and thresholds
- `PERFORMANCE` - Performance tuning parameters
- `INTEGRATIONS` - Third-party service configs

### Common Settings

**Feature Flags:**
```json
{
  "category": "FEATURES",
  "key": "plagiarism_detection",
  "value": { "enabled": true, "threshold": 0.3 }
}
```

**Rate Limiting:**
```json
{
  "category": "SECURITY",
  "key": "api_rate_limit",
  "value": { "requestsPerMinute": 100, "burstSize": 150 }
}
```

**Cache Configuration:**
```json
{
  "category": "PERFORMANCE",
  "key": "redis_cache",
  "value": { "ttl": 3600, "enabled": true }
}
```

### Retrieving Settings

```typescript
// Get all settings in a category
GET /api/admin/settings?category=FEATURES

// Get specific setting
GET /api/admin/settings/{category}/{key}
```

## Analytics & Reporting

### System Metrics

Track key performance indicators:

```typescript
GET /api/admin/analytics/metrics

// Response:
{
  "totalUsers": 5420,
  "activeUsers": 3241,
  "totalDocuments": 18567,
  "documentsCreatedToday": 142,
  "citationsAdded": 45892,
  "averageCitationsPerDocument": 2.5
}
```

### Time-based Analytics

```typescript
// Get metrics for specific time period
GET /api/admin/analytics/metrics?start=2025-01-01&end=2025-01-31

// Response includes:
{
  "period": "2025-01",
  "newUsers": 342,
  "documentsCreated": 1456,
  "citationsAdded": 3892
}
```

### Aggregated Reports

```typescript
// Group metrics by type
GET /api/admin/analytics/metrics?groupBy=type

// Response:
{
  "byType": {
    "research_papers": 5234,
    "essays": 8912,
    "lab_reports": 2341,
    "other": 2080
  }
}
```

### Usage Trends

Track system growth:

```typescript
GET /api/admin/analytics/trends?metric=users&period=monthly

// Returns time-series data for visualization
```

## Audit Logs

### Reviewing Audit Logs

Access comprehensive audit trail:

```typescript
GET /api/admin/audit-logs?limit=100

// Response:
{
  "logs": [
    {
      "id": "log-123",
      "userId": "user-456",
      "action": "USER_CREATED",
      "severity": "INFO",
      "timestamp": "2025-11-16T12:34:56Z",
      "metadata": {
        "targetUserId": "user-789",
        "role": "INSTRUCTOR"
      }
    }
  ]
}
```

### Filtering Audit Logs

**By Severity:**
```typescript
GET /api/admin/audit-logs?severity=CRITICAL
```

Severity levels: `INFO`, `WARNING`, `CRITICAL`

**By Action Type:**
```typescript
GET /api/admin/audit-logs?action=USER_DELETED
```

**By Time Range:**
```typescript
GET /api/admin/audit-logs?start=2025-01-01&end=2025-01-31
```

**By User:**
```typescript
GET /api/admin/audit-logs?userId=user-123
```

### Common Audit Events

- `USER_CREATED` - New user account created
- `USER_UPDATED` - User profile or role changed
- `USER_SUSPENDED` - Account suspended
- `USER_DELETED` - Account permanently deleted
- `LICENSE_CREATED` - New license issued
- `LICENSE_EXPIRED` - License reached expiration
- `SETTINGS_CHANGED` - System configuration modified
- `SECURITY_ALERT` - Security-related event

### Security Monitoring

Monitor critical security events:

```typescript
// Get recent security alerts
GET /api/admin/audit-logs?severity=CRITICAL&action=SECURITY_ALERT

// Set up alerts for:
// - Multiple failed login attempts
// - Unauthorized access attempts
// - Suspicious data export patterns
// - License violations
```

## Security & Compliance

### FERPA Compliance

**Data Privacy:**
- Student data encrypted at rest and in transit
- Access logs maintained for all data access
- Students can request data export/deletion
- Automatic data retention policies

**Privacy Controls:**
```typescript
// Export student data (FERPA request)
GET /api/admin/users/{userId}/export

// Delete student data (right to be forgotten)
DELETE /api/admin/users/{userId}?purgeData=true
```

### Access Control

**Role-Based Permissions:**
- `ADMIN` - Full system access
- `INSTRUCTOR` - Class and student management
- `USER` - Own documents and data only

**Principle of Least Privilege:**
- Grant minimum necessary permissions
- Regular access reviews (quarterly)
- Automatic permission expiration for temporary access

### Security Best Practices

1. **Authentication:**
   - Enforce strong passwords (12+ characters)
   - Enable multi-factor authentication (MFA)
   - Review OAuth integrations quarterly

2. **Session Management:**
   - Sessions expire after 24 hours
   - Force logout on role changes
   - Monitor concurrent sessions

3. **Data Protection:**
   - Database backups daily (encrypted)
   - Geographic redundancy enabled
   - Point-in-time recovery available

4. **Monitoring:**
   - Real-time security alerts
   - Weekly security log reviews
   - Quarterly security audits

### Incident Response

**Security Incident Procedure:**

1. **Detection:**
   - Monitor audit logs for anomalies
   - Review security alerts immediately
   - User-reported security concerns

2. **Containment:**
   - Suspend affected accounts if needed
   - Disable compromised integrations
   - Block suspicious IP addresses

3. **Investigation:**
   - Review audit logs thoroughly
   - Identify scope of incident
   - Document findings

4. **Recovery:**
   - Restore from backups if needed
   - Reset compromised credentials
   - Notify affected users

5. **Post-Incident:**
   - Update security policies
   - Implement additional controls
   - Train staff on lessons learned

### Compliance Reporting

Generate compliance reports:

```typescript
// FERPA compliance report
GET /api/admin/reports/ferpa

// Security audit report
GET /api/admin/reports/security-audit

// Data retention report
GET /api/admin/reports/data-retention
```

## Maintenance Tasks

### Daily Tasks
- ✅ Review critical audit logs
- ✅ Monitor system performance
- ✅ Check license utilization

### Weekly Tasks
- ✅ Review user activity patterns
- ✅ Analyze system metrics
- ✅ Check backup integrity

### Monthly Tasks
- ✅ Review and update user permissions
- ✅ Audit security logs
- ✅ Generate compliance reports
- ✅ Review license renewals

### Quarterly Tasks
- ✅ Conduct security audit
- ✅ Review system settings
- ✅ Update documentation
- ✅ Plan capacity requirements

## Support & Troubleshooting

### Common Issues

**High License Utilization:**
- Review seat allocation
- Consider license upgrade
- Archive inactive accounts

**Performance Issues:**
- Check Redis cache status: `GET /api/health/cache`
- Review database performance metrics
- Analyze slow query logs

**Authentication Problems:**
- Verify OAuth configuration
- Check JWT token expiration
- Review firewall rules

### Getting Help

- Technical Support: support@oss-vibing.com
- Security Issues: security@oss-vibing.com
- Documentation: https://docs.oss-vibing.com

## Appendix

### API Reference

Full API documentation: `/docs/API-REFERENCE.md`

### Keyboard Shortcuts

Admin panel shortcuts: `/docs/KEYBOARD-SHORTCUTS.md`

### Change Log

Track system updates: `/docs/CHANGELOG.md`
