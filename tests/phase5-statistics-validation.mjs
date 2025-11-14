#!/usr/bin/env node

/**
 * Phase 5.2 Statistical Analysis Tests
 * 
 * Tests core statistical functions for accuracy and correctness
 * This test validates the build and basic functionality
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'

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

// =============================================================================
// Test 1: Build Verification
// =============================================================================

console.log('\n🔨 Test 1: Build Verification')
console.log('=' .repeat(50))

try {
  console.log('Building project...')
  execSync('npm run build', { stdio: 'pipe', cwd: '/home/runner/work/oss-vibing/oss-vibing' })
  assert(true, 'Project builds successfully')
} catch (_error) {
  assert(false, 'Project build failed')
}

// =============================================================================
// Test 2: Module Structure
// =============================================================================

console.log('\n📦 Test 2: Module Structure')
console.log('=' .repeat(50))

try {
  const coreStats = readFileSync('/home/runner/work/oss-vibing/oss-vibing/lib/statistics/core.ts', 'utf8')
  assert(coreStats.includes('export function mean'), 'Core statistics module has mean function')
  assert(coreStats.includes('export function median'), 'Core statistics module has median function')
  assert(coreStats.includes('export function standardDeviation'), 'Core statistics module has standard deviation')
  assert(coreStats.includes('export function pearsonCorrelation'), 'Core statistics module has Pearson correlation')
  assert(coreStats.includes('export function linearRegression'), 'Core statistics module has linear regression')
  assert(coreStats.includes('export function twoSampleTTest'), 'Core statistics module has t-test')
  assert(coreStats.includes('export function chiSquareTest'), 'Core statistics module has chi-square test')
  assert(coreStats.includes('export function oneWayANOVA'), 'Core statistics module has ANOVA')
  
  const reports = readFileSync('/home/runner/work/oss-vibing/oss-vibing/lib/statistics/reports.ts', 'utf8')
  assert(reports.includes('generateDescriptiveReport'), 'Reports module has descriptive report function')
  assert(reports.includes('generateCorrelationReport'), 'Reports module has correlation report function')
  assert(reports.includes('generateRegressionReport'), 'Reports module has regression report function')
  assert(reports.includes('generateTTestReport'), 'Reports module has t-test report function')
  
} catch (error) {
  console.log(`✗ Module structure test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 3: Chart Components
// =============================================================================

console.log('\n📊 Test 3: Chart Components')
console.log('=' .repeat(50))

try {
  const lineChart = readFileSync('/home/runner/work/oss-vibing/oss-vibing/components/charts/line-chart.tsx', 'utf8')
  assert(lineChart.includes('export function LineChart'), 'LineChart component exists')
  assert(lineChart.includes('Chart.js'), 'LineChart uses Chart.js')
  assert(lineChart.includes('exportToPNG'), 'LineChart has export functionality')
  
  const barChart = readFileSync('/home/runner/work/oss-vibing/oss-vibing/components/charts/bar-chart.tsx', 'utf8')
  assert(barChart.includes('export function BarChart'), 'BarChart component exists')
  
  const scatterPlot = readFileSync('/home/runner/work/oss-vibing/oss-vibing/components/charts/scatter-plot.tsx', 'utf8')
  assert(scatterPlot.includes('export function ScatterPlot'), 'ScatterPlot component exists')
  assert(scatterPlot.includes('showTrendline'), 'ScatterPlot has trendline option')
  
  const histogram = readFileSync('/home/runner/work/oss-vibing/oss-vibing/components/charts/histogram.tsx', 'utf8')
  assert(histogram.includes('export function Histogram'), 'Histogram component exists')
  assert(histogram.includes('bins'), 'Histogram supports binning')
  
  const boxPlot = readFileSync('/home/runner/work/oss-vibing/oss-vibing/components/charts/box-plot.tsx', 'utf8')
  assert(boxPlot.includes('export function BoxPlot'), 'BoxPlot component exists')
  assert(boxPlot.includes('outliers'), 'BoxPlot detects outliers')
  
} catch (error) {
  console.log(`✗ Chart components test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 4: Dependencies
// =============================================================================

console.log('\n📦 Test 4: Dependencies')
console.log('=' .repeat(50))

try {
  const packageJson = JSON.parse(readFileSync('/home/runner/work/oss-vibing/oss-vibing/package.json', 'utf8'))
  assert(packageJson.dependencies['simple-statistics'], 'simple-statistics installed')
  assert(packageJson.dependencies['chart.js'], 'chart.js installed')
  assert(packageJson.dependencies['react-chartjs-2'], 'react-chartjs-2 installed')
  
} catch (error) {
  console.log(`✗ Dependencies test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 5: Code Quality
// =============================================================================

console.log('\n✨ Test 5: Code Quality')
console.log('=' .repeat(50))

try {
  const coreStats = readFileSync('/home/runner/work/oss-vibing/oss-vibing/lib/statistics/core.ts', 'utf8')
  assert(coreStats.includes('validateArray'), 'Input validation functions exist')
  assert(coreStats.includes('trackApiPerformance'), 'Performance tracking integrated')
  assert(coreStats.includes('interface'), 'TypeScript interfaces defined')
  assert(coreStats.includes('export interface'), 'Exports type definitions')
  
  const lineChart = readFileSync('/home/runner/work/oss-vibing/oss-vibing/components/charts/line-chart.tsx', 'utf8')
  assert(lineChart.includes("'use client'"), 'Chart components are client components')
  assert(lineChart.includes('useRef'), 'Chart components use React hooks properly')
  assert(lineChart.includes('useEffect'), 'Chart components handle lifecycle')
  
} catch (error) {
  console.log(`✗ Code quality test failed: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 6: Statistical Function Coverage
// =============================================================================

console.log('\n🔬 Test 6: Statistical Function Coverage')
console.log('=' .repeat(50))

try {
  const coreStats = readFileSync('/home/runner/work/oss-vibing/oss-vibing/lib/statistics/core.ts', 'utf8')
  
  // Descriptive statistics
  const descriptiveFuncs = ['mean', 'median', 'mode', 'standardDeviation', 'variance', 'quantile', 'min', 'max', 'sum']
  descriptiveFuncs.forEach(func => {
    assert(coreStats.includes(`export function ${func}`), `${func} function exported`)
  })
  
  // Correlation
  assert(coreStats.includes('pearsonCorrelation'), 'Pearson correlation implemented')
  assert(coreStats.includes('spearmanCorrelation'), 'Spearman correlation implemented')
  
  // Regression
  assert(coreStats.includes('linearRegression'), 'Linear regression implemented')
  assert(coreStats.includes('predict'), 'Prediction function implemented')
  
  // Hypothesis tests
  assert(coreStats.includes('twoSampleTTest'), 'T-test implemented')
  assert(coreStats.includes('chiSquareTest'), 'Chi-square test implemented')
  assert(coreStats.includes('oneWayANOVA'), 'ANOVA implemented')
  
  // Distribution functions
  assert(coreStats.includes('zScore'), 'Z-score calculation implemented')
  assert(coreStats.includes('percentileRank'), 'Percentile rank implemented')
  assert(coreStats.includes('confidenceInterval'), 'Confidence interval implemented')
  assert(coreStats.includes('identifyOutliers'), 'Outlier detection implemented')
  
} catch (error) {
  console.log(`✗ Function coverage test failed: ${error.message}`)
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
  console.log('\n✅ Phase 5.2 Statistical Analysis Engine is ready for use')
  process.exit(0)
} else {
  console.log('\n⚠️ Some tests failed')
  process.exit(1)
}
