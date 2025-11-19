import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

// Paths that don't require authentication
const PUBLIC_PATHS = [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/callback',
    '/',
    '/about',
    '/contact'
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if the path is public
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    // Check for access token in cookies or Authorization header
    let token = request.cookies.get('access_token')?.value

    if (!token) {
        const authHeader = request.headers.get('Authorization')
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7)
        }
    }

    // If no token found, redirect to login or return 401
    if (!token) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
    }

    // Verify token
    const payload = await verifyToken(token)

    if (!payload) {
        // Token is invalid or expired
        if (pathname.startsWith('/api')) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
    }

    // Token is valid, proceed
    const response = NextResponse.next()

    // Add user info to headers for downstream use if needed
    response.headers.set('x-user-id', payload.id)
    response.headers.set('x-user-role', payload.role)

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}
