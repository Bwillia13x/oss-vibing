/**
 * Data Encryption Service for FERPA Compliance
 * 
 * Provides encryption at rest for sensitive student data
 * Uses AES-256-GCM encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * In production, this should be stored in a secure key management system (e.g., AWS KMS)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production-must-be-32-bytes';
  
  // Derive a 32-byte key from the provided key using SHA-256
  return createHash('sha256').update(key).digest();
}

/**
 * Encrypt sensitive data
 */
export function encryptData(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine salt + iv + encrypted + tag
    const result = Buffer.concat([
      salt,
      iv,
      Buffer.from(encrypted, 'hex'),
      tag,
    ]);

    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const data = Buffer.from(encryptedData, 'base64');

    // Extract salt, iv, encrypted data, and tag
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = data.subarray(data.length - TAG_LENGTH);
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH, data.length - TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object (converts to JSON first)
 */
export function encryptObject<T>(obj: T): string {
  const json = JSON.stringify(obj);
  return encryptData(json);
}

/**
 * Decrypt an object (parses JSON after decryption)
 */
export function decryptObject<T>(encryptedData: string): T {
  const json = decryptData(encryptedData);
  return JSON.parse(json) as T;
}

/**
 * Hash sensitive data for comparison (one-way)
 * Useful for things like email addresses that need to be compared but not stored in plaintext
 */
export function hashData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Validate that data can be encrypted and decrypted
 */
export function validateEncryption(): boolean {
  try {
    const testData = 'Test encryption data';
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);
    return testData === decrypted;
  } catch {
    return false;
  }
}
