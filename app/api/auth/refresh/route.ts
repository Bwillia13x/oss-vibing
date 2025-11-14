/**
 * Refresh Token Route
 * 
 * Refreshes access token using refresh token
 */

import { NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth';

export async function POST() {
  try {
    const newToken = await refreshAccessToken();
    
    if (!newToken) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
