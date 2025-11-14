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
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

