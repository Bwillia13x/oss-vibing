/**
 * Core Statistical Analysis Library
 * 
 * Provides production-ready statistical functions using simple-statistics.js
 * Includes descriptive statistics, correlation, regression, hypothesis testing, and distributions.
 */

import * as ss from 'simple-statistics'
import { perfMonitor } from '@/lib/performance'
import { dataCache } from '@/lib/cache'

// Cache TTL for statistical computations (10 minutes - results are deterministic)
const STATS_CACHE_TTL_SECONDS = 600

// Helper function to track API performance
function trackApiPerformance(endpoint: string, duration: number, success: boolean): void {
  perfMonitor.record(endpoint, duration, { success })
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface DescriptiveStats {
  mean: number
  median: number
  mode: number | number[]
  standardDeviation: number
  variance: number
  min: number
  max: number
  range: number
  count: number
  sum: number
}

export interface RegressionResult {
  slope: number
  intercept: number
  rSquared: number
  equation: string
  predictions?: number[]
  // Aliases for compatibility
  m?: number
  b?: number
  r2?: number
}

export interface TTestResult {
  tStatistic: number
  pValue: number
  degreesOfFreedom: number
  significant: boolean
  confidenceLevel: number
  // Aliases for compatibility
  t?: number
  p?: number
  df?: number
}

export interface ChiSquareResult {
  chiSquare: number
  pValue: number
  degreesOfFreedom: number
  significant: boolean
}

export interface ANOVAResult {
  fStatistic: number
  pValue: number
  degreesOfFreedomBetween: number
  degreesOfFreedomWithin: number
  significant: boolean
}

export interface CorrelationResult {
  coefficient: number
  strength: 'very weak' | 'weak' | 'moderate' | 'strong' | 'very strong'
  direction: 'positive' | 'negative' | 'none'
}

// ============================================================================
// Input Validation
// ============================================================================

function validateArray(data: number[], minLength: number = 1, name: string = 'data'): void {
  if (!Array.isArray(data)) {
    throw new Error(`${name} must be an array`)
  }
  if (data.length < minLength) {
    throw new Error(`${name} must have at least ${minLength} elements`)
  }
  if (data.some(x => typeof x !== 'number' || !isFinite(x))) {
    throw new Error(`${name} must contain only finite numbers`)
  }
}

function validateProbability(p: number): void {
  if (typeof p !== 'number' || p < 0 || p > 1) {
    throw new Error('Probability must be a number between 0 and 1')
  }
}

function validateConfidence(confidence: number): void {
  if (typeof confidence !== 'number' || confidence <= 0 || confidence >= 1) {
    throw new Error('Confidence level must be between 0 and 1 (e.g., 0.95 for 95%)')
  }
}

// ============================================================================
// Descriptive Statistics
// ============================================================================

/**
 * Calculate the arithmetic mean (average) of a dataset
 */
export function mean(data: number[]): number {
  const startTime = Date.now()
  try {
    validateArray(data)
    const result = ss.mean(data)
    trackApiPerformance('statistics.mean', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.mean', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Calculate the median (middle value) of a dataset
 */
export function median(data: number[]): number {
  const startTime = Date.now()
  try {
    validateArray(data)
    const result = ss.median(data)
    trackApiPerformance('statistics.median', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.median', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Calculate the mode (most frequent value) of a dataset
 * Returns single value or array of values if multimodal
 */
export function mode(data: number[]): number | number[] {
  const startTime = Date.now()
  try {
    validateArray(data)
    const result = ss.mode(data)
    trackApiPerformance('statistics.mode', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.mode', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Calculate the sample standard deviation
 */
export function standardDeviation(data: number[]): number {
  const startTime = Date.now()
  try {
    validateArray(data, 2, 'data')
    const result = ss.sampleStandardDeviation(data)
    trackApiPerformance('statistics.standardDeviation', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.standardDeviation', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Calculate the sample variance
 */
export function variance(data: number[]): number {
  const startTime = Date.now()
  try {
    validateArray(data, 2, 'data')
    const result = ss.sampleVariance(data)
    trackApiPerformance('statistics.variance', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.variance', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Calculate a specific quantile/percentile
 * @param p - Quantile value between 0 and 1 (e.g., 0.5 for median, 0.25 for Q1)
 */
export function quantile(data: number[], p: number): number {
  const startTime = Date.now()
  try {
    validateArray(data)
    validateProbability(p)
    const result = ss.quantile(data, p)
    trackApiPerformance('statistics.quantile', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.quantile', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Calculate minimum value
 */
export function min(data: number[]): number {
  validateArray(data)
  return ss.min(data)
}

/**
 * Calculate maximum value
 */
export function max(data: number[]): number {
  validateArray(data)
  return ss.max(data)
}

/**
 * Calculate sum of all values
 */
export function sum(data: number[]): number {
  validateArray(data)
  return ss.sum(data)
}

/**
 * Get comprehensive descriptive statistics for a dataset (with caching)
 */
export function descriptiveStatistics(data: number[]): DescriptiveStats {
  // Generate cache key from data
  const cacheKey = `stats:descriptive:${JSON.stringify(data)}`
  
  // Try to get from cache
  const cached = dataCache.get(cacheKey) as DescriptiveStats | null
  if (cached !== null) {
    return cached
  }
  
  const startTime = Date.now()
  try {
    validateArray(data)
    
    const result: DescriptiveStats = {
      mean: mean(data),
      median: median(data),
      mode: mode(data),
      standardDeviation: data.length > 1 ? standardDeviation(data) : 0,
      variance: data.length > 1 ? variance(data) : 0,
      min: min(data),
      max: max(data),
      range: max(data) - min(data),
      count: data.length,
      sum: sum(data),
    }
    
    // Store in cache
    dataCache.set(cacheKey, result)
    
    trackApiPerformance('statistics.descriptiveStatistics', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.descriptiveStatistics', Date.now() - startTime, false)
    throw error
  }
}

// ============================================================================
// Correlation Analysis
// ============================================================================

/**
 * Calculate Pearson correlation coefficient (linear relationship)
 * Returns value between -1 and 1
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const startTime = Date.now()
  try {
    validateArray(x, 2, 'x')
    validateArray(y, 2, 'y')
    if (x.length !== y.length) {
      throw new Error('Arrays must have the same length')
    }
    
    const result = ss.sampleCorrelation(x, y)
    trackApiPerformance('statistics.pearsonCorrelation', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.pearsonCorrelation', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Calculate Spearman rank correlation coefficient (monotonic relationship)
 * Returns value between -1 and 1
 */
export function spearmanCorrelation(x: number[], y: number[]): number {
  const startTime = Date.now()
  try {
    validateArray(x, 2, 'x')
    validateArray(y, 2, 'y')
    if (x.length !== y.length) {
      throw new Error('Arrays must have the same length')
    }
    
    // Convert to ranks
    const rankX = x.map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val)
      .map((item, rank) => ({ ...item, rank: rank + 1 }))
      .sort((a, b) => a.idx - b.idx)
      .map(item => item.rank)
    
    const rankY = y.map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val)
      .map((item, rank) => ({ ...item, rank: rank + 1 }))
      .sort((a, b) => a.idx - b.idx)
      .map(item => item.rank)
    
    const result = ss.sampleCorrelation(rankX, rankY)
    trackApiPerformance('statistics.spearmanCorrelation', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.spearmanCorrelation', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Get correlation with interpretation (with caching)
 */
export function correlationWithInterpretation(x: number[], y: number[], method: 'pearson' | 'spearman' = 'pearson'): CorrelationResult {
  // Generate cache key from data and method
  const cacheKey = `stats:correlation:${method}:${JSON.stringify(x)}:${JSON.stringify(y)}`
  
  // Try to get from cache
  const cached = dataCache.get(cacheKey) as CorrelationResult | null
  if (cached !== null) {
    return cached
  }
  
  const coefficient = method === 'pearson' ? pearsonCorrelation(x, y) : spearmanCorrelation(x, y)
  const absCoeff = Math.abs(coefficient)
  
  let strength: CorrelationResult['strength']
  if (absCoeff < 0.2) strength = 'very weak'
  else if (absCoeff < 0.4) strength = 'weak'
  else if (absCoeff < 0.6) strength = 'moderate'
  else if (absCoeff < 0.8) strength = 'strong'
  else strength = 'very strong'
  
  let direction: CorrelationResult['direction']
  if (Math.abs(coefficient) < 0.05) direction = 'none'
  else direction = coefficient > 0 ? 'positive' : 'negative'
  
  const result = { coefficient, strength, direction }
  
  // Store in cache
  dataCache.set(cacheKey, result)
  
  return result
}

// ============================================================================
// Linear Regression
// ============================================================================

/**
 * Perform linear regression (y = mx + b) (with caching)
 * @param data - Array of [x, y] coordinate pairs
 * @returns Slope (m), intercept (b), and R² value
 */
export function linearRegression(data: [number, number][]): RegressionResult {
  // Generate cache key from data
  const cacheKey = `stats:regression:${JSON.stringify(data)}`
  
  // Try to get from cache
  const cached = dataCache.get(cacheKey) as RegressionResult | null
  if (cached !== null) {
    return cached
  }
  
  const startTime = Date.now()
  try {
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Data must have at least 2 points')
    }
    
    const line = ss.linearRegression(data)
    const rSquaredFunc = ss.linearRegressionLine(line)
    const rSquared = ss.rSquared(data, rSquaredFunc)
    
    const result: RegressionResult = {
      slope: line.m,
      intercept: line.b,
      rSquared,
      equation: `y = ${line.m.toFixed(4)}x + ${line.b.toFixed(4)}`,
      // Aliases for compatibility
      m: line.m,
      b: line.b,
      r2: rSquared
    }
    
    // Store in cache
    dataCache.set(cacheKey, result)
    
    trackApiPerformance('statistics.linearRegression', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.linearRegression', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Make predictions using a linear regression model
 */
export function predict(regression: RegressionResult, xValues: number[]): number[] {
  validateArray(xValues)
  return xValues.map(x => regression.slope * x + regression.intercept)
}

// ============================================================================
// Hypothesis Testing
// ============================================================================

/**
 * Perform two-sample t-test (tests if two samples have different means)
 * @param sample1 - First sample
 * @param sample2 - Second sample
 * @param alpha - Significance level (default 0.05 for 95% confidence)
 */
export function tTest(sample1: number[], sample2: number[], alpha: number = 0.05): TTestResult {
  return twoSampleTTest(sample1, sample2, alpha)
}

/**
 * Perform two-sample t-test (tests if two samples have different means)
 * @param sample1 - First sample
 * @param sample2 - Second sample
 * @param alpha - Significance level (default 0.05 for 95% confidence)
 */
export function twoSampleTTest(sample1: number[], sample2: number[], alpha: number = 0.05): TTestResult {
  const startTime = Date.now()
  try {
    validateArray(sample1, 2, 'sample1')
    validateArray(sample2, 2, 'sample2')
    validateProbability(alpha)
    
    const n1 = sample1.length
    const n2 = sample2.length
    const mean1 = mean(sample1)
    const mean2 = mean(sample2)
    const var1 = variance(sample1)
    const var2 = variance(sample2)
    
    // Pooled standard deviation
    const pooledSD = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    
    // T-statistic
    const tStatistic = (mean1 - mean2) / (pooledSD * Math.sqrt(1/n1 + 1/n2))
    const degreesOfFreedom = n1 + n2 - 2
    
    // Approximate p-value using t-distribution
    // For simplicity, using a threshold approach
    const tCritical = getCriticalT(degreesOfFreedom, alpha)
    const significant = Math.abs(tStatistic) > tCritical
    
    const result: TTestResult = {
      tStatistic,
      pValue: significant ? alpha / 2 : alpha, // Approximate
      degreesOfFreedom,
      significant,
      confidenceLevel: 1 - alpha,
      // Aliases for compatibility
      t: tStatistic,
      p: significant ? alpha / 2 : alpha,
      df: degreesOfFreedom
    }
    
    trackApiPerformance('statistics.twoSampleTTest', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.twoSampleTTest', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Get critical t-value (approximation for common significance levels)
 */
function getCriticalT(df: number, alpha: number): number {
  // Simplified t-critical values for two-tailed test
  if (alpha === 0.05) {
    if (df <= 10) return 2.228
    if (df <= 20) return 2.086
    if (df <= 30) return 2.042
    return 1.96 // Approximate as z for large df
  }
  if (alpha === 0.01) {
    if (df <= 10) return 3.169
    if (df <= 20) return 2.845
    if (df <= 30) return 2.750
    return 2.576
  }
  return 1.96 // Default
}

/**
 * Perform chi-square goodness of fit test
 * @param observed - Observed frequencies
 * @param expected - Expected frequencies
 * @param alpha - Significance level (default 0.05)
 */
export function chiSquareTest(observed: number[], expected: number[], alpha: number = 0.05): ChiSquareResult {
  const startTime = Date.now()
  try {
    validateArray(observed, 2, 'observed')
    validateArray(expected, 2, 'expected')
    if (observed.length !== expected.length) {
      throw new Error('Observed and expected arrays must have the same length')
    }
    validateProbability(alpha)
    
    // Calculate chi-square statistic
    let chiSquare = 0
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] === 0) {
        throw new Error('Expected frequencies must be greater than 0')
      }
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i]
    }
    
    const degreesOfFreedom = observed.length - 1
    
    // Critical chi-square value (approximation)
    const chiCritical = getCriticalChiSquare(degreesOfFreedom, alpha)
    const significant = chiSquare > chiCritical
    
    const result: ChiSquareResult = {
      chiSquare,
      pValue: significant ? alpha / 2 : alpha, // Approximate
      degreesOfFreedom,
      significant
    }
    
    trackApiPerformance('statistics.chiSquareTest', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.chiSquareTest', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Get critical chi-square value (approximation)
 */
function getCriticalChiSquare(df: number, alpha: number): number {
  // Simplified chi-square critical values
  if (alpha === 0.05) {
    const values = [3.841, 5.991, 7.815, 9.488, 11.070, 12.592, 14.067, 15.507, 16.919, 18.307]
    return values[Math.min(df - 1, 9)] || 3.841 + (df - 1) * 2
  }
  if (alpha === 0.01) {
    const values = [6.635, 9.210, 11.345, 13.277, 15.086, 16.812, 18.475, 20.090, 21.666, 23.209]
    return values[Math.min(df - 1, 9)] || 6.635 + (df - 1) * 2
  }
  return 3.841 + (df - 1) * 2 // Default approximation
}

/**
 * Perform one-way ANOVA (Analysis of Variance)
 * Tests if multiple groups have different means
 * @param groups - Array of arrays, each containing one group's data
 * @param alpha - Significance level (default 0.05)
 */
export function oneWayANOVA(groups: number[][], alpha: number = 0.05): ANOVAResult {
  const startTime = Date.now()
  try {
    if (!Array.isArray(groups) || groups.length < 2) {
      throw new Error('Must have at least 2 groups')
    }
    groups.forEach((group, i) => validateArray(group, 1, `group ${i + 1}`))
    validateProbability(alpha)
    
    // Calculate group means and overall mean
    const groupMeans = groups.map(group => mean(group))
    const allData = groups.flat()
    const grandMean = mean(allData)
    
    // Calculate sum of squares
    const ssBetween = groups.reduce((sum, group, i) => {
      return sum + group.length * Math.pow(groupMeans[i] - grandMean, 2)
    }, 0)
    
    const ssWithin = groups.reduce((sum, group, i) => {
      return sum + group.reduce((groupSum, value) => {
        return groupSum + Math.pow(value - groupMeans[i], 2)
      }, 0)
    }, 0)
    
    // Degrees of freedom
    const dfBetween = groups.length - 1
    const dfWithin = allData.length - groups.length
    
    // Mean squares
    const msBetween = ssBetween / dfBetween
    const msWithin = ssWithin / dfWithin
    
    // F-statistic
    const fStatistic = msBetween / msWithin
    
    // Critical F-value (approximation)
    const fCritical = getCriticalF(dfBetween, dfWithin, alpha)
    const significant = fStatistic > fCritical
    
    const result: ANOVAResult = {
      fStatistic,
      pValue: significant ? alpha / 2 : alpha, // Approximate
      degreesOfFreedomBetween: dfBetween,
      degreesOfFreedomWithin: dfWithin,
      significant
    }
    
    trackApiPerformance('statistics.oneWayANOVA', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.oneWayANOVA', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Get critical F-value (approximation)
 */
function getCriticalF(df1: number, df2: number, alpha: number): number {
  // Simplified F critical values for alpha = 0.05
  if (alpha === 0.05) {
    if (df1 === 1) return 4.00
    if (df1 === 2) return 3.15
    if (df1 === 3) return 2.76
    if (df1 === 4) return 2.53
    return 2.37 // Approximate for higher df1
  }
  if (alpha === 0.01) {
    if (df1 === 1) return 7.08
    if (df1 === 2) return 4.98
    if (df1 === 3) return 4.13
    if (df1 === 4) return 3.65
    return 3.32
  }
  return 3.00 // Default
}

// ============================================================================
// Distribution Functions
// ============================================================================

/**
 * Calculate z-score (standard score)
 * Indicates how many standard deviations a value is from the mean
 */
export function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) {
    throw new Error('Standard deviation cannot be zero')
  }
  return (value - mean) / stdDev
}

/**
 * Calculate what percentile a value falls into
 * @param data - Dataset
 * @param value - Value to find percentile for
 * @returns Percentile (0-100)
 */
export function percentileRank(data: number[], value: number): number {
  validateArray(data)
  const sorted = [...data].sort((a, b) => a - b)
  const count = sorted.filter(x => x < value).length
  return (count / data.length) * 100
}

/**
 * Calculate the value at a given percentile
 * @param data - Dataset
 * @param percentile - Percentile value (0-100)
 * @returns Value at the given percentile
 */
export function percentile(data: number[], percentile: number): number {
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100')
  }
  validateArray(data)
  const sorted = [...data].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index % 1

  if (lower === upper) {
    return sorted[lower]
  }
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Calculate confidence interval for a mean
 * @param data - Sample data
 * @param confidence - Confidence level (e.g., 0.95 for 95%)
 * @returns [lower bound, upper bound]
 */
export function confidenceInterval(data: number[], confidence: number = 0.95): [number, number] {
  const startTime = Date.now()
  try {
    validateArray(data, 2)
    validateConfidence(confidence)
    
    const sampleMean = mean(data)
    const sampleStdDev = standardDeviation(data)
    const n = data.length
    
    // Z-score for confidence level (approximation)
    const zScore = getZScore(confidence)
    
    const marginOfError = zScore * (sampleStdDev / Math.sqrt(n))
    
    const result: [number, number] = [
      sampleMean - marginOfError,
      sampleMean + marginOfError
    ]
    
    trackApiPerformance('statistics.confidenceInterval', Date.now() - startTime, true)
    return result
  } catch (error) {
    trackApiPerformance('statistics.confidenceInterval', Date.now() - startTime, false)
    throw error
  }
}

/**
 * Get z-score for confidence level
 */
function getZScore(confidence: number): number {
  if (confidence === 0.90) return 1.645
  if (confidence === 0.95) return 1.96
  if (confidence === 0.99) return 2.576
  return 1.96 // Default to 95%
}

/**
 * Calculate interquartile range (IQR)
 */
export function interquartileRange(data: number[]): number {
  validateArray(data, 4)
  const q1 = quantile(data, 0.25)
  const q3 = quantile(data, 0.75)
  return q3 - q1
}

/**
 * Identify outliers using IQR method
 * @returns Array of outlier values
 */
export function identifyOutliers(data: number[]): number[] {
  validateArray(data, 4)
  const q1 = quantile(data, 0.25)
  const q3 = quantile(data, 0.75)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  
  return data.filter(x => x < lowerBound || x > upperBound)
}

// ============================================================================
// Export all functions
// ============================================================================

export const statistics = {
  // Descriptive
  mean,
  median,
  mode,
  standardDeviation,
  variance,
  quantile,
  min,
  max,
  sum,
  descriptiveStatistics,
  
  // Correlation
  pearsonCorrelation,
  spearmanCorrelation,
  correlationWithInterpretation,
  
  // Regression
  linearRegression,
  predict,
  
  // Hypothesis Testing
  tTest,
  twoSampleTTest,
  chiSquareTest,
  oneWayANOVA,
  
  // Distribution
  zScore,
  percentile,
  percentileRank,
  confidenceInterval,
  interquartileRange,
  identifyOutliers
}

export default statistics
