# Next Development Tasks - Prioritized Recommendations

**Date:** November 15, 2025  
**Based on:** Phase 14 & 15 Completion  
**Current Status:** 85% Complete - Production-Ready Platform  
**Next Milestone:** Full Production Deployment with Pilot Program

---

## Executive Summary

With Phase 14 (FERPA compliance) and Phase 15 (real-time collaboration & reference manager sync) complete, Vibe University is now at a critical juncture - **ready for production deployment** after implementing key security and UX features.

This document provides a **prioritized, actionable roadmap** for the next 6-8 weeks of development to achieve:
1. ✅ Production-ready security (WebSocket auth, access control)
2. ✅ User-facing collaboration features (UI components)
3. ✅ Seamless reference manager integration (OAuth flows)
4. ✅ Scalable infrastructure (load testing, optimization)
5. ✅ Successful pilot program (5-10 institutions)

---

## Critical Path to Production (6-8 Weeks)

### Week 1-2: Security & Authentication (CRITICAL)

#### Task 1: WebSocket Authentication & Authorization
**Priority:** 🔴 CRITICAL  
**Effort:** 3-5 days  
**Blocks:** Production deployment  
**Owner:** Backend Engineer

**Current State:**
- ❌ WebSocket connections are unauthenticated
- ❌ Anyone can join any room with the room name
- ❌ No rate limiting or abuse prevention

**Required Implementation:**

1. **JWT-based WebSocket Authentication**
```typescript
// lib/collaboration/auth.ts

import jwt from 'jsonwebtoken';
import { WebSocket } from 'ws';

export interface WebSocketAuthPayload {
  userId: string;
  userName: string;
  email: string;
  permissions: string[];
}

export function authenticateWebSocket(
  ws: WebSocket,
  token: string
): WebSocketAuthPayload | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as WebSocketAuthPayload;
    
    // Attach to WebSocket for future reference
    (ws as any).user = payload;
    
    return payload;
  } catch (error) {
    console.error('WebSocket auth failed:', error);
    return null;
  }
}

export function requireAuth(ws: WebSocket): WebSocketAuthPayload {
  const user = (ws as any).user;
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
```

2. **Room Access Control**
```typescript
// lib/collaboration/acl.ts

export enum RoomPermission {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export interface RoomACL {
  roomId: string;
  userId: string;
  permission: RoomPermission;
}

export async function checkRoomAccess(
  userId: string,
  roomId: string,
  requiredPermission: RoomPermission
): Promise<boolean> {
  const acl = await prisma.roomACL.findFirst({
    where: { userId, roomId },
  });
  
  if (!acl) return false;
  
  // Check permission hierarchy: owner > editor > viewer
  const permissionLevel = {
    [RoomPermission.OWNER]: 3,
    [RoomPermission.EDITOR]: 2,
    [RoomPermission.VIEWER]: 1,
  };
  
  return permissionLevel[acl.permission] >= permissionLevel[requiredPermission];
}

export async function grantRoomAccess(
  roomId: string,
  userId: string,
  permission: RoomPermission
): Promise<void> {
  await prisma.roomACL.create({
    data: { roomId, userId, permission },
  });
}
```

3. **Update WebSocket Server**
```typescript
// Update lib/collaboration/websocket-server.ts

this.wss.on('connection', async (ws: WebSocket, request) => {
  // Extract token from query or header
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (!token) {
    ws.close(4001, 'Authentication required');
    return;
  }
  
  // Authenticate
  const user = authenticateWebSocket(ws, token);
  if (!user) {
    ws.close(4001, 'Invalid token');
    return;
  }
  
  const roomId = url.searchParams.get('room') || 'default';
  
  // Check access
  const hasAccess = await checkRoomAccess(user.userId, roomId, RoomPermission.VIEWER);
  if (!hasAccess) {
    ws.close(4003, 'Access denied');
    return;
  }
  
  // Continue with existing logic...
});
```

**Success Criteria:**
- ✅ All WebSocket connections require valid JWT
- ✅ Room access is controlled by ACL
- ✅ Unauthorized access attempts are logged
- ✅ Rate limiting prevents abuse

**Testing:**
- Unit tests for auth functions
- Integration tests for WebSocket auth flow
- Security testing for token validation
- Performance testing with auth overhead

---

#### Task 2: Rate Limiting & Abuse Prevention
**Priority:** 🔴 CRITICAL  
**Effort:** 2 days  
**Owner:** Backend Engineer

**Implementation:**
```typescript
// lib/collaboration/rate-limiter.ts

import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of actions
  duration: 60, // Per 60 seconds
});

export async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    await rateLimiter.consume(userId);
    return true;
  } catch (error) {
    console.warn(`Rate limit exceeded for user ${userId}`);
    return false;
  }
}
```

---

### Week 2-3: Collaboration UI Components

#### Task 3: Presence Indicators & User List
**Priority:** 🟡 HIGH  
**Effort:** 3-4 days  
**Owner:** Frontend Engineer

**Components to Build:**

1. **PresenceIndicator Component**
```typescript
// components/collaboration/presence-indicator.tsx

'use client';

import { useEffect, useState } from 'react';
import { UserPresence } from '@/lib/collaboration';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PresenceIndicatorProps {
  users: Map<number, UserPresence>;
}

export function PresenceIndicator({ users }: PresenceIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  
  useEffect(() => {
    setActiveUsers(Array.from(users.values()));
  }, [users]);
  
  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
      <span className="text-sm text-muted-foreground">
        {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} editing
      </span>
      
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 5).map((user) => (
          <Avatar
            key={user.userId}
            className="border-2"
            style={{ borderColor: user.color }}
          >
            <AvatarFallback style={{ backgroundColor: user.color }}>
              {user.userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        
        {activeUsers.length > 5 && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs">
            +{activeUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
```

2. **UserList Component**
```typescript
// components/collaboration/user-list.tsx

'use client';

import { UserPresence } from '@/lib/collaboration';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserListProps {
  users: Map<number, UserPresence>;
  currentUserId: string;
}

export function UserList({ users, currentUserId }: UserListProps) {
  const activeUsers = Array.from(users.values());
  
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2 p-4">
        {activeUsers.map((user) => (
          <div
            key={user.userId}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            
            <div className="flex-1">
              <p className="text-sm font-medium">
                {user.userName}
                {user.userId === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                )}
              </p>
              
              {user.cursor && (
                <p className="text-xs text-muted-foreground">
                  Line {user.cursor.line}, Column {user.cursor.column}
                </p>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              {getTimeSince(user.lastSeen)}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function getTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
```

3. **CursorOverlay Component**
```typescript
// components/collaboration/cursor-overlay.tsx

'use client';

import { useEffect, useState } from 'react';
import { UserPresence } from '@/lib/collaboration';

interface CursorOverlayProps {
  users: Map<number, UserPresence>;
  editorRef: React.RefObject<HTMLDivElement>;
}

export function CursorOverlay({ users, editorRef }: CursorOverlayProps) {
  const [cursors, setCursors] = useState<UserPresence[]>([]);
  
  useEffect(() => {
    setCursors(
      Array.from(users.values()).filter((u) => u.cursor)
    );
  }, [users]);
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {cursors.map((user) => {
        if (!user.cursor || !editorRef.current) return null;
        
        // Calculate cursor position (simplified - needs actual editor integration)
        const position = calculateCursorPosition(user.cursor, editorRef.current);
        
        return (
          <div
            key={user.userId}
            className="absolute"
            style={{
              left: position.x,
              top: position.y,
              color: user.color,
            }}
          >
            {/* Cursor caret */}
            <div className="w-0.5 h-5 bg-current animate-pulse" />
            
            {/* User name label */}
            <div
              className="absolute top-6 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function calculateCursorPosition(
  cursor: { line: number; column: number },
  editorElement: HTMLElement
): { x: number; y: number } {
  // This is simplified - actual implementation depends on editor
  // For Monaco/CodeMirror, use their APIs to get pixel coordinates
  const lineHeight = 20; // Example
  const charWidth = 8; // Example
  
  return {
    x: cursor.column * charWidth,
    y: cursor.line * lineHeight,
  };
}
```

**Success Criteria:**
- ✅ Users can see who else is editing
- ✅ Cursors are visible and color-coded
- ✅ Real-time updates (<100ms)
- ✅ Smooth animations

---

### Week 3-4: Reference Manager OAuth & Integration UI

#### Task 4: OAuth 2.0 Flows
**Priority:** 🟡 HIGH  
**Effort:** 4-6 days  
**Owner:** Full-stack Engineer

**Implementation:**

1. **Zotero OAuth**
```typescript
// app/api/auth/zotero/route.ts

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    // Redirect to Zotero authorization
    const authUrl = new URL('https://www.zotero.org/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.ZOTERO_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_URL}/api/auth/zotero`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'all');
    
    return Response.redirect(authUrl);
  }
  
  // Exchange code for token
  const tokenResponse = await fetch('https://www.zotero.org/oauth/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.ZOTERO_CLIENT_ID!,
      client_secret: process.env.ZOTERO_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/zotero`,
      grant_type: 'authorization_code',
    }),
  });
  
  const { access_token, user_id } = await tokenResponse.json();
  
  // Store in database
  await prisma.integration.create({
    data: {
      userId: 'current-user-id', // Get from session
      provider: 'zotero',
      accessToken: access_token,
      externalUserId: user_id,
    },
  });
  
  // Redirect to settings page
  return Response.redirect('/settings/integrations?success=zotero');
}
```

2. **Settings UI**
```typescript
// app/settings/integrations/page.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntegrationsPage() {
  const handleZoteroConnect = () => {
    window.location.href = '/api/auth/zotero';
  };
  
  const handleMendeleyConnect = () => {
    window.location.href = '/api/auth/mendeley';
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your reference managers and other services
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Zotero</CardTitle>
          <CardDescription>
            Sync your citations and references with Zotero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleZoteroConnect}>
            Connect Zotero
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Mendeley</CardTitle>
          <CardDescription>
            Sync your research library with Mendeley
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleMendeleyConnect}>
            Connect Mendeley
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Success Criteria:**
- ✅ One-click OAuth flow for Zotero
- ✅ One-click OAuth flow for Mendeley
- ✅ Tokens stored securely
- ✅ Automatic token refresh
- ✅ Clear connection status

---

## Additional Recommendations

### Performance Optimization (Week 5)
1. Load testing with 100+ concurrent users
2. WebSocket connection pooling
3. Message batching optimization
4. Redis integration for multi-server

### Production Deployment (Week 6)
1. Set up staging environment
2. Configure load balancer
3. SSL/TLS certificates
4. Monitoring and alerting

### Pilot Program (Week 7-8)
1. Recruit 5-10 institutions
2. Onboard pilot users
3. Gather feedback
4. Iterate on features

---

## Success Metrics

### Week 1-2 Targets
- [ ] 100% WebSocket connections authenticated
- [ ] All room access controlled by ACL
- [ ] Rate limiting active and effective

### Week 3-4 Targets
- [ ] Collaboration UI components complete
- [ ] OAuth flows functional
- [ ] User satisfaction >80%

### Week 5-6 Targets
- [ ] Load test: 100+ concurrent users
- [ ] Production deployment complete
- [ ] Monitoring and alerting active

### Week 7-8 Targets
- [ ] 5-10 pilot institutions onboarded
- [ ] 100+ active pilot users
- [ ] NPS score >50

---

## Conclusion

The next 6-8 weeks are critical for transforming Vibe University from a feature-complete platform to a **production-ready, market-ready product**. Focus on:

1. **Security first** - No production deployment without proper authentication
2. **User experience** - Collaboration features must be intuitive and delightful
3. **Seamless integration** - OAuth flows should be one-click simple
4. **Performance at scale** - Load test and optimize for real-world usage
5. **Successful pilots** - Real user feedback drives final improvements

With these tasks complete, Vibe University will be ready for public launch and positioned to become the premier academic workflow platform.

---

**Next Action:** Begin Task 1 (WebSocket Authentication) immediately  
**Estimated Completion:** 6-8 weeks from today  
**Target Launch Date:** January 2026
