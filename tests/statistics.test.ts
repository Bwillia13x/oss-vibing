/**
 * Unit Tests for Statistics System
 * Tests core statistical functions and reports
 */

import { describe, it, expect } from 'vitest';
import {
  mean,
  median,
  mode,
  standardDeviation,
  variance,
  pearsonCorrelation,
  linearRegression,
  tTest,
  zScore,
  percentile,
  confidenceInterval,
} from '@/lib/statistics/core';
import {
  generateSummaryReport,
  generateCorrelationReport,
  generateRegressionReport,
  generateHypothesisTestReport,
} from '@/lib/statistics/reports';

describe('Descriptive Statistics', () => {
  const testData = [10, 20, 30, 40, 50];

  it('should calculate mean correctly', () => {
    const result = mean(testData);
    expect(result).toBe(30);
  });

  it('should calculate median correctly', () => {
    expect(median([1, 2, 3, 4, 5])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('should calculate mode correctly', () => {
    const result = mode([1, 2, 2, 3, 3, 3, 4]);
    expect(result).toBe(3);
  });

  it('should calculate standard deviation', () => {
    const result = standardDeviation(testData);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeCloseTo(15.81, 1);
  });

  it('should calculate variance', () => {
    const result = variance(testData);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeCloseTo(250, 0);
  });

  it('should handle empty array', () => {
    expect(() => mean([])).toThrow();
  });

  it('should handle single value', () => {
    expect(mean([42])).toBe(42);
    expect(median([42])).toBe(42);
  });
});

describe('Correlation and Regression', () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 6, 8, 10];

  it('should calculate Pearson correlation', () => {
    const result = pearsonCorrelation(x, y);
    expect(result).toBeCloseTo(1, 2);
  });

  it('should calculate linear regression', () => {
    const result = linearRegression(x.map((xi, i) => [xi, y[i]]));
    
    expect(result.m).toBeCloseTo(2, 1); // slope
    expect(result.b).toBeCloseTo(0, 1); // intercept
    expect(result.r2).toBeCloseTo(1, 2); // R²
  });

  it('should handle negative correlation', () => {
    const yNeg = [10, 8, 6, 4, 2];
    const result = pearsonCorrelation(x, yNeg);
    expect(result).toBeCloseTo(-1, 2);
  });

  it('should detect no correlation', () => {
    const yRandom = [5, 2, 8, 1, 9];
    const result = pearsonCorrelation(x, yRandom);
    expect(Math.abs(result)).toBeLessThan(1);
  });
});

describe('Hypothesis Testing', () => {
  const sample1 = [23, 25, 27, 29, 31];
  const sample2 = [33, 35, 37, 39, 41];

  it('should perform t-test', () => {
    const result = tTest(sample1, sample2);
    
    expect(result.t).toBeDefined();
    expect(result.p).toBeDefined();
    expect(result.df).toBeDefined();
    expect(result.df).toBeGreaterThan(0);
  });

  it('should calculate z-score', () => {
    const data = [10, 20, 30, 40, 50];
    const avg = mean(data);
    const std = standardDeviation(data);
    
    const z = zScore(30, avg, std);
    expect(z).toBeCloseTo(0, 1);
  });

  it('should calculate percentile', () => {
    const data = [10, 20, 30, 40, 50];
    const p = percentile(data, 30);
    
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(100);
  });

  it('should calculate confidence interval', () => {
    const data = [23, 25, 27, 29, 31];
    const ci = confidenceInterval(data, 0.95);
    
    expect(ci).toHaveLength(2);
    expect(ci[0]).toBeLessThan(ci[1]);
  });
});

describe('Statistical Reports', () => {
  const testData = [10, 20, 30, 40, 50];

  it('should generate summary report', () => {
    const report = generateSummaryReport(testData);
    
    expect(report.mean).toBeDefined();
    expect(report.median).toBeDefined();
    expect(report.stdDev).toBeDefined();
    expect(report.min).toBe(10);
    expect(report.max).toBe(50);
    expect(report.count).toBe(5);
  });

  it('should generate correlation report', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    
    const report = generateCorrelationReport(x, y, 'X', 'Y', 'pearson', 'object');
    
    expect(report.pearson).toBeDefined();
    expect(report.interpretation).toBeDefined();
  });

  it('should generate regression report', () => {
    const data: [number, number][] = [
      [1, 2],
      [2, 4],
      [3, 6],
      [4, 8],
      [5, 10],
    ];
    
    const report = generateRegressionReport(data, 'X', 'Y', 'object');
    
    expect(report.slope).toBeDefined();
    expect(report.intercept).toBeDefined();
    expect(report.r2).toBeDefined();
    expect(report.equation).toBeDefined();
  });

  it('should generate hypothesis test report', () => {
    const sample1 = [23, 25, 27, 29, 31];
    const sample2 = [33, 35, 37, 39, 41];
    
    const report = generateHypothesisTestReport(sample1, sample2);
    
    expect(report.tStatistic).toBeDefined();
    expect(report.pValue).toBeDefined();
    expect(report.significant).toBeDefined();
    expect(report.conclusion).toBeDefined();
  });
});

describe('Edge Cases', () => {
  it('should handle outliers', () => {
    const dataWithOutliers = [10, 12, 11, 13, 100];
    const avg = mean(dataWithOutliers);
    
    expect(avg).toBeGreaterThan(10);
    expect(avg).toBeLessThan(100);
  });

  it('should handle negative numbers', () => {
    const negativeData = [-10, -5, 0, 5, 10];
    
    expect(mean(negativeData)).toBe(0);
    expect(median(negativeData)).toBe(0);
  });

  it('should handle decimal precision', () => {
    const decimalData = [1.1, 2.2, 3.3, 4.4, 5.5];
    const avg = mean(decimalData);
    
    expect(avg).toBeCloseTo(3.3, 1);
  });

  it('should handle large datasets', () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => i + 1);
    const avg = mean(largeData);
    
    expect(avg).toBe(5000.5);
  });
});
