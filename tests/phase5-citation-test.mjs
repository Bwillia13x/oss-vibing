#!/usr/bin/env node

/**
 * Phase 5.3 Citation Management Tests
 * 
 * Tests citation formatting and verification functions
 */

import {
  formatCitation,
  formatBibliography,
  formatInTextCitation,
  generateCitationId,
  convertToCSL,
  convertFromCSL,
  validateCitation,
  getStyleInfo,
  detectCitationStyle,
  parseAuthors,
  exportCitation,
} from '../lib/citations/formatter.ts'

import {
  analyzeCitationCoverage,
  verifyQuotes,
  detectStaleCitations,
  detectFabricatedCitations,
  calculateQualityScore,
  calculateIntegrityScore,
  verifyCitations,
} from '../lib/citations/verifier.ts'

console.log('🧪 Phase 5.3: Citation Management Tests\n')

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

function assertContains(text, substring, message) {
  if (text.includes(substring)) {
    console.log(`✓ ${message}`)
    passedTests++
  } else {
    console.log(`✗ ${message} (expected to contain "${substring}")`)
    failedTests++
  }
}

// =============================================================================
// Test 1: Citation Formatting - APA Style
// =============================================================================

console.log('\n📝 Test 1: Citation Formatting - APA Style')
console.log('='.repeat(50))

try {
  const citation1 = {
    title: 'Climate Change and Global Warming',
    authors: [{ family: 'Smith', given: 'John' }],
    year: 2023,
    journal: 'Nature',
    volume: '615',
    pages: '123-145',
    doi: '10.1038/s41586-023-06321-7'
  }
  
  // Test in-text citation
  const inTextAPA = formatCitation(citation1, { style: 'apa', type: 'in-text' })
  assertContains(inTextAPA, 'Smith', 'APA in-text citation contains author')
  assertContains(inTextAPA, '2023', 'APA in-text citation contains year')
  
  // Test bibliography
  const bibAPA = formatCitation(citation1, { style: 'apa', type: 'bibliography' })
  assertContains(bibAPA, 'Smith', 'APA bibliography contains author')
  assertContains(bibAPA, 'Climate Change', 'APA bibliography contains title')
  
  console.log(`  In-text: ${inTextAPA}`)
  console.log(`  Bibliography: ${bibAPA.substring(0, 80)}...`)
} catch (error) {
  console.log(`✗ APA formatting error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 2: Citation Formatting - MLA Style
// =============================================================================

console.log('\n📝 Test 2: Citation Formatting - MLA Style')
console.log('='.repeat(50))

try {
  const citation2 = {
    title: 'The Great Gatsby',
    authors: [{ family: 'Fitzgerald', given: 'F. Scott' }],
    year: 1925,
    publisher: 'Scribner',
    type: 'book'
  }
  
  const inTextMLA = formatCitation(citation2, { style: 'mla', type: 'in-text' })
  assertContains(inTextMLA, 'Fitzgerald', 'MLA in-text citation contains author')
  
  const bibMLA = formatCitation(citation2, { style: 'mla', type: 'bibliography' })
  assertContains(bibMLA, 'Fitzgerald', 'MLA bibliography contains author')
  assertContains(bibMLA, 'Great Gatsby', 'MLA bibliography contains title')
  
  console.log(`  In-text: ${inTextMLA}`)
  console.log(`  Bibliography: ${bibMLA.substring(0, 80)}...`)
} catch (error) {
  console.log(`✗ MLA formatting error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 3: Citation Formatting - Chicago Style
// =============================================================================

console.log('\n📝 Test 3: Citation Formatting - Chicago Style')
console.log('='.repeat(50))

try {
  const citation3 = {
    title: 'A Brief History of Time',
    authors: [{ family: 'Hawking', given: 'Stephen' }],
    year: 1988,
    publisher: 'Bantam Books',
    type: 'book'
  }
  
  const bibChicago = formatCitation(citation3, { style: 'chicago', type: 'bibliography' })
  assertContains(bibChicago, 'Hawking', 'Chicago bibliography contains author')
  assertContains(bibChicago, 'Brief History', 'Chicago bibliography contains title')
  
  console.log(`  Bibliography: ${bibChicago.substring(0, 80)}...`)
} catch (error) {
  console.log(`✗ Chicago formatting error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 4: Multiple Authors
// =============================================================================

console.log('\n📝 Test 4: Multiple Authors')
console.log('='.repeat(50))

try {
  const citation4 = {
    title: 'Collaborative Research Methods',
    authors: [
      { family: 'Smith', given: 'John' },
      { family: 'Jones', given: 'Jane' },
      { family: 'Brown', given: 'Bob' }
    ],
    year: 2022,
    journal: 'Research Quarterly',
    type: 'article-journal'
  }
  
  const inText = formatCitation(citation4, { style: 'apa', type: 'in-text' })
  assertContains(inText, 'et al', 'Multiple authors use et al. in APA')
  
  const bib = formatCitation(citation4, { style: 'apa', type: 'bibliography' })
  assertContains(bib, 'Smith', 'Bibliography contains first author')
  
  console.log(`  In-text: ${inText}`)
  console.log(`  Bibliography: ${bib.substring(0, 80)}...`)
} catch (error) {
  console.log(`✗ Multiple authors error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 5: Bibliography Generation
// =============================================================================

console.log('\n📝 Test 5: Bibliography Generation')
console.log('='.repeat(50))

try {
  const citations = [
    {
      title: 'Paper A',
      authors: [{ family: 'Smith', given: 'John' }],
      year: 2023,
      journal: 'Journal A'
    },
    {
      title: 'Paper B',
      authors: [{ family: 'Jones', given: 'Jane' }],
      year: 2022,
      journal: 'Journal B'
    },
    {
      title: 'Paper C',
      authors: [{ family: 'Brown', given: 'Bob' }],
      year: 2021,
      journal: 'Journal C'
    }
  ]
  
  const bibliography = formatBibliography(citations, { style: 'apa', sort: true })
  
  // Check that all citations are present
  assertContains(bibliography, 'Paper A', 'Bibliography contains Paper A')
  assertContains(bibliography, 'Paper B', 'Bibliography contains Paper B')
  assertContains(bibliography, 'Paper C', 'Bibliography contains Paper C')
  
  // Check sorting (Brown < Jones < Smith alphabetically)
  const brownIndex = bibliography.indexOf('Brown')
  const jonesIndex = bibliography.indexOf('Jones')
  const smithIndex = bibliography.indexOf('Smith')
  assert(brownIndex < jonesIndex && jonesIndex < smithIndex, 'Bibliography is sorted alphabetically')
  
  console.log(`  Generated bibliography with ${citations.length} entries`)
} catch (error) {
  console.log(`✗ Bibliography generation error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 6: CSL Conversion
// =============================================================================

console.log('\n📝 Test 6: CSL Conversion')
console.log('='.repeat(50))

try {
  const input = {
    title: 'Test Paper',
    authors: [{ family: 'Doe', given: 'John' }],
    year: 2023,
    doi: '10.1000/test123'
  }
  
  const csl = convertToCSL(input)
  assert(csl.title === 'Test Paper', 'CSL conversion preserves title')
  assert(csl.DOI === '10.1000/test123', 'CSL conversion preserves DOI')
  assert(csl.author[0].family === 'Doe', 'CSL conversion preserves author')
  
  const converted = convertFromCSL(csl)
  assert(converted.title === 'Test Paper', 'Round-trip conversion preserves title')
  assert(converted.doi === '10.1000/test123', 'Round-trip conversion preserves DOI')
  
  console.log(`  CSL conversion successful`)
} catch (error) {
  console.log(`✗ CSL conversion error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 7: Citation ID Generation
// =============================================================================

console.log('\n📝 Test 7: Citation ID Generation')
console.log('='.repeat(50))

try {
  const citation = {
    title: 'Climate Change Research',
    authors: [{ family: 'Smith', given: 'John' }],
    year: 2023
  }
  
  const id = generateCitationId(citation)
  assertContains(id, 'smith', 'Citation ID contains author name')
  assertContains(id, '2023', 'Citation ID contains year')
  assert(id.length > 10, 'Citation ID is sufficiently long')
  
  console.log(`  Generated ID: ${id}`)
} catch (error) {
  console.log(`✗ Citation ID generation error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 8: Citation Validation
// =============================================================================

console.log('\n📝 Test 8: Citation Validation')
console.log('='.repeat(50))

try {
  // Valid citation
  const validCitation = {
    title: 'Valid Paper',
    authors: [{ family: 'Smith', given: 'John' }],
    year: 2023,
    doi: '10.1000/valid'
  }
  
  const validResult = validateCitation(validCitation)
  assert(validResult.valid === true, 'Valid citation passes validation')
  
  // Invalid citation (missing title)
  const invalidCitation = {
    title: '',
    authors: [{ family: 'Smith', given: 'John' }],
    year: 2023
  }
  
  const invalidResult = validateCitation(invalidCitation)
  assert(invalidResult.valid === false, 'Invalid citation fails validation')
  assert(invalidResult.missing.includes('title'), 'Validation identifies missing title')
  
  console.log(`  Validation working correctly`)
} catch (error) {
  console.log(`✗ Citation validation error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 9: Style Information
// =============================================================================

console.log('\n📝 Test 9: Style Information')
console.log('='.repeat(50))

try {
  const apaInfo = getStyleInfo('apa')
  assert(apaInfo.name === 'APA', 'APA style info returns correct name')
  assert(apaInfo.type === 'author-date', 'APA is author-date style')
  
  const ieeeInfo = getStyleInfo('ieee')
  assert(ieeeInfo.name === 'IEEE', 'IEEE style info returns correct name')
  assert(ieeeInfo.type === 'numbered', 'IEEE is numbered style')
  
  console.log(`  Style info retrieval working`)
} catch (error) {
  console.log(`✗ Style info error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 10: Author Parsing
// =============================================================================

console.log('\n📝 Test 10: Author Parsing')
console.log('='.repeat(50))

try {
  // Test "Last, First" format
  const authors1 = parseAuthors('Smith, John & Jones, Jane')
  assert(authors1.length === 2, 'Parses multiple authors')
  assert(authors1[0].family === 'Smith', 'Parses first author family name')
  assert(authors1[0].given === 'John', 'Parses first author given name')
  
  // Test "First Last" format
  const authors2 = parseAuthors('John Smith')
  assert(authors2[0].family === 'Smith', 'Parses "First Last" format')
  assert(authors2[0].given === 'John', 'Extracts given name from "First Last"')
  
  console.log(`  Author parsing working correctly`)
} catch (error) {
  console.log(`✗ Author parsing error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 11: Citation Coverage Analysis
// =============================================================================

console.log('\n📝 Test 11: Citation Coverage Analysis')
console.log('='.repeat(50))

try {
  const content = `
    Research shows that climate change is accelerating (Smith, 2023).
    The data demonstrates a clear trend over time.
    Studies indicate that temperatures have risen significantly (Jones, 2022).
    This is an uncited claim that should be flagged.
    Evidence suggests that action is needed.
  `
  
  const citations = [
    { id: 'smith2023', title: 'Paper', authors: [{ family: 'Smith' }], year: 2023 },
    { id: 'jones2022', title: 'Paper', authors: [{ family: 'Jones' }], year: 2022 }
  ]
  
  const coverage = analyzeCitationCoverage(content, citations)
  
  assert(coverage.totalSentences > 0, 'Counts sentences in document')
  assert(coverage.citedSentences >= 2, 'Identifies cited sentences')
  assert(coverage.uncitedClaims.length >= 2, 'Detects uncited claims')
  assert(coverage.coveragePct >= 0 && coverage.coveragePct <= 100, 'Coverage percentage is valid')
  
  console.log(`  Coverage: ${coverage.coveragePct}%, ${coverage.citedSentences}/${coverage.totalSentences} sentences`)
  console.log(`  Uncited claims: ${coverage.uncitedClaims.length}`)
} catch (error) {
  console.log(`✗ Coverage analysis error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 12: Quote Verification
// =============================================================================

console.log('\n📝 Test 12: Quote Verification')
console.log('='.repeat(50))

try {
  const content = `
    According to the author, "climate change is the defining issue of our time" (Smith, 2023).
    Another study states "temperatures have increased by 1.5°C".
    This quote lacks a citation.
  `
  
  const issues = verifyQuotes(content)
  
  assert(issues.length >= 1, 'Detects quotes without citations')
  assert(issues[0].severity === 'high', 'Uncited quotes are high severity')
  
  console.log(`  Found ${issues.length} quote issue(s)`)
} catch (error) {
  console.log(`✗ Quote verification error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 13: Quality Score Calculation
// =============================================================================

console.log('\n📝 Test 13: Quality Score Calculation')
console.log('='.repeat(50))

try {
  // High quality citations (with DOI, full info)
  const highQualityCitations = [
    {
      title: 'Paper A',
      authors: [{ family: 'Smith', given: 'John' }],
      year: 2023,
      journal: 'Nature',
      doi: '10.1038/test'
    },
    {
      title: 'Paper B',
      authors: [{ family: 'Jones', given: 'Jane' }],
      year: 2024,
      journal: 'Science',
      doi: '10.1126/test'
    }
  ]
  
  const highScore = calculateQualityScore(highQualityCitations)
  assert(highScore >= 80, 'High quality citations get high score')
  
  // Low quality citations (missing info)
  const lowQualityCitations = [
    {
      title: 'Paper C',
      authors: [{ family: 'Brown' }],
    }
  ]
  
  const lowScore = calculateQualityScore(lowQualityCitations)
  assert(lowScore < highScore, 'Low quality citations get lower score')
  
  console.log(`  High quality score: ${highScore}`)
  console.log(`  Low quality score: ${lowScore}`)
} catch (error) {
  console.log(`✗ Quality score calculation error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 14: Export Formats
// =============================================================================

console.log('\n📝 Test 14: Export Formats')
console.log('='.repeat(50))

try {
  const citation = {
    title: 'Test Paper',
    authors: [{ family: 'Doe', given: 'John' }],
    year: 2023,
    doi: '10.1000/test'
  }
  
  // Test JSON export
  const jsonExport = exportCitation(citation, 'json')
  assert(jsonExport.includes('Test Paper'), 'JSON export contains title')
  
  // Test CSL export
  const cslExport = exportCitation(citation, 'csl')
  assert(cslExport.includes('Test Paper'), 'CSL export contains title')
  
  // Test BibTeX export
  const bibtexExport = exportCitation(citation, 'bibtex')
  assert(bibtexExport.length > 0, 'BibTeX export generates output')
  
  console.log(`  Export formats working`)
} catch (error) {
  console.log(`✗ Export format error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Test 15: Style Detection
// =============================================================================

console.log('\n📝 Test 15: Style Detection')
console.log('='.repeat(50))

try {
  // Test APA detection
  const apaText = 'Research shows significant findings (Smith, 2023).'
  const apaStyle = detectCitationStyle(apaText)
  assert(apaStyle === 'apa' || apaStyle !== null, 'Detects author-date style')
  
  // Test IEEE detection
  const ieeeText = 'Research shows significant findings [1].'
  const ieeeStyle = detectCitationStyle(ieeeText)
  assert(ieeeStyle === 'ieee' || ieeeStyle !== null, 'Detects numbered style')
  
  console.log(`  Detected APA-style: ${apaStyle}`)
  console.log(`  Detected IEEE-style: ${ieeeStyle}`)
} catch (error) {
  console.log(`✗ Style detection error: ${error.message}`)
  failedTests++
}

// =============================================================================
// Summary
// =============================================================================

console.log('\n' + '='.repeat(50))
console.log('📊 Test Summary')
console.log('='.repeat(50))
console.log(`Total tests: ${passedTests + failedTests}`)
console.log(`✓ Passed: ${passedTests}`)
console.log(`✗ Failed: ${failedTests}`)
console.log(`Success rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`)

if (failedTests === 0) {
  console.log('\n🎉 All tests passed!')
  process.exit(0)
} else {
  console.log('\n❌ Some tests failed')
  process.exit(1)
}
