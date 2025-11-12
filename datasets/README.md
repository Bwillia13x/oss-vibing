# Datasets

This folder contains datasets in CSV or JSON format with full provenance tracking.

Each dataset includes:
- Raw data in tabular format
- Source URL or DOI
- Snapshot timestamp for reproducibility
- License and usage terms
- Data dictionary/schema

## Example Structure

For CSV:
```csv
# Dataset: Economic Indicators
# Source: https://data.gov/dataset/economics
# Fetched: 2025-11-12T02:23:55.806Z
# License: Public Domain
Year,GDP,Inflation,Unemployment
2020,20.9,1.2,8.1
2021,23.0,4.7,5.4
...
```

For JSON:
```json
{
  "name": "Economic Indicators",
  "provenance": {
    "sourceURL": "https://data.gov/dataset/economics",
    "fetchedAt": "2025-11-12T02:23:55.806Z",
    "license": "Public Domain",
    "snapshotHash": "abc123"
  },
  "schema": {
    "Year": "integer",
    "GDP": "float",
    "Inflation": "float",
    "Unemployment": "float"
  },
  "data": [...]
}
```

Datasets are version-controlled via snapshot hashes to ensure reproducible analysis.
