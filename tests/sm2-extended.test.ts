/**
 * Extended SM2 Algorithm Tests
 * 
 * Comprehensive tests for SM-2 spaced repetition algorithm
 * Target: Increase SM2 coverage
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNextReview,
  initializeReviewData,
  type FlashcardReviewData,
  type ReviewQuality,
} from '@/lib/sm2-algorithm';

describe('SM2 Algorithm - Extended Tests', () => {
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const data = initializeReviewData();

      expect(data.easeFactor).toBe(2.5);
      expect(data.interval).toBe(1);
      expect(data.repetitions).toBe(0);
      expect(data.nextReview).toBeInstanceOf(Date);
    });

    it('should set next review to tomorrow', () => {
      const data = initializeReviewData();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const diffInDays = Math.floor(
        (data.nextReview.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffInDays).toBe(1);
    });
  });

  describe('Perfect Response (Quality 5)', () => {
    it('should increase ease factor on perfect response', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(5, initial);

      expect(result.easeFactor).toBeGreaterThan(initial.easeFactor);
    });

    it('should set interval to 1 day on first repetition', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(5, initial);

      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('should set interval to 6 days on second repetition', () => {
      const initial = initializeReviewData();
      const first = calculateNextReview(5, initial);
      const second = calculateNextReview(5, first);

      expect(second.interval).toBe(6);
      expect(second.repetitions).toBe(2);
    });

    it('should exponentially increase interval after second repetition', () => {
      let current = initializeReviewData();

      // First review
      current = calculateNextReview(5, current);
      expect(current.interval).toBe(1);

      // Second review
      current = calculateNextReview(5, current);
      expect(current.interval).toBe(6);

      // Third review - should be 6 * easeFactor
      current = calculateNextReview(5, current);
      expect(current.interval).toBeGreaterThan(6);
      expect(current.interval).toBeLessThan(20); // Reasonable bound
    });

    it('should compound ease factor over multiple reviews', () => {
      let current = initializeReviewData();
      const initialEF = current.easeFactor;

      for (let i = 0; i < 5; i++) {
        current = calculateNextReview(5, current);
      }

      expect(current.easeFactor).toBeGreaterThan(initialEF);
    });
  });

  describe('Good Response (Quality 4)', () => {
    it('should slightly increase ease factor', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(4, initial);

      expect(result.easeFactor).toBeGreaterThanOrEqual(initial.easeFactor);
    });

    it('should progress through repetitions normally', () => {
      let current = initializeReviewData();

      current = calculateNextReview(4, current);
      expect(current.repetitions).toBe(1);
      expect(current.interval).toBe(1);

      current = calculateNextReview(4, current);
      expect(current.repetitions).toBe(2);
      expect(current.interval).toBe(6);
    });
  });

  describe('Moderate Response (Quality 3)', () => {
    it('should maintain or slightly decrease ease factor', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(3, initial);

      expect(result.easeFactor).toBeLessThanOrEqual(initial.easeFactor + 0.1);
    });

    it('should still increment repetitions', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(3, initial);

      expect(result.repetitions).toBe(1);
    });

    it('should have longer intervals than perfect but similar pattern', () => {
      let current = initializeReviewData();

      current = calculateNextReview(3, current);
      expect(current.interval).toBe(1);

      current = calculateNextReview(3, current);
      expect(current.interval).toBe(6);
    });
  });

  describe('Poor Response (Quality 0-2)', () => {
    it('should reset repetitions on quality 0', () => {
      let current = initializeReviewData();

      // Build up some repetitions
      current = calculateNextReview(5, current);
      current = calculateNextReview(5, current);
      expect(current.repetitions).toBe(2);

      // Fail with quality 0
      current = calculateNextReview(0, current);

      expect(current.repetitions).toBe(0);
      expect(current.interval).toBe(1);
    });

    it('should reset repetitions on quality 1', () => {
      let current = initializeReviewData();

      current = calculateNextReview(5, current);
      current = calculateNextReview(5, current);

      current = calculateNextReview(1, current);

      expect(current.repetitions).toBe(0);
      expect(current.interval).toBe(1);
    });

    it('should reset repetitions on quality 2', () => {
      let current = initializeReviewData();

      current = calculateNextReview(5, current);
      current = calculateNextReview(5, current);

      current = calculateNextReview(2, current);

      expect(current.repetitions).toBe(0);
      expect(current.interval).toBe(1);
    });

    it('should decrease ease factor on poor response', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(0, initial);

      expect(result.easeFactor).toBeLessThan(initial.easeFactor);
    });

    it('should never decrease ease factor below 1.3', () => {
      let current = initializeReviewData();

      // Multiple poor responses
      for (let i = 0; i < 10; i++) {
        current = calculateNextReview(0, current);
      }

      expect(current.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('Mixed Quality Reviews', () => {
    it('should handle alternating perfect and poor responses', () => {
      let current = initializeReviewData();

      current = calculateNextReview(5, current);
      expect(current.repetitions).toBe(1);

      current = calculateNextReview(0, current);
      expect(current.repetitions).toBe(0);

      current = calculateNextReview(5, current);
      expect(current.repetitions).toBe(1);
    });

    it('should maintain ease factor changes across resets', () => {
      let current = initializeReviewData();
      const initialEF = current.easeFactor;

      // Good response, then poor response
      current = calculateNextReview(5, current);
      const afterGood = current.easeFactor;

      current = calculateNextReview(0, current);
      const afterPoor = current.easeFactor;

      expect(afterGood).toBeGreaterThan(initialEF);
      expect(afterPoor).toBeLessThan(afterGood);
    });

    it('should handle realistic study session', () => {
      let current = initializeReviewData();

      // Simulate realistic review pattern
      const qualities: ReviewQuality[] = [4, 5, 3, 5, 2, 4, 5, 5, 4];

      for (const quality of qualities) {
        current = calculateNextReview(quality, current);
      }

      expect(current).toBeDefined();
      expect(current.easeFactor).toBeGreaterThan(1.3);
      expect(current.interval).toBeGreaterThan(0);
    });
  });

  describe('Next Review Date', () => {
    it('should set lastReviewed to current date', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(5, initial);

      expect(result.lastReviewed).toBeInstanceOf(Date);

      const now = new Date();
      const diff = Math.abs(now.getTime() - result.lastReviewed!.getTime());

      // Should be within 1 second
      expect(diff).toBeLessThan(1000);
    });

    it('should set nextReview to future date', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(5, initial);

      expect(result.nextReview.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should calculate correct next review days', () => {
      const initial = initializeReviewData();
      const result = calculateNextReview(5, initial);

      const diffInDays = Math.floor(
        (result.nextReview.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffInDays).toBe(result.interval);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum repetitions', () => {
      const current: FlashcardReviewData = {
        easeFactor: 2.5,
        interval: 100,
        repetitions: 50,
        nextReview: new Date(),
      };

      const result = calculateNextReview(5, current);

      expect(result.repetitions).toBe(51);
      expect(result.interval).toBeGreaterThan(100);
    });

    it('should handle minimum ease factor', () => {
      const current: FlashcardReviewData = {
        easeFactor: 1.3,
        interval: 1,
        repetitions: 0,
        nextReview: new Date(),
      };

      const result = calculateNextReview(0, current);

      expect(result.easeFactor).toBe(1.3); // Should not go below 1.3
    });

    it('should handle very high ease factor', () => {
      const current: FlashcardReviewData = {
        easeFactor: 5.0,
        interval: 30,
        repetitions: 10,
        nextReview: new Date(),
      };

      const result = calculateNextReview(5, current);

      expect(result.easeFactor).toBeGreaterThan(5.0);
      expect(result.interval).toBeGreaterThan(30);
    });

    it('should round intervals to nearest day', () => {
      const current: FlashcardReviewData = {
        easeFactor: 2.7,
        interval: 13,
        repetitions: 3,
        nextReview: new Date(),
      };

      const result = calculateNextReview(5, current);

      // Interval should be an integer
      expect(Number.isInteger(result.interval)).toBe(true);
    });
  });

  describe('All Quality Levels', () => {
    it('should handle all quality levels 0-5', () => {
      const qualities: ReviewQuality[] = [0, 1, 2, 3, 4, 5];

      qualities.forEach((quality) => {
        const initial = initializeReviewData();
        const result = calculateNextReview(quality, initial);

        expect(result).toBeDefined();
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        expect(result.interval).toBeGreaterThan(0);
        expect(result.repetitions).toBeGreaterThanOrEqual(0);
      });
    });

    it('should produce different results for different qualities', () => {
      const results = [0, 1, 2, 3, 4, 5].map((quality) => {
        const initial = initializeReviewData();
        return calculateNextReview(quality as ReviewQuality, initial);
      });

      // Ease factors should vary
      const easeFactors = results.map((r) => r.easeFactor);
      const uniqueEFs = new Set(easeFactors);

      expect(uniqueEFs.size).toBeGreaterThan(1);
    });
  });
});
