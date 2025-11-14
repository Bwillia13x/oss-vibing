/**
 * User Data Export API
 * 
 * FERPA compliance endpoint for users to export their data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { exportUserData, logDataAccess } from '@/lib/compliance/ferpa';

export async function GET(_req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Export user data
    const exportData = await exportUserData(user.userId);

    // Log the data access
    await logDataAccess(user.userId, 'user_data', 'DATA_EXPORTED', user.userId);

    // Return data as JSON
    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="user-data-${user.userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
