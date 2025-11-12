# Verify Citations Tool

Verifies the quality and integrity of citations in a document.

This tool performs comprehensive citation verification:
- **Coverage Analysis**: Calculates what percentage of claims have citations
- **Quote Verification**: Checks if quotes match their cited sources
- **Stale Detection**: Identifies citations that may be outdated or broken
- **Fabrication Detection**: Flags potentially fabricated or unverifiable citations

## Usage

The tool analyzes a document and returns a detailed integrity report including:
- Citation coverage percentage
- List of uncited claims (potential plagiarism risk)
- Quote-to-source mismatches
- Recommended actions to improve citation quality

## Examples

```
verify_citations({
  documentPath: "docs/research-paper.json",
  checkSources: true,
  verifyQuotes: true
})
```

Returns a comprehensive integrity report with actionable recommendations.
