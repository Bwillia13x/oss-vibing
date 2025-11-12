# Spreadsheets

This folder contains spreadsheet data and analysis results in JSON format.

Each sheet includes:
- Table data with named ranges
- Analysis results (statistics, correlations, regressions)
- Chart specifications
- Dataset provenance with snapshot timestamps

## Example Structure

```json
{
  "name": "Lab Data Analysis",
  "created": "2025-11-12T02:23:55.806Z",
  "provenance": {
    "sourceURLs": ["https://data.gov/dataset"],
    "fetchedAt": "2025-11-12T02:23:55.806Z",
    "snapshotHash": "abc123"
  },
  "tables": {
    "raw_data": {
      "range": "A1:D100",
      "data": [[1, 2, 3], ...]
    }
  },
  "analysis": {
    "correlation": {...},
    "regression": {...}
  },
  "charts": [...]
}
```

Sheets can be exported to CSV, Excel, or other formats.
