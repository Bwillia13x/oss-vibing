#!/usr/bin/env node

/**
 * Phase 5.2 Statistical Analysis Tests
 * 
 * Tests core statistical functions for accuracy and correctness
 */

import {
  mean,
  median,
  mode,
  standardDeviation,
  variance,
  pearsonCorrelation,
  spearmanCorrelation,
  linearRegression,
  twoSampleTTest,
  chiSquareTest,
  oneWayANOVA,
  zScore,
  confidenceInterval,
  identifyOutliers,
  descriptiveStatistics
} from '../lib/statistics/core.ts'

console.log('🧪 Phase 5.2: Statistical Analysis Tests\n')

let passedTests = 0
let failedTests = 0

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`)
    passedTests++
  } else {
    console.log(`✗ ${message}`)
    failedTests++
  }
}

function assertApprox(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected)
  if (diff <= tolerance) {
    console.log(`✓ ${message} (${actual.toFixed(4)} ≈ ${expected.toFixed(4)})`)
    passedTests++
  } else {
    console.log(`✗ ${message} (${actual.toFixed(4)} vs ${expected.toFixed(4)}, diff: ${diff.toFixed(4)})`)
    failedTests++
  }
}

// =============================================================================
// Test 1: Descriptive Statistics
// =============================================================================

console.log('\n📊 Test 1: Descriptive Statistics')
console.log('=' .repeat(50))

const dataset1 = [2, 4, 4, 4, 5, 5, 7, 9]

try {
  const meanVal = mean(dataset1)
  assertApprox(meanVal, 5, 0.01, 'Mean calculation')
  
  const medianVal = median(dataset1)
  assertApprox(medianVal, 4.5, 0.01, 'Median calculation')
  
  const modeVal = mode(dataset1)
  assert(modeVal === 4, 'Mode calculation')
  
  const stdVal = standardDeviation(dataset1)
  assertApprox(stdVal, 2.138, 0.01, 'Standard deviation calculation')
  
  const varVal = variance(dataset1)
  assertApprox(varVal, 4.571, 0.01, 'Variance calculation')
  
  const stats = descriptiveStatistics(dataset1)
  assert(stats.min === 2 && stats.max === 9, 'Min and max values')
  assert(stats.count === 8, 'Count of elements')
  assertApprox(stats.range, 7, 0.01, 'Range calculation')
  
} catch (error) {
  console.log(`✗ Descriptive statistics test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 2: Correlation Analysis
// =============================================================================

console.log('\n🔗 Test 2: Correlation Analysis')
console.log('=' .repeat(50))

const x = [1, 2, 3, 4, 5]
const y = [2, 4, 6, 8, 10]

try {
  const pearson = pearsonCorrelation(x, y)
  assertApprox(pearson, 1.0, 0.01, 'Perfect positive correlation')
  
  const yNegative = [10, 8, 6, 4, 2]
  const pearsonNeg = pearsonCorrelation(x, yNegative)
  assertApprox(pearsonNeg, -1.0, 0.01, 'Perfect negative correlation')
  
  const yRandom = [2, 5, 4, 7, 6]
  const spearman = spearmanCorrelation(x, yRandom)
  assert(spearman >= -1 && spearman <= 1, 'Spearman correlation in valid range')
  
} catch (error) {
  console.log(`✗ Correlation analysis test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 3: Linear Regression
// =============================================================================

console.log('\n📈 Test 3: Linear Regression')
console.log('=' .repeat(50))

const regressionData = [
  [1, 2],
  [2, 4],
  [3, 6],
  [4, 8],
  [5, 10]
]

try {
  const regression = linearRegression(regressionData)
  assertApprox(regression.slope, 2.0, 0.01, 'Regression slope')
  assertApprox(regression.intercept, 0.0, 0.01, 'Regression intercept')
  assertApprox(regression.rSquared, 1.0, 0.01, 'R-squared value')
  
  assert(regression.equation.includes('y ='), 'Equation format')
  
} catch (error) {
  console.log(`✗ Linear regression test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 4: Hypothesis Testing
// =============================================================================

console.log('\n🔬 Test 4: Hypothesis Testing')
console.log('=' .repeat(50))

const group1 = [5, 6, 7, 8, 9]
const group2 = [3, 4, 5, 6, 7]

try {
  const tTest = twoSampleTTest(group1, group2, 0.05)
  assert(typeof tTest.tStatistic === 'number', 't-statistic calculated')
  assert(typeof tTest.pValue === 'number', 'p-value calculated')
  assert(tTest.degreesOfFreedom === 8, 'Degrees of freedom correct')
  
  const observed = [10, 20, 30]
  const expected = [15, 20, 25]
  const chiSquare = chiSquareTest(observed, expected, 0.05)
  assert(typeof chiSquare.chiSquare === 'number', 'Chi-square statistic calculated')
  assert(chiSquare.degreesOfFreedom === 2, 'Chi-square degrees of freedom')
  
  const groups = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
  const anova = oneWayANOVA(groups, 0.05)
  assert(typeof anova.fStatistic === 'number', 'F-statistic calculated')
  assert(anova.degreesOfFreedomBetween === 2, 'ANOVA df between groups')
  assert(anova.degreesOfFreedomWithin === 6, 'ANOVA df within groups')
  
} catch (error) {
  console.log(`✗ Hypothesis testing failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 5: Distribution Functions
// =============================================================================

console.log('\n📊 Test 5: Distribution Functions')
console.log('=' .repeat(50))

const data = [10, 12, 23, 23, 16, 23, 21, 16]

try {
  const z = zScore(23, mean(data), standardDeviation(data))
  assert(typeof z === 'number' && isFinite(z), 'Z-score calculation')
  
  const ci = confidenceInterval(data, 0.95)
  assert(Array.isArray(ci) && ci.length === 2, 'Confidence interval format')
  assert(ci[0] < mean(data) && ci[1] > mean(data), 'Confidence interval contains mean')
  
  const dataWithOutliers = [10, 12, 13, 14, 15, 100]
  const outliers = identifyOutliers(dataWithOutliers)
  assert(outliers.includes(100), 'Outlier detection')
  
} catch (error) {
  console.log(`✗ Distribution functions test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 6: Input Validation
// =============================================================================

console.log('\n🛡️ Test 6: Input Validation')
console.log('=' .repeat(50))

try {
  let errorCaught = false
  try {
    mean([])
  } catch (_e) {
    errorCaught = true
  }
  assert(errorCaught, 'Empty array validation')
  
  errorCaught = false
  try {
    mean(['not', 'numbers'])
  } catch (_e) {
    errorCaught = true
  }
  assert(errorCaught, 'Non-numeric array validation')
  
  errorCaught = false
  try {
    standardDeviation([1])
  } catch (_e) {
    errorCaught = true
  }
  assert(errorCaught, 'Insufficient data for std dev')
  
  errorCaught = false
  try {
    pearsonCorrelation([1, 2], [1, 2, 3])
  } catch (_e) {
    errorCaught = true
  }
  assert(errorCaught, 'Mismatched array lengths')
  
} catch (error) {
  console.log(`✗ Input validation test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 7: Edge Cases
// =============================================================================

console.log('\n⚠️ Test 7: Edge Cases')
console.log('=' .repeat(50))

try {
  const singleValue = [5]
  const m = mean(singleValue)
  assert(m === 5, 'Mean of single value')
  
  const twoValues = [3, 7]
  const med = median(twoValues)
  assert(med === 5, 'Median of two values')
  
  const allSame = [5, 5, 5, 5]
  const std = standardDeviation(allSame)
  assertApprox(std, 0, 0.01, 'Standard deviation of identical values')
  
  const perfectCor = pearsonCorrelation([1, 2, 3], [1, 2, 3])
  assertApprox(perfectCor, 1.0, 0.01, 'Perfect self-correlation')
  
} catch (error) {
  console.log(`✗ Edge cases test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test Summary
// =============================================================================

console.log('\n' + '='.repeat(50))
console.log('📋 Test Summary')
console.log('='.repeat(50))
console.log(`✓ Passed: ${passedTests}`)
console.log(`✗ Failed: ${failedTests}`)
console.log(`📊 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`)

if (failedTests === 0) {
  console.log('\n🎉 All tests passed!')
  process.exit(0)
} else {
  console.log('\n⚠️ Some tests failed')
  process.exit(1)
}
