# Integrations & Admin Analytics

This document describes how Zotero/Mendeley integrations work and how institution-aware admin analytics are calculated.

## Zotero & Mendeley Integrations

### Overview

The platform supports connecting a user account to external reference managers:

- Zotero
- Mendeley

Once connected, OAuth tokens are stored in the database and used to sync references into the local `Reference` model. Sync can then be triggered from the UI via the integrations API.

### OAuth Flow

Both providers follow an OAuth 2.0 style flow implemented as GET handlers in Next.js:

- `GET /api/auth/zotero`
- `GET /api/auth/mendeley`

The same route is used for:

- **Initiating** auth (redirecting the user to the provider)
- **Handling callbacks** (receiving the `code` and exchanging it for tokens)

State is protected via a random `state` value stored in an HTTP-only cookie.

#### Required Environment Variables

Set these in your `.env` (or host environment):

```bash
# Common
NEXT_PUBLIC_URL=https://your-domain.com

# Zotero
ZOTERO_CLIENT_ID=your_zotero_client_id
ZOTERO_CLIENT_SECRET=your_zotero_client_secret

# Mendeley
MENDELEY_CLIENT_ID=your_mendeley_client_id
MENDELEY_CLIENT_SECRET=your_mendeley_client_secret
```

Callback URLs you must configure in the providers' dashboards:

- Zotero redirect URI: `${NEXT_PUBLIC_URL}/api/auth/zotero`
- Mendeley redirect URI: `${NEXT_PUBLIC_URL}/api/auth/mendeley`

### Database Persistence

OAuth tokens and metadata are stored in Prisma's `IntegrationConnection` model:

```prisma
model IntegrationConnection {
  id             String               @id @default(cuid())
  userId         String
  provider       IntegrationProvider
  accessToken    String
  refreshToken   String?
  expiresAt      DateTime?
  externalUserId String?
  metadata       String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
}
```

On each successful OAuth callback:

- The route validates the `state` cookie.
- Exchanges the `code` for tokens.
- Upserts a row into `IntegrationConnection` keyed by `(userId, provider)`.

This ensures a user has at most one connection per provider and that tokens are updated on re-connect.

### Security Notes

- `state` is a random 32-byte hex string stored in an HTTP-only, same-site cookie to mitigate CSRF.
- Tokens are stored server-side only; the frontend never sees raw access tokens.
- Callbacks require a valid application session (`getUserFromRequest`); if the user is not authenticated the request is rejected.

## Integration Sync

References are synced by calling a shared helper that reads `IntegrationConnection` rows and uses provider clients to fetch references:

- Loads the correct `IntegrationConnection` for the user and provider.
- Calls the provider client (Zotero or Mendeley) with the stored access token.
- Normalises external items into the local `Reference` shape.
- Upserts `Reference` rows keyed by combination of user + external identifier.

The sync route:

- `POST /api/integrations/[id]/sync`

looks up the connection by ID, calls the helper, and returns a summary of imported/updated references.

## Admin Analytics

### Overview

Admin analytics aggregate activity at the **institution** level:

- Counts of users, documents, and citations
- Active users over a period
- Tool usage metrics
- Student progress and plagiarism reports

All analytics are filtered by `institutionId` so that admins only see data for their own institutions.

### Institution Scoping

The Prisma `User` model includes an optional `institutionId` field:

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          Role     @default(USER)
  status        UserStatus @default(ACTIVE)
  institutionId String?
  // ... other fields ...
}
```

Admin analytics queries:

- Restrict users to `User.institutionId = <institutionId>`
- Count documents, submissions, and citations only for users at that institution
- Derive per-student progress (completed documents, citations added, integrity scores) scoped to that institution

### Admin Analytics API

All admin analytics APIs are under `/api/admin` and require admin-level roles.

#### GET `/api/admin/analytics`

- Parameters:
  - `institutionId` (required)
  - `period`: `day | week | month | year` (defaults to `week`)
  - `report`: `summary | full` (optional)
- Auth:
  - Uses `requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin'])`
- Behavior:
  - For `summary`, calls `getInstitutionAnalytics(institutionId, period)`
  - For `full`, calls `generateAnalyticsReport(...)` for a richer dataset

#### POST `/api/admin/analytics`

Tracks fine-grained usage metrics.

- Body shape:

  ```json
  {
    "userId": "<user-id>",
    "activity": {
      "metric": "documents_created" | "tool_find-sources" | ...,
      "value": 1,
      "metadata": { "context": "optional" }
    }
  }
  ```

- Auth:
  - Uses `requireAuth(req)`
  - Enforces that the authenticated user can only track **their own** activity unless they have an admin role.
- Persists into the `UsageMetric` table via `usageMetricRepository`.

### Student Progress & Plagiarism

Admin analytics also expose helpers for:

- `getStudentProgress(institutionId)` – per-student:
  - documents completed
  - citations added
  - integrity score (0–100)
  - last activity timestamp
- `getPlagiarismReports(institutionId, status?)` – per-submission reports:
  - similarity scores
  - derived status (`ok`, `warning`, `high-risk`, etc.)
  - source list from stored plagiarism check metadata

These are consumed by UI pages and admin dashboards to give institutions a high-level view of student activity and academic integrity.
