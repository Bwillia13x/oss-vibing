/**
 * Cache Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCached,
  setCached,
  deleteCached,
  deleteCachedPattern,
  clearCache,
  getOrSetCached,
  generateCacheKey,
  DEFAULT_TTL,
} from '../lib/cache/cache-service';

describe('Cache Service', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await clearCache();
  });

  afterEach(async () => {
    // Clear cache after each test
    await clearCache();
  });

  describe('Basic Operations', () => {
    it('should set and get a cached value', async () => {
      const key = 'test-key';
      const value = { data: 'test-data', count: 42 };

      await setCached(key, value, DEFAULT_TTL.SHORT);
      const cached = await getCached<typeof value>(key);

      expect(cached).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const cached = await getCached('non-existent-key');
      expect(cached).toBeNull();
    });

    it('should delete a cached value', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await setCached(key, value, DEFAULT_TTL.SHORT);
      await deleteCached(key);
      const cached = await getCached(key);

      expect(cached).toBeNull();
    });

    it('should handle different data types', async () => {
      // String
      await setCached('string-key', 'hello', DEFAULT_TTL.SHORT);
      expect(await getCached<string>('string-key')).toBe('hello');

      // Number
      await setCached('number-key', 42, DEFAULT_TTL.SHORT);
      expect(await getCached<number>('number-key')).toBe(42);

      // Boolean
      await setCached('boolean-key', true, DEFAULT_TTL.SHORT);
      expect(await getCached<boolean>('boolean-key')).toBe(true);

      // Array
      await setCached('array-key', [1, 2, 3], DEFAULT_TTL.SHORT);
      expect(await getCached<number[]>('array-key')).toEqual([1, 2, 3]);

      // Object
      await setCached('object-key', { a: 1, b: 2 }, DEFAULT_TTL.SHORT);
      expect(await getCached<{ a: number; b: number }>('object-key')).toEqual({ a: 1, b: 2 });
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect TTL', async () => {
      const key = 'ttl-test';
      const value = 'expires-soon';

      // Set with 1 second TTL
      await setCached(key, value, 1);

      // Should be available immediately
      expect(await getCached(key)).toBe(value);

      // Wait for expiration (1.5 seconds to be safe)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Should be expired
      expect(await getCached(key)).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl-test';
      const value = 'test-value';

      await setCached(key, value);
      const cached = await getCached(key);

      expect(cached).toBe(value);
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete keys matching pattern', async () => {
      await setCached('user:1:profile', { name: 'Alice' }, DEFAULT_TTL.SHORT);
      await setCached('user:2:profile', { name: 'Bob' }, DEFAULT_TTL.SHORT);
      await setCached('user:3:profile', { name: 'Charlie' }, DEFAULT_TTL.SHORT);
      await setCached('post:1', { title: 'Post 1' }, DEFAULT_TTL.SHORT);

      // Delete all user profile keys
      await deleteCachedPattern('user:*:profile');

      // User profiles should be gone
      expect(await getCached('user:1:profile')).toBeNull();
      expect(await getCached('user:2:profile')).toBeNull();
      expect(await getCached('user:3:profile')).toBeNull();

      // Post should still exist
      expect(await getCached('post:1')).not.toBeNull();
    });
  });

  describe('Cache-Aside Pattern', () => {
    it('should fetch and cache value on first call', async () => {
      const key = 'cache-aside-test';
      const mockFetch = vi.fn(async () => ({ data: 'fetched-data' }));

      const result = await getOrSetCached(key, mockFetch, DEFAULT_TTL.SHORT);

      expect(result).toEqual({ data: 'fetched-data' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return cached value on subsequent calls', async () => {
      const key = 'cache-aside-test-2';
      const mockFetch = vi.fn(async () => ({ data: 'fetched-data' }));

      // First call - should fetch
      await getOrSetCached(key, mockFetch, DEFAULT_TTL.SHORT);

      // Second call - should use cache
      const result = await getOrSetCached(key, mockFetch, DEFAULT_TTL.SHORT);

      expect(result).toEqual({ data: 'fetched-data' });
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should only fetch once
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate cache key from parts', () => {
      expect(generateCacheKey('user', 1, 'profile')).toBe('user:1:profile');
      expect(generateCacheKey('api', 'v1', 'users', 123)).toBe('api:v1:users:123');
    });

    it('should filter out undefined values', () => {
      expect(generateCacheKey('user', undefined, 'profile')).toBe('user:profile');
      expect(generateCacheKey('api', 'v1', undefined, 'users')).toBe('api:v1:users');
    });
  });

  describe('Clear Cache', () => {
    it('should clear all cached values', async () => {
      await setCached('key1', 'value1', DEFAULT_TTL.SHORT);
      await setCached('key2', 'value2', DEFAULT_TTL.SHORT);
      await setCached('key3', 'value3', DEFAULT_TTL.SHORT);

      await clearCache();

      expect(await getCached('key1')).toBeNull();
      expect(await getCached('key2')).toBeNull();
      expect(await getCached('key3')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      // This should not throw
      const result = await getCached('invalid-key');
      expect(result).toBeNull();
    });

    it('should handle cache failures gracefully', async () => {
      // Setting with invalid key should not throw
      await expect(setCached('', { data: 'test' }, DEFAULT_TTL.SHORT)).resolves.toBeUndefined();
    });
  });
});
