/**
 * Extended Statistics Tests
 * 
 * Additional tests to increase statistics test coverage
 */

import { describe, it, expect } from 'vitest';
import {
  mean,
  median,
  standardDeviation,
  pearsonCorrelation,
  spearmanCorrelation,
  linearRegression,
  tTest,
  twoSampleTTest,
  chiSquareTest,
  oneWayANOVA,
  zScore,
  percentile,
  percentileRank,
  confidenceInterval,
  interquartileRange,
  min,
  max,
  sum,
  descriptiveStatistics,
  correlationWithInterpretation,
  predict,
} from '@/lib/statistics/core';
import {
  generateDescriptiveReport,
  generateCorrelationReport,
  generateRegressionReport,
  generateTTestReport,
} from '@/lib/statistics/reports';

describe('Extended Descriptive Statistics', () => {
  describe('Basic Statistics', () => {
    it('should calculate min correctly', () => {
      expect(min([10, 20, 5, 30])).toBe(5);
    });

    it('should calculate max correctly', () => {
      expect(max([10, 20, 50, 30])).toBe(50);
    });

    it('should calculate sum correctly', () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
    });

    it('should calculate percentile', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const q25 = percentile(data, 25);
      expect(q25).toBeGreaterThan(0);
    });

    it('should handle negative numbers', () => {
      expect(min([-10, -5, 0, 5, 10])).toBe(-10);
      expect(max([-10, -5, 0, 5, 10])).toBe(10);
    });
  });

  describe('Descriptive Statistics Object', () => {
    it('should generate comprehensive descriptive stats', () => {
      const data = [10, 20, 30, 40, 50];
      const stats = descriptiveStatistics(data);
      
      expect(stats.mean).toBe(30);
      expect(stats.median).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
    });

    it('should handle single value array', () => {
      const stats = descriptiveStatistics([42]);
      expect(stats.mean).toBe(42);
      expect(stats.median).toBe(42);
    });
  });

  describe('Percentiles', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('should calculate 50th percentile (median)', () => {
      const result = percentile(data, 50);
      expect(result).toBeCloseTo(5.5, 1);
    });

    it('should calculate 75th percentile', () => {
      const result = percentile(data, 75);
      expect(result).toBeGreaterThan(5);
    });

    it('should calculate percentile rank', () => {
      const rank = percentileRank(data, 5);
      expect(rank).toBeGreaterThan(0);
      expect(rank).toBeLessThan(100);
    });
  });

  describe('Z-Scores', () => {
    it('should calculate z-score correctly', () => {
      const zScoreValue = zScore(50, 30, 10);
      expect(zScoreValue).toBe(2);
    });

    it('should calculate negative z-score', () => {
      const zScoreValue = zScore(10, 30, 10);
      expect(zScoreValue).toBe(-2);
    });

    it('should calculate z-score for mean value', () => {
      const zScoreValue = zScore(30, 30, 10);
      expect(zScoreValue).toBe(0);
    });
  });

  describe('Confidence Intervals', () => {
    const data = [23, 25, 27, 29, 31, 33, 35];

    it('should calculate 95% confidence interval', () => {
      const result = confidenceInterval(data, 0.95);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBeLessThan(result[1]);
    });

    it('should calculate 99% confidence interval', () => {
      const result = confidenceInterval(data, 0.99);
      expect(result[0]).toBeLessThan(result[1]);
      const ci95 = confidenceInterval(data, 0.95);
      expect(result[1] - result[0]).toBeGreaterThan(ci95[1] - ci95[0]);
    });

    it('should calculate 90% confidence interval', () => {
      const result = confidenceInterval(data, 0.90);
      expect(result[0]).toBeLessThan(result[1]);
    });
  });

  describe('IQR', () => {
    it('should calculate interquartile range', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = interquartileRange(data);
      expect(result).toBeGreaterThan(0);
    });
  });
});

describe('Extended Correlation and Regression', () => {
  describe('Correlation', () => {
    it('should handle perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = pearsonCorrelation(x, y);
      expect(result).toBeCloseTo(1, 5);
    });

    it('should handle perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      const result = pearsonCorrelation(x, y);
      expect(result).toBeCloseTo(-1, 5);
    });

    it('should calculate Spearman correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = spearmanCorrelation(x, y);
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });

    it('should provide correlation interpretation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const result = correlationWithInterpretation(x, y);
      
      expect(result.coefficient).toBeDefined();
      expect(result.strength).toBeDefined();
      expect(result.direction).toBeDefined();
    });
  });

  describe('Linear Regression', () => {
    it('should calculate regression with high R²', () => {
      const data: [number, number][] = [[1, 2], [2, 4], [3, 6], [4, 8], [5, 10]];
      const result = linearRegression(data);
      
      expect(result.m).toBeCloseTo(2, 5);
      expect(result.b).toBeCloseTo(0, 5);
      expect(result.r2).toBeCloseTo(1, 5);
    });

    it('should calculate regression with intercept', () => {
      const data: [number, number][] = [[1, 5], [2, 7], [3, 9], [4, 11], [5, 13]];
      const result = linearRegression(data);
      
      expect(result.m).toBeCloseTo(2, 1);
      expect(result.b).toBeCloseTo(3, 1);
    });

    it('should handle negative slope', () => {
      const data: [number, number][] = [[1, 10], [2, 8], [3, 6], [4, 4], [5, 2]];
      const result = linearRegression(data);
      
      expect(result.m).toBeLessThan(0);
    });

    it('should predict using regression', () => {
      const data: [number, number][] = [[1, 2], [2, 4], [3, 6], [4, 8]];
      const result = linearRegression(data);
      
      const predicted = predict(result, [5]);
      expect(predicted[0]).toBeCloseTo(10, 1);
    });

    it('should predict multiple values', () => {
      const data: [number, number][] = [[1, 2], [2, 4], [3, 6]];
      const result = linearRegression(data);
      
      const predictions = predict(result, [4, 5, 6]);
      expect(predictions).toHaveLength(3);
    });
  });
});

describe('Extended Hypothesis Testing', () => {
  describe('T-Test', () => {
    it('should perform t-test on different samples', () => {
      const sample1 = [20, 22, 24, 26, 28];
      const sample2 = [40, 42, 44, 46, 48];
      
      const result = tTest(sample1, sample2);
      expect(result.pValue).toBeLessThan(0.05);
    });

    it('should calculate t-statistic', () => {
      const sample1 = [10, 12, 14, 16, 18];
      const sample2 = [20, 22, 24, 26, 28];
      
      const result = tTest(sample1, sample2);
      expect(result.tStatistic).toBeDefined();
      expect(Math.abs(result.tStatistic)).toBeGreaterThan(0);
    });

    it('should calculate degrees of freedom', () => {
      const sample1 = [1, 2, 3, 4, 5];
      const sample2 = [6, 7, 8, 9, 10];
      
      const result = tTest(sample1, sample2);
      expect(result.df).toBe(8);
    });

    it('should use two sample t-test', () => {
      const sample1 = [15, 17, 19];
      const sample2 = [25, 27, 29];
      
      const result = twoSampleTTest(sample1, sample2);
      expect(result.pValue).toBeDefined();
    });
  });

  describe('Chi-Square Test', () => {
    it('should perform chi-square test', () => {
      const observed = [10, 15, 20, 25];
      const expected = [12, 18, 18, 22];
      
      const result = chiSquareTest(observed, expected);
      expect(result.chiSquare).toBeGreaterThan(0);
      expect(result.pValue).toBeDefined();
    });
  });

  describe('ANOVA Test', () => {
    it('should perform one-way ANOVA', () => {
      const groups = [
        [10, 12, 14],
        [20, 22, 24],
        [30, 32, 34]
      ];
      
      const result = oneWayANOVA(groups);
      expect(result.fStatistic).toBeGreaterThan(0);
      expect(result.pValue).toBeDefined();
    });
  });
});

describe('Extended Report Generation', () => {
  describe('Descriptive Reports', () => {
    it('should generate descriptive report', () => {
      const data = [10, 20, 30, 40, 50, 60, 70, 80, 90];
      const report = generateDescriptiveReport(data);
      
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
    });
  });

  describe('Correlation Reports', () => {
    it('should generate correlation report', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const report = generateCorrelationReport(x, y);
      
      expect(report).toBeDefined();
    });
  });

  describe('Regression Reports', () => {
    it('should generate regression report', () => {
      const data: [number, number][] = [[1, 2], [2, 4], [3, 6], [4, 8]];
      const report = generateRegressionReport(data);
      
      expect(report).toBeDefined();
    });
  });

  describe('T-Test Reports', () => {
    it('should generate t-test report', () => {
      const sample1 = [20, 22, 24, 26, 28];
      const sample2 = [30, 32, 34, 36, 38];
      
      const report = generateTTestReport(sample1, sample2);
      
      expect(report).toBeDefined();
    });
  });
});

describe('Error Handling and Edge Cases', () => {
  it('should handle empty arrays in mean', () => {
    expect(() => mean([])).toThrow();
  });

  it('should handle empty arrays in median', () => {
    expect(() => median([])).toThrow();
  });

  it('should handle empty arrays in std dev', () => {
    expect(() => standardDeviation([])).toThrow();
  });

  it('should handle single value arrays', () => {
    expect(mean([42])).toBe(42);
    expect(median([42])).toBe(42);
  });

  it('should handle insufficient data for regression', () => {
    expect(() => linearRegression([[1, 2]])).toThrow();
  });

  it('should handle mismatched array lengths in correlation', () => {
    expect(() => pearsonCorrelation([1, 2, 3], [1, 2])).toThrow();
  });
});
