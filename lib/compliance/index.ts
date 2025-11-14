/**
 * FERPA Compliance Module
 * 
 * Exports compliance functionality including data export, deletion, and encryption
 */

export {
  RETENTION_POLICIES,
  exportUserData,
  requestUserDataDeletion,
  permanentlyDeleteUserData,
  cleanupExpiredData,
  logDataAccess,
  hasUserConsent,
  recordUserConsent,
} from './ferpa';

export {
  encryptData,
  decryptData,
  encryptObject,
  decryptObject,
  hashData,
  validateEncryption,
} from './encryption';
