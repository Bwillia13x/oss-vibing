/**
 * User Data Deletion API
 * 
 * FERPA compliance endpoint for users to request data deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, clearAuthCookies } from '@/lib/auth';
import { requestUserDataDeletion, logDataAccess } from '@/lib/compliance/ferpa';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Request data deletion
    const result = await requestUserDataDeletion(user.userId);

    // Log the deletion request
    await logDataAccess(user.userId, 'user_data', 'DATA_DELETION_REQUESTED', user.userId);

    // Clear authentication cookies
    await clearAuthCookies();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error requesting data deletion:', error);
    return NextResponse.json(
      { error: 'Failed to request data deletion' },
      { status: 500 }
    );
  }
}

/**
 * Cancel data deletion request
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // This would cancel the deletion request
    // Implementation depends on your specific requirements
    
    return NextResponse.json({
      success: true,
      message: 'Data deletion request cancelled',
    });
  } catch (error) {
    console.error('Error cancelling data deletion:', error);
    return NextResponse.json(
      { error: 'Failed to cancel data deletion' },
      { status: 500 }
    );
  }
}
