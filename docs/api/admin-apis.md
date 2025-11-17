# Admin API Documentation

This document provides comprehensive documentation for all admin-facing API endpoints for user management, license management, and audit log monitoring.

## Table of Contents

- [User Management](#user-management)
  - [Create User](#create-user)
  - [Get User by ID](#get-user-by-id)
  - [List Users](#list-users)
  - [Update User](#update-user)
  - [Delete User (Soft Delete)](#delete-user-soft-delete)
- [License Management](#license-management)
  - [Create License](#create-license)
  - [Get License by ID](#get-license-by-id)
  - [Get License by Institution](#get-license-by-institution)
  - [List Licenses](#list-licenses)
  - [Update License](#update-license)
- [Audit Log Management](#audit-log-management)
  - [List Audit Logs](#list-audit-logs)
  - [Filter Audit Logs](#filter-audit-logs)
  - [Export Audit Logs (CSV)](#export-audit-logs-csv)
- [Error Responses](#error-responses)
- [Authentication & Authorization](#authentication--authorization)
- [Rate Limiting](#rate-limiting)

---

## User Management

### Create User

Create a new user account in the system.

**Endpoint:** `POST /api/admin/users`

**Authentication Required:** Yes (Admin only)

**Rate Limiting:** Yes

**Request Body:**

```json
{
  "email": "instructor@university.edu",
  "name": "Dr. Jane Smith",
  "role": "INSTRUCTOR",
  "status": "ACTIVE"
}
```

**Request Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address (must be unique) |
| name | string | No | User's full name |
| role | string | No | User role: `USER`, `INSTRUCTOR`, or `ADMIN` (default: `USER`) |
| status | string | No | User status: `ACTIVE`, `SUSPENDED`, or `DELETED` (default: `ACTIVE`) |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "instructor@university.edu",
    "name": "Dr. Jane Smith",
    "role": "INSTRUCTOR",
    "status": "ACTIVE",
    "createdAt": "2025-11-17T10:30:00.000Z",
    "updatedAt": "2025-11-17T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data or validation error
- `409 Conflict` - Email already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example Request (cURL):**

```bash
curl -X POST https://api.example.com/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "instructor@university.edu",
    "name": "Dr. Jane Smith",
    "role": "INSTRUCTOR"
  }'
```

---

### Get User by ID

Retrieve a specific user's information by their ID.

**Endpoint:** `GET /api/admin/users/{id}`

**Authentication Required:** Yes (Admin only)

**Rate Limiting:** Yes

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The user's unique identifier |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "instructor@university.edu",
    "name": "Dr. Jane Smith",
    "role": "INSTRUCTOR",
    "status": "ACTIVE",
    "createdAt": "2025-11-17T10:30:00.000Z",
    "updatedAt": "2025-11-17T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - User not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example Request (cURL):**

```bash
curl https://api.example.com/api/admin/users/user_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### List Users

Retrieve a paginated list of all users with optional filtering.

**Endpoint:** `GET /api/admin/users`

**Authentication Required:** Yes (Admin only)

**Rate Limiting:** Yes

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number for pagination | 1 |
| perPage | number | Results per page (max 100) | 20 |
| role | string | Filter by role: `USER`, `INSTRUCTOR`, or `ADMIN` | - |
| status | string | Filter by status: `ACTIVE`, `SUSPENDED`, or `DELETED` | - |
| search | string | Search by email or name | - |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "user_abc123",
      "email": "instructor@university.edu",
      "name": "Dr. Jane Smith",
      "role": "INSTRUCTOR",
      "status": "ACTIVE",
      "createdAt": "2025-11-17T10:30:00.000Z",
      "updatedAt": "2025-11-17T10:30:00.000Z"
    },
    {
      "id": "user_def456",
      "email": "student@university.edu",
      "name": "John Doe",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2025-11-17T09:15:00.000Z",
      "updatedAt": "2025-11-17T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Example Request (cURL):**

```bash
curl "https://api.example.com/api/admin/users?page=1&perPage=20&role=INSTRUCTOR" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Update User

Update an existing user's information.

**Endpoint:** `PUT /api/admin/users/{id}`

**Authentication Required:** Yes (Admin only)

**Rate Limiting:** Yes

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The user's unique identifier |

**Request Body:**

```json
{
  "name": "Dr. Jane Smith-Johnson",
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

**Request Body Parameters (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| email | string | User's email address |
| name | string | User's full name |
| role | string | User role: `USER`, `INSTRUCTOR`, or `ADMIN` |
| status | string | User status: `ACTIVE`, `SUSPENDED`, or `DELETED` |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "instructor@university.edu",
    "name": "Dr. Jane Smith-Johnson",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2025-11-17T10:30:00.000Z",
    "updatedAt": "2025-11-17T14:25:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `404 Not Found` - User not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example Request (cURL):**

```bash
curl -X PUT https://api.example.com/api/admin/users/user_abc123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "role": "ADMIN"
  }'
```

---

### Delete User (Soft Delete)

Soft delete a user by changing their status to `DELETED`. The user account remains in the database but is marked as deleted.

**Endpoint:** `DELETE /api/admin/users/{id}`

**Authentication Required:** Yes (Admin only)

**Rate Limiting:** Yes

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The user's unique identifier |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "instructor@university.edu",
    "name": "Dr. Jane Smith",
    "role": "INSTRUCTOR",
    "status": "DELETED",
    "createdAt": "2025-11-17T10:30:00.000Z",
    "updatedAt": "2025-11-17T15:45:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - User not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example Request (cURL):**

```bash
curl -X DELETE https://api.example.com/api/admin/users/user_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Note:** This is a soft delete operation. The user record remains in the database with status set to `DELETED`. To permanently remove the user, contact system administrators.

---

## License Management

### Create License

Create a new institutional license.

**Endpoint:** `POST /api/admin/licenses`

**Authentication Required:** Yes (Admin or Institution Admin)

**Rate Limiting:** Yes

**Request Body:**

```json
{
  "institutionId": "inst_xyz789",
  "institution": "University of Example",
  "maxSeats": 500,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**Request Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| institutionId | string | Yes | Unique institution identifier |
| institution | string | Yes | Institution name |
| maxSeats | number | Yes | Maximum number of seats (users) |
| expiresAt | string (ISO 8601) | Yes | License expiration date |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "license_abc123",
    "institutionId": "inst_xyz789",
    "institution": "University of Example",
    "seats": 500,
    "usedSeats": 0,
    "status": "ACTIVE",
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2025-11-17T10:00:00.000Z",
    "updatedAt": "2025-11-17T10:00:00.000Z"
  },
  "message": "License created successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `409 Conflict` - Institution already has a license
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example Request (cURL):**

```bash
curl -X POST https://api.example.com/api/admin/licenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "institutionId": "inst_xyz789",
    "institution": "University of Example",
    "maxSeats": 500,
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

---

### Get License by ID

Retrieve a specific license by its ID.

**Endpoint:** `GET /api/admin/licenses?licenseId={id}`

**Authentication Required:** Yes (Admin or Institution Admin)

**Rate Limiting:** Yes

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| licenseId | string | The license's unique identifier |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "license_abc123",
    "institutionId": "inst_xyz789",
    "institution": "University of Example",
    "seats": 500,
    "usedSeats": 235,
    "status": "ACTIVE",
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2025-11-17T10:00:00.000Z",
    "updatedAt": "2025-11-17T15:30:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found` - License not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example Request (cURL):**

```bash
curl "https://api.example.com/api/admin/licenses?licenseId=license_abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Get License by Institution

Retrieve a license for a specific institution.

**Endpoint:** `GET /api/admin/licenses?institutionId={id}`

**Authentication Required:** Yes (Admin or Institution Admin)

**Rate Limiting:** Yes

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| institutionId | string | The institution's unique identifier |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "license_abc123",
    "institutionId": "inst_xyz789",
    "institution": "University of Example",
    "seats": 500,
    "usedSeats": 235,
    "status": "ACTIVE",
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "createdAt": "2025-11-17T10:00:00.000Z",
    "updatedAt": "2025-11-17T15:30:00.000Z"
  }
}
```

**Example Request (cURL):**

```bash
curl "https://api.example.com/api/admin/licenses?institutionId=inst_xyz789" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### List Licenses

Retrieve a paginated list of all licenses.

**Endpoint:** `GET /api/admin/licenses`

**Authentication Required:** Yes (Admin or Institution Admin)

**Rate Limiting:** Yes

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number for pagination | 1 |
| perPage | number | Results per page (max 100) | 20 |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "license_abc123",
      "institutionId": "inst_xyz789",
      "institution": "University of Example",
      "seats": 500,
      "usedSeats": 235,
      "status": "ACTIVE",
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "createdAt": "2025-11-17T10:00:00.000Z",
      "updatedAt": "2025-11-17T15:30:00.000Z"
    },
    {
      "id": "license_def456",
      "institutionId": "inst_abc456",
      "institution": "State College",
      "seats": 250,
      "usedSeats": 180,
      "status": "ACTIVE",
      "expiresAt": "2026-06-30T23:59:59.000Z",
      "createdAt": "2025-10-01T08:00:00.000Z",
      "updatedAt": "2025-11-17T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

**Example Request (cURL):**

```bash
curl "https://api.example.com/api/admin/licenses?page=1&perPage=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Update License

Update an existing license's information.

**Endpoint:** `PUT /api/admin/licenses`

**Authentication Required:** Yes (Admin or Institution Admin)

**Rate Limiting:** Yes

**Request Body:**

```json
{
  "id": "license_abc123",
  "seats": 600,
  "status": "ACTIVE",
  "expiresAt": "2027-12-31T23:59:59Z"
}
```

**Request Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | License unique identifier |
| institution | string | No | Institution name |
| seats | number | No | Maximum number of seats |
| usedSeats | number | No | Number of seats in use |
| status | string | No | License status: `ACTIVE`, `SUSPENDED`, or `EXPIRED` |
| expiresAt | string (ISO 8601) | No | License expiration date |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "license_abc123",
    "institutionId": "inst_xyz789",
    "institution": "University of Example",
    "seats": 600,
    "usedSeats": 235,
    "status": "ACTIVE",
    "expiresAt": "2027-12-31T23:59:59.000Z",
    "createdAt": "2025-11-17T10:00:00.000Z",
    "updatedAt": "2025-11-17T16:45:00.000Z"
  },
  "message": "License updated successfully"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data or missing license ID
- `404 Not Found` - License not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example Request (cURL):**

```bash
curl -X PUT https://api.example.com/api/admin/licenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "id": "license_abc123",
    "seats": 600
  }'
```

---

## Audit Log Management

### List Audit Logs

Retrieve a paginated list of audit logs with optional filtering.

**Endpoint:** `GET /api/admin/audit-logs`

**Authentication Required:** Yes (Admin only)

**Rate Limiting:** Yes

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number for pagination | 1 |
| perPage | number | Results per page (max 100) | 20 |
| userId | string | Filter by user ID | - |
| action | string | Filter by action (e.g., 'user.created') | - |
| resource | string | Filter by resource type (e.g., 'user', 'license') | - |
| severity | string | Filter by severity: `INFO`, `WARNING`, or `CRITICAL` | - |
| startDate | string (ISO 8601) | Filter logs from this date onwards | - |
| endDate | string (ISO 8601) | Filter logs up to this date | - |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "log_abc123",
      "userId": "user_xyz789",
      "action": "user.created",
      "resource": "user",
      "resourceId": "user_new123",
      "severity": "INFO",
      "timestamp": "2025-11-17T10:30:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "details": {
        "email": "newuser@university.edu",
        "role": "INSTRUCTOR"
      }
    },
    {
      "id": "log_def456",
      "userId": "user_xyz789",
      "action": "license.updated",
      "resource": "license",
      "resourceId": "license_abc123",
      "severity": "WARNING",
      "timestamp": "2025-11-17T10:25:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "details": {
        "changes": {
          "seats": 600
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 1523,
    "totalPages": 77
  }
}
```

**Example Request (cURL):**

```bash
curl "https://api.example.com/api/admin/audit-logs?page=1&severity=CRITICAL" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Filter Audit Logs

Filter audit logs by multiple criteria for detailed analysis.

**Endpoint:** `GET /api/admin/audit-logs`

**Authentication Required:** Yes (Admin only)

**Rate Limiting:** Yes

**Query Parameters Examples:**

**Filter by User:**
```
GET /api/admin/audit-logs?userId=user_abc123
```

**Filter by Action:**
```
GET /api/admin/audit-logs?action=user.deleted
```

**Filter by Resource:**
```
GET /api/admin/audit-logs?resource=license
```

**Filter by Severity:**
```
GET /api/admin/audit-logs?severity=CRITICAL
```

**Filter by Date Range:**
```
GET /api/admin/audit-logs?startDate=2025-11-01T00:00:00Z&endDate=2025-11-17T23:59:59Z
```

**Combined Filters:**
```
GET /api/admin/audit-logs?userId=user_abc123&severity=WARNING&startDate=2025-11-01T00:00:00Z
```

**Example Request (cURL):**

```bash
curl "https://api.example.com/api/admin/audit-logs?userId=user_abc123&severity=WARNING&startDate=2025-11-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Export Audit Logs (CSV)

Export audit logs to CSV format for offline analysis.

**Endpoint:** `GET /api/admin/audit-logs?format=csv`

**Authentication Required:** Yes (Admin only)

**Rate Limiting:** Yes

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| format | string | Export format: `csv` | - |
| userId | string | Filter by user ID | - |
| action | string | Filter by action | - |
| resource | string | Filter by resource type | - |
| severity | string | Filter by severity | - |
| startDate | string (ISO 8601) | Filter logs from this date onwards | - |
| endDate | string (ISO 8601) | Filter logs up to this date | - |

**Success Response:** `200 OK`

Returns a CSV file with the following headers:
```csv
timestamp,userId,userEmail,action,resource,resourceId,severity,details
2025-11-17T10:30:00.000Z,user_xyz789,admin@university.edu,user.created,user,user_new123,INFO,"{\"email\":\"newuser@university.edu\"}"
```

**Example Request (cURL):**

```bash
curl "https://api.example.com/api/admin/audit-logs?format=csv&severity=CRITICAL" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o audit-logs.csv
```

---

## Error Responses

All API endpoints use standardized error responses:

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "email": ["Email is required", "Email must be valid"],
    "maxSeats": ["Seats must be a positive number"]
  }
}
```

### Authentication Error (401 Unauthorized)

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### Authorization Error (403 Forbidden)

```json
{
  "success": false,
  "error": "Not authorized to perform this action"
}
```

### Not Found Error (404 Not Found)

```json
{
  "success": false,
  "error": "User with id user_abc123 not found"
}
```

### Conflict Error (409 Conflict)

```json
{
  "success": false,
  "error": "Email already exists in the system"
}
```

### Rate Limit Error (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

### Internal Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Authentication & Authorization

### Authentication

All admin API endpoints require authentication via Bearer token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Authorization

Admin endpoints require specific roles:

| Endpoint | Required Roles |
|----------|---------------|
| User Management | `ADMIN` |
| License Management | `ADMIN`, `INSTITUTION_ADMIN` |
| Audit Logs | `ADMIN` |

**Authorization Flow:**

1. Client sends request with Bearer token
2. Server validates token and extracts user information
3. Server checks if user has required role
4. If authorized, request proceeds; otherwise, `403 Forbidden` is returned

---

## Rate Limiting

All admin API endpoints are rate-limited to prevent abuse:

- **Default Limit:** Based on IP address
- **Response Header:** Rate limit information included in response headers
- **Error Response:** `429 Too Many Requests` when limit exceeded

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700234567
```

**Best Practices:**

- Implement exponential backoff when receiving `429` responses
- Cache responses when possible to reduce API calls
- Use pagination efficiently (don't request more data than needed)
- Monitor rate limit headers to adjust request frequency

---

## Best Practices

### General Guidelines

1. **Always validate input data** before sending requests
2. **Handle errors gracefully** with proper error handling
3. **Use pagination** for list endpoints to manage large datasets
4. **Filter data** using query parameters to reduce response sizes
5. **Cache responses** when appropriate to minimize API calls
6. **Monitor audit logs** regularly for security and compliance

### Security

1. **Protect API tokens** - Never expose tokens in client-side code
2. **Use HTTPS** - Always use HTTPS in production
3. **Rotate tokens** - Regularly rotate authentication tokens
4. **Monitor audit logs** - Review audit logs for suspicious activity
5. **Implement proper access controls** - Ensure users have minimum necessary permissions

### Performance

1. **Use pagination** - Request only the data you need
2. **Filter results** - Use query parameters to reduce response sizes
3. **Implement caching** - Cache responses when data doesn't change frequently
4. **Batch operations** - When possible, batch multiple operations together
5. **Monitor API usage** - Track API calls and optimize as needed

---

## Common Workflows

### Creating a New Institutional License

```bash
# 1. Create the license
curl -X POST https://api.example.com/api/admin/licenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "institutionId": "inst_new123",
    "institution": "New University",
    "maxSeats": 300,
    "expiresAt": "2026-12-31T23:59:59Z"
  }'

# 2. Verify the license was created
curl "https://api.example.com/api/admin/licenses?institutionId=inst_new123" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Check audit logs for the creation
curl "https://api.example.com/api/admin/audit-logs?action=license.created&resource=license" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### User Management Workflow

```bash
# 1. Create a new instructor
curl -X POST https://api.example.com/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "newprof@university.edu",
    "name": "Dr. John Smith",
    "role": "INSTRUCTOR"
  }'

# 2. Update the user's information
curl -X PUT https://api.example.com/api/admin/users/user_abc123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Dr. John Smith, PhD"
  }'

# 3. List all instructors
curl "https://api.example.com/api/admin/users?role=INSTRUCTOR" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Audit Log Monitoring

```bash
# 1. Get all critical logs from the last 7 days
curl "https://api.example.com/api/admin/audit-logs?severity=CRITICAL&startDate=2025-11-10T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Export logs for a specific user
curl "https://api.example.com/api/admin/audit-logs?userId=user_abc123&format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o user-audit-logs.csv

# 3. Monitor license-related actions
curl "https://api.example.com/api/admin/audit-logs?resource=license&action=license.updated" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Support

For API support and questions:

- **Documentation:** https://docs.example.com
- **Email:** api-support@example.com
- **Status Page:** https://status.example.com

---

**Last Updated:** November 17, 2025  
**API Version:** 1.0.0
