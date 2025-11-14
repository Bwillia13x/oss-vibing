/**
 * Authentication Module
 * 
 * Exports authentication functionality including JWT, OAuth, and middleware
 */

// JWT Service
export {
  createAccessToken,
  createRefreshToken,
  verifyToken,
  setAuthCookies,
  getAccessToken,
  getRefreshToken,
  clearAuthCookies,
  getCurrentUser,
  refreshAccessToken,
  type TokenPayload,
} from './jwt-service';

// Google OAuth
export {
  getGoogleClient,
  generateGoogleAuthUrl,
  validateGoogleAuthCode,
  getGoogleUserInfo,
  isEduEmail,
  validateEduEmail,
} from './google-oauth';

// Middleware
export {
  requireAuth,
  requireRole,
  requireAdmin,
  requireInstructor,
  getUser,
  type AuthenticatedRequest,
} from './middleware';

// Account Recovery
export {
  generateRecoveryToken,
  verifyRecoveryToken,
  sendRecoveryEmail,
  isRecoveryAllowed,
  cleanupRecoveryAttempts,
  type RecoveryTokenPayload,
} from './recovery';
