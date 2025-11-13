/**
 * Statistical Reports Generator
 * 
 * Formats statistical analysis results into various output formats
 * Supports JSON, Markdown, and HTML output with interpretation guidance
 */

import {
  CorrelationResult,
  descriptiveStatistics,
  correlationWithInterpretation,
  linearRegression,
  twoSampleTTest,
  chiSquareTest,
  oneWayANOVA
} from './core'

// ============================================================================
// Type Definitions
// ============================================================================

export type ReportFormat = 'json' | 'markdown' | 'html'

export interface StatisticalReport {
  title: string
  timestamp: string
  sections: ReportSection[]
  summary: string
}

export interface ReportSection {
  heading: string
  content: string
  data?: any
  interpretation?: string
}

// ============================================================================
// Descriptive Statistics Report
// ============================================================================

/**
 * Generate a comprehensive descriptive statistics report
 */
export function generateDescriptiveReport(
  data: number[],
  datasetName: string = 'Dataset',
  format: ReportFormat = 'markdown'
): string {
  const stats = descriptiveStatistics(data)
  
  if (format === 'json') {
    return JSON.stringify({
      datasetName,
      statistics: stats,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
  
  if (format === 'markdown') {
    return `# Descriptive Statistics Report: ${datasetName}

**Generated:** ${new Date().toLocaleString()}  
**Sample Size:** ${stats.count}

## Summary Statistics

| Statistic | Value |
|-----------|-------|
| Mean | ${stats.mean.toFixed(4)} |
| Median | ${stats.median.toFixed(4)} |
| Mode | ${Array.isArray(stats.mode) ? stats.mode.join(', ') : stats.mode.toFixed(4)} |
| Standard Deviation | ${stats.standardDeviation.toFixed(4)} |
| Variance | ${stats.variance.toFixed(4)} |
| Minimum | ${stats.min.toFixed(4)} |
| Maximum | ${stats.max.toFixed(4)} |
| Range | ${stats.range.toFixed(4)} |
| Sum | ${stats.sum.toFixed(4)} |

## Interpretation

- The data has a **mean** of ${stats.mean.toFixed(2)}, indicating the central tendency.
- The **standard deviation** of ${stats.standardDeviation.toFixed(2)} shows the spread of the data.
- The **range** from ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)} spans ${stats.range.toFixed(2)} units.
${stats.mean === stats.median ? 
  '- The mean and median are equal, suggesting a symmetric distribution.' :
  `- The mean (${stats.mean.toFixed(2)}) and median (${stats.median.toFixed(2)}) differ, suggesting skewness.`}
`
  }
  
  // HTML format
  return `<!DOCTYPE html>
<html>
<head>
  <title>Descriptive Statistics: ${datasetName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .interpretation { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; }
  </style>
</head>
<body>
  <h1>Descriptive Statistics Report: ${datasetName}</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Sample Size:</strong> ${stats.count}</p>
  
  <h2>Summary Statistics</h2>
  <table>
    <tr><th>Statistic</th><th>Value</th></tr>
    <tr><td>Mean</td><td>${stats.mean.toFixed(4)}</td></tr>
    <tr><td>Median</td><td>${stats.median.toFixed(4)}</td></tr>
    <tr><td>Mode</td><td>${Array.isArray(stats.mode) ? stats.mode.join(', ') : stats.mode.toFixed(4)}</td></tr>
    <tr><td>Standard Deviation</td><td>${stats.standardDeviation.toFixed(4)}</td></tr>
    <tr><td>Variance</td><td>${stats.variance.toFixed(4)}</td></tr>
    <tr><td>Minimum</td><td>${stats.min.toFixed(4)}</td></tr>
    <tr><td>Maximum</td><td>${stats.max.toFixed(4)}</td></tr>
    <tr><td>Range</td><td>${stats.range.toFixed(4)}</td></tr>
    <tr><td>Sum</td><td>${stats.sum.toFixed(4)}</td></tr>
  </table>
  
  <div class="interpretation">
    <h3>Interpretation</h3>
    <ul>
      <li>The data has a mean of ${stats.mean.toFixed(2)}, indicating the central tendency.</li>
      <li>The standard deviation of ${stats.standardDeviation.toFixed(2)} shows the spread of the data.</li>
      <li>The range from ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)} spans ${stats.range.toFixed(2)} units.</li>
    </ul>
  </div>
</body>
</html>`
}

// ============================================================================
// Correlation Report
// ============================================================================

/**
 * Generate a correlation analysis report
 */
export function generateCorrelationReport(
  x: number[],
  y: number[],
  xName: string = 'Variable X',
  yName: string = 'Variable Y',
  method: 'pearson' | 'spearman' = 'pearson',
  format: ReportFormat = 'markdown'
): string {
  const result = correlationWithInterpretation(x, y, method)
  
  if (format === 'json') {
    return JSON.stringify({
      xName,
      yName,
      method,
      result,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
  
  const methodName = method === 'pearson' ? 'Pearson' : 'Spearman Rank'
  
  if (format === 'markdown') {
    return `# Correlation Analysis Report

**Generated:** ${new Date().toLocaleString()}  
**Method:** ${methodName} Correlation  
**Variables:** ${xName} vs ${yName}

## Results

| Metric | Value |
|--------|-------|
| Correlation Coefficient | ${result.coefficient.toFixed(4)} |
| Strength | ${result.strength} |
| Direction | ${result.direction} |

## Interpretation

The ${methodName} correlation coefficient of **${result.coefficient.toFixed(4)}** indicates a **${result.strength} ${result.direction}** relationship between ${xName} and ${yName}.

${getCorrelationInterpretation(result)}
`
  }
  
  // HTML format
  return `<!DOCTYPE html>
<html>
<head>
  <title>Correlation Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .interpretation { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2196F3; }
  </style>
</head>
<body>
  <h1>Correlation Analysis Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Method:</strong> ${methodName} Correlation</p>
  <p><strong>Variables:</strong> ${xName} vs ${yName}</p>
  
  <h2>Results</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Correlation Coefficient</td><td>${result.coefficient.toFixed(4)}</td></tr>
    <tr><td>Strength</td><td>${result.strength}</td></tr>
    <tr><td>Direction</td><td>${result.direction}</td></tr>
  </table>
  
  <div class="interpretation">
    <h3>Interpretation</h3>
    <p>The ${methodName} correlation coefficient of <strong>${result.coefficient.toFixed(4)}</strong> indicates a <strong>${result.strength} ${result.direction}</strong> relationship between ${xName} and ${yName}.</p>
    <p>${getCorrelationInterpretation(result)}</p>
  </div>
</body>
</html>`
}

function getCorrelationInterpretation(result: CorrelationResult): string {
  if (result.direction === 'none') {
    return 'There is essentially no linear relationship between the variables.'
  }
  
  let interpretation = `As one variable increases, the other tends to ${result.direction === 'positive' ? 'increase' : 'decrease'} as well. `
  
  if (result.strength === 'very weak' || result.strength === 'weak') {
    interpretation += 'However, this relationship is weak and may not be reliable for predictions.'
  } else if (result.strength === 'moderate') {
    interpretation += 'This moderate relationship suggests some predictive power, but other factors also influence the relationship.'
  } else {
    interpretation += 'This strong relationship suggests that one variable can be a good predictor of the other.'
  }
  
  return interpretation
}

// ============================================================================
// Regression Report
// ============================================================================

/**
 * Generate a linear regression analysis report
 */
export function generateRegressionReport(
  data: [number, number][],
  xName: string = 'X',
  yName: string = 'Y',
  format: ReportFormat = 'markdown'
): string {
  const result = linearRegression(data)
  
  if (format === 'json') {
    return JSON.stringify({
      xName,
      yName,
      regression: result,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
  
  if (format === 'markdown') {
    return `# Linear Regression Report

**Generated:** ${new Date().toLocaleString()}  
**Variables:** ${yName} = f(${xName})  
**Sample Size:** ${data.length}

## Regression Equation

\`\`\`
${result.equation}
\`\`\`

## Model Parameters

| Parameter | Value |
|-----------|-------|
| Slope (m) | ${result.slope.toFixed(4)} |
| Intercept (b) | ${result.intercept.toFixed(4)} |
| R² | ${result.rSquared.toFixed(4)} |

## Interpretation

- **Slope:** For each unit increase in ${xName}, ${yName} ${result.slope > 0 ? 'increases' : 'decreases'} by ${Math.abs(result.slope).toFixed(4)} units.
- **Intercept:** When ${xName} is 0, ${yName} is predicted to be ${result.intercept.toFixed(4)}.
- **R²:** ${(result.rSquared * 100).toFixed(2)}% of the variance in ${yName} is explained by ${xName}.

${getRegressionQuality(result.rSquared)}
`
  }
  
  // HTML format
  return `<!DOCTYPE html>
<html>
<head>
  <title>Linear Regression Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .equation { background-color: #f5f5f5; padding: 10px; font-family: monospace; }
    .interpretation { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF9800; }
  </style>
</head>
<body>
  <h1>Linear Regression Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Variables:</strong> ${yName} = f(${xName})</p>
  <p><strong>Sample Size:</strong> ${data.length}</p>
  
  <h2>Regression Equation</h2>
  <div class="equation">${result.equation}</div>
  
  <h2>Model Parameters</h2>
  <table>
    <tr><th>Parameter</th><th>Value</th></tr>
    <tr><td>Slope (m)</td><td>${result.slope.toFixed(4)}</td></tr>
    <tr><td>Intercept (b)</td><td>${result.intercept.toFixed(4)}</td></tr>
    <tr><td>R²</td><td>${result.rSquared.toFixed(4)}</td></tr>
  </table>
  
  <div class="interpretation">
    <h3>Interpretation</h3>
    <ul>
      <li><strong>Slope:</strong> For each unit increase in ${xName}, ${yName} ${result.slope > 0 ? 'increases' : 'decreases'} by ${Math.abs(result.slope).toFixed(4)} units.</li>
      <li><strong>Intercept:</strong> When ${xName} is 0, ${yName} is predicted to be ${result.intercept.toFixed(4)}.</li>
      <li><strong>R²:</strong> ${(result.rSquared * 100).toFixed(2)}% of the variance in ${yName} is explained by ${xName}.</li>
    </ul>
    <p>${getRegressionQuality(result.rSquared)}</p>
  </div>
</body>
</html>`
}

function getRegressionQuality(rSquared: number): string {
  if (rSquared >= 0.9) {
    return 'The model has an excellent fit to the data.'
  } else if (rSquared >= 0.7) {
    return 'The model has a good fit to the data.'
  } else if (rSquared >= 0.5) {
    return 'The model has a moderate fit to the data.'
  } else if (rSquared >= 0.3) {
    return 'The model has a weak fit to the data. Other variables may be important.'
  } else {
    return 'The model has a poor fit to the data. This linear model may not be appropriate.'
  }
}

// ============================================================================
// Hypothesis Test Report
// ============================================================================

/**
 * Generate a t-test report
 */
export function generateTTestReport(
  sample1: number[],
  sample2: number[],
  sample1Name: string = 'Group 1',
  sample2Name: string = 'Group 2',
  alpha: number = 0.05,
  format: ReportFormat = 'markdown'
): string {
  const result = twoSampleTTest(sample1, sample2, alpha)
  
  if (format === 'json') {
    return JSON.stringify({
      sample1Name,
      sample2Name,
      alpha,
      result,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
  
  if (format === 'markdown') {
    return `# Two-Sample T-Test Report

**Generated:** ${new Date().toLocaleString()}  
**Groups:** ${sample1Name} vs ${sample2Name}  
**Significance Level (α):** ${alpha}

## Results

| Statistic | Value |
|-----------|-------|
| T-Statistic | ${result.tStatistic.toFixed(4)} |
| Degrees of Freedom | ${result.degreesOfFreedom} |
| P-Value | ${result.pValue.toFixed(4)} |
| Significant? | ${result.significant ? '✓ Yes' : '✗ No'} |
| Confidence Level | ${(result.confidenceLevel * 100).toFixed(0)}% |

## Interpretation

${result.significant ?
  `The test result is **statistically significant** at the ${(alpha * 100).toFixed(0)}% level (p < ${alpha}). This suggests that there is a meaningful difference between the means of ${sample1Name} and ${sample2Name}.` :
  `The test result is **not statistically significant** at the ${(alpha * 100).toFixed(0)}% level (p ≥ ${alpha}). This suggests that we cannot conclude there is a meaningful difference between the means of ${sample1Name} and ${sample2Name}.`}

**Note:** Statistical significance does not necessarily imply practical significance. Consider the effect size and context of your research.
`
  }
  
  // HTML format
  return `<!DOCTYPE html>
<html>
<head>
  <title>Two-Sample T-Test</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .interpretation { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #9C27B0; }
    .significant { color: #4CAF50; font-weight: bold; }
    .not-significant { color: #F44336; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Two-Sample T-Test Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Groups:</strong> ${sample1Name} vs ${sample2Name}</p>
  <p><strong>Significance Level (α):</strong> ${alpha}</p>
  
  <h2>Results</h2>
  <table>
    <tr><th>Statistic</th><th>Value</th></tr>
    <tr><td>T-Statistic</td><td>${result.tStatistic.toFixed(4)}</td></tr>
    <tr><td>Degrees of Freedom</td><td>${result.degreesOfFreedom}</td></tr>
    <tr><td>P-Value</td><td>${result.pValue.toFixed(4)}</td></tr>
    <tr><td>Significant?</td><td class="${result.significant ? 'significant' : 'not-significant'}">${result.significant ? '✓ Yes' : '✗ No'}</td></tr>
    <tr><td>Confidence Level</td><td>${(result.confidenceLevel * 100).toFixed(0)}%</td></tr>
  </table>
  
  <div class="interpretation">
    <h3>Interpretation</h3>
    <p>${result.significant ?
      `The test result is <strong>statistically significant</strong> at the ${(alpha * 100).toFixed(0)}% level (p < ${alpha}). This suggests that there is a meaningful difference between the means of ${sample1Name} and ${sample2Name}.` :
      `The test result is <strong>not statistically significant</strong> at the ${(alpha * 100).toFixed(0)}% level (p ≥ ${alpha}). This suggests that we cannot conclude there is a meaningful difference between the means of ${sample1Name} and ${sample2Name}.`}</p>
    <p><em>Note: Statistical significance does not necessarily imply practical significance. Consider the effect size and context of your research.</em></p>
  </div>
</body>
</html>`
}

// ============================================================================
// Chi-Square Test Report
// ============================================================================

/**
 * Generate a chi-square test report
 */
export function generateChiSquareReport(
  observed: number[],
  expected: number[],
  categories: string[],
  testName: string = 'Chi-Square Goodness of Fit Test',
  alpha: number = 0.05,
  format: ReportFormat = 'markdown'
): string {
  const result = chiSquareTest(observed, expected, alpha)
  
  if (format === 'json') {
    return JSON.stringify({
      testName,
      observed,
      expected,
      categories,
      alpha,
      result,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
  
  if (format === 'markdown') {
    let dataTable = '| Category | Observed | Expected |\n|----------|----------|----------|\n'
    for (let i = 0; i < observed.length; i++) {
      dataTable += `| ${categories[i] || `Category ${i + 1}`} | ${observed[i]} | ${expected[i]} |\n`
    }
    
    return `# ${testName} Report

**Generated:** ${new Date().toLocaleString()}  
**Significance Level (α):** ${alpha}

## Data

${dataTable}

## Results

| Statistic | Value |
|-----------|-------|
| χ² Statistic | ${result.chiSquare.toFixed(4)} |
| Degrees of Freedom | ${result.degreesOfFreedom} |
| P-Value | ${result.pValue.toFixed(4)} |
| Significant? | ${result.significant ? '✓ Yes' : '✗ No'} |

## Interpretation

${result.significant ?
  `The test result is **statistically significant** (p < ${alpha}). This suggests that the observed frequencies differ significantly from the expected frequencies. The data does not follow the expected distribution.` :
  `The test result is **not statistically significant** (p ≥ ${alpha}). This suggests that the observed frequencies do not differ significantly from the expected frequencies. The data is consistent with the expected distribution.`}
`
  }
  
  // HTML format
  return `<!DOCTYPE html>
<html>
<head>
  <title>${testName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .interpretation { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #9C27B0; }
  </style>
</head>
<body>
  <h1>${testName} Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Significance Level (α):</strong> ${alpha}</p>
  
  <h2>Data</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Observed</th>
        <th>Expected</th>
      </tr>
    </thead>
    <tbody>
      ${categories.map((cat, i) => `<tr>
        <td>${cat || `Category ${i + 1}`}</td>
        <td>${observed[i]}</td>
        <td>${expected[i]}</td>
      </tr>`).join('\n      ')}
    </tbody>
  </table>
  
  <h2>Results</h2>
  <table>
    <tr><th>Statistic</th><th>Value</th></tr>
    <tr><td>χ² Statistic</td><td>${result.chiSquare.toFixed(4)}</td></tr>
    <tr><td>Degrees of Freedom</td><td>${result.degreesOfFreedom}</td></tr>
    <tr><td>P-Value</td><td>${result.pValue.toFixed(4)}</td></tr>
    <tr><td>Significant?</td><td>${result.significant ? '✓ Yes' : '✗ No'}</td></tr>
  </table>
  
  <div class="interpretation">
    <h3>Interpretation</h3>
    <p>${result.significant ?
      `The test result is <strong>statistically significant</strong> (p &lt; ${alpha}). This suggests that the observed frequencies differ significantly from the expected frequencies. The data does not follow the expected distribution.` :
      `The test result is <strong>not statistically significant</strong> (p ≥ ${alpha}). This suggests that the observed frequencies do not differ significantly from the expected frequencies. The data is consistent with the expected distribution.`}</p>
  </div>
</body>
</html>`
}

// ============================================================================
// ANOVA Report
// ============================================================================

/**
 * Generate an ANOVA report
 */
export function generateANOVAReport(
  groups: number[][],
  groupNames: string[],
  alpha: number = 0.05,
  format: ReportFormat = 'markdown'
): string {
  const result = oneWayANOVA(groups, alpha)
  
  if (format === 'json') {
    return JSON.stringify({
      groupNames,
      alpha,
      result,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
  
  if (format === 'markdown') {
    return `# One-Way ANOVA Report

**Generated:** ${new Date().toLocaleString()}  
**Number of Groups:** ${groups.length}  
**Significance Level (α):** ${alpha}

## Groups

${groups.map((group, i) => `- **${groupNames[i] || `Group ${i + 1}`}:** n = ${group.length}`).join('\n')}

## Results

| Statistic | Value |
|-----------|-------|
| F-Statistic | ${result.fStatistic.toFixed(4)} |
| Degrees of Freedom (Between) | ${result.degreesOfFreedomBetween} |
| Degrees of Freedom (Within) | ${result.degreesOfFreedomWithin} |
| P-Value | ${result.pValue.toFixed(4)} |
| Significant? | ${result.significant ? '✓ Yes' : '✗ No'} |

## Interpretation

${result.significant ?
  `The ANOVA result is **statistically significant** (p < ${alpha}). This indicates that at least one group mean differs significantly from the others. Post-hoc tests are recommended to identify which specific groups differ.` :
  `The ANOVA result is **not statistically significant** (p ≥ ${alpha}). This suggests that there are no significant differences among the group means.`}

**Note:** ANOVA assumes normality and homogeneity of variance. Verify these assumptions before interpreting results.
`
  }
  
  // HTML format
  return `<!DOCTYPE html>
<html>
<head>
  <title>One-Way ANOVA Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .interpretation { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #9C27B0; }
  </style>
</head>
<body>
  <h1>One-Way ANOVA Report</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Number of Groups:</strong> ${groups.length}</p>
  <p><strong>Significance Level (α):</strong> ${alpha}</p>
  
  <h2>Groups</h2>
  <ul>
    ${groups.map((group, i) => `<li><strong>${groupNames[i] || `Group ${i + 1}`}</strong> (n = ${group.length})</li>`).join('\n    ')}
  </ul>
  
  <h2>Results</h2>
  <table>
    <thead>
      <tr>
        <th>Statistic</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>F-Statistic</td>
        <td>${result.fStatistic.toFixed(4)}</td>
      </tr>
      <tr>
        <td>Degrees of Freedom (Between)</td>
        <td>${result.degreesOfFreedomBetween}</td>
      </tr>
      <tr>
        <td>Degrees of Freedom (Within)</td>
        <td>${result.degreesOfFreedomWithin}</td>
      </tr>
      <tr>
        <td>P-Value</td>
        <td>${result.pValue.toFixed(4)}</td>
      </tr>
      <tr>
        <td>Significant?</td>
        <td>${result.significant ? '&#10003; Yes' : '&#10007; No'}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="interpretation">
    <h3>Interpretation</h3>
    <p>${result.significant ?
      `The ANOVA result is <strong>statistically significant</strong> (p &lt; ${alpha}). This indicates that at least one group mean differs significantly from the others. Post-hoc tests are recommended to identify which specific groups differ.` :
      `The ANOVA result is <strong>not statistically significant</strong> (p ≥ ${alpha}). This suggests that there are no significant differences among the group means.`}</p>
    <p><strong>Note:</strong> ANOVA assumes normality and homogeneity of variance. Verify these assumptions before interpreting results.</p>
  </div>
</body>
</html>`
}

// ============================================================================
// Export Functions
// ============================================================================

export const reports = {
  generateDescriptiveReport,
  generateCorrelationReport,
  generateRegressionReport,
  generateTTestReport,
  generateChiSquareReport,
  generateANOVAReport
}

export default reports
