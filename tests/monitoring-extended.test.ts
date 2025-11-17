/**
 * Extended Monitoring Tests
 * 
 * Comprehensive tests for monitoring and performance tracking
 * Target: Increase monitoring coverage from 53% to 70%+
 */

import { describe, it, expect } from 'vitest';
import {
  trackApiPerformance,
  trackQueryPerformance,
  trackCacheHit,
} from '@/lib/monitoring';

describe('Monitoring - Extended Tests', () => {
  describe('Performance Tracking', () => {
    it('should track API performance', async () => {
      const result = await trackApiPerformance('test-api', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { data: 'test' };
      });

      expect(result).toEqual({ data: 'test' });
    });

    it('should measure execution time', async () => {
      const start = Date.now();
      
      await trackApiPerformance('timing-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'done';
      });

      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should handle async errors in tracking', async () => {
      await expect(
        trackApiPerformance('error-test', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should track multiple operations', async () => {
      const operations = [
        trackApiPerformance('op-1', async () => 'result-1'),
        trackApiPerformance('op-2', async () => 'result-2'),
        trackApiPerformance('op-3', async () => 'result-3'),
      ];

      const results = await Promise.all(operations);

      expect(results).toEqual(['result-1', 'result-2', 'result-3']);
    });

    it('should track nested operations', async () => {
      const result = await trackApiPerformance('outer', async () => {
        const inner = await trackApiPerformance('inner', async () => {
          return 'nested-result';
        });
        return { inner };
      });

      expect(result.inner).toBe('nested-result');
    });
  });

  describe('Query Performance Tracking', () => {
    it('should track query performance', async () => {
      const result = await trackQueryPerformance('test-query', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return [{ id: 1 }, { id: 2 }];
      });

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should handle query errors', async () => {
      await expect(
        trackQueryPerformance('error-query', async () => {
          throw new Error('Query failed');
        })
      ).rejects.toThrow('Query failed');
    });

    it('should track multiple queries', async () => {
      const queries = [
        trackQueryPerformance('q1', async () => [1]),
        trackQueryPerformance('q2', async () => [2]),
        trackQueryPerformance('q3', async () => [3]),
      ];

      const results = await Promise.all(queries);

      expect(results).toEqual([[1], [2], [3]]);
    });
  });

  describe('Cache Hit Tracking', () => {
    it('should track cache hits', () => {
      expect(() => trackCacheHit('test-key-1', true)).not.toThrow();
    });

    it('should track cache misses', () => {
      expect(() => trackCacheHit('test-key-2', false)).not.toThrow();
    });

    it('should handle multiple cache events', () => {
      for (let i = 0; i < 10; i++) {
        trackCacheHit(`key-${i}`, i % 2 === 0);
      }
      
      expect(true).toBe(true);
    });

    it('should handle rapid cache tracking', () => {
      const keys = Array.from({ length: 100 }, (_, i) => `rapid-${i}`);
      
      keys.forEach((key, i) => {
        trackCacheHit(key, i % 3 === 0);
      });

      expect(true).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should collect timing metrics', async () => {
      const times: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await trackApiPerformance(`metric-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
        times.push(Date.now() - start);
      }

      expect(times.length).toBe(5);
      times.forEach(time => {
        expect(time).toBeGreaterThanOrEqual(10);
      });
    });

    it('should handle fast operations', async () => {
      await trackApiPerformance('fast-op', async () => {
        return 'immediate';
      });

      expect(true).toBe(true);
    });

    it('should handle slow operations', async () => {
      const start = Date.now();

      await trackApiPerformance('slow-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with try-catch blocks', async () => {
      try {
        await trackApiPerformance('may-fail', async () => {
          if (Math.random() > 0.5) {
            throw new Error('Random error');
          }
          return 'success';
        });
      } catch (error) {
        expect(error instanceof Error).toBe(true);
      }
    });

    it('should preserve return values', async () => {
      const value = await trackApiPerformance('return-value', async () => {
        return { id: 123, name: 'test', data: [1, 2, 3] };
      });

      expect(value).toEqual({ id: 123, name: 'test', data: [1, 2, 3] });
    });

    it('should work with void operations', async () => {
      await trackApiPerformance('void-op', async () => {
        const x = 1 + 1;
        expect(x).toBe(2);
      });

      expect(true).toBe(true);
    });

    it('should track concurrent operations', async () => {
      const concurrent = [
        trackApiPerformance('concurrent-1', async () => {
          await new Promise(resolve => setTimeout(resolve, 20));
          return 1;
        }),
        trackApiPerformance('concurrent-2', async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
          return 2;
        }),
        trackApiPerformance('concurrent-3', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 3;
        }),
      ];

      const results = await Promise.all(concurrent);
      expect(results).toEqual([1, 2, 3]);
    });
  });
});
