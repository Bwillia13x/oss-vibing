import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Setup test environment
beforeAll(() => {
  // Ensure DATABASE_URL is set for tests
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./prisma/dev.db';
  }
  
  // Set JWT secrets for testing if not already set
  if (!process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-for-unit-tests-only';
  }
  
  // Set encryption key for testing if not already set
  if (!process.env.ENCRYPTION_KEY) {
    // 64-character hex string (32 bytes)
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

