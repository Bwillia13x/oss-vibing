# References

This folder contains bibliographic references in CSL JSON format.

Each reference includes:
- Full citation metadata
- DOI or URL for verification
- Optional PDF link (for open access materials)
- Fetch timestamp for provenance

## Example Structure

```json
{
  "id": "smith2024",
  "type": "article-journal",
  "title": "Climate Change Impacts on Agriculture",
  "author": [
    {
      "family": "Smith",
      "given": "John"
    }
  ],
  "issued": {
    "date-parts": [[2024]]
  },
  "container-title": "Journal of Environmental Science",
  "DOI": "10.1234/example.2024",
  "URL": "https://doi.org/10.1234/example.2024",
  "provenance": {
    "fetchedAt": "2025-11-12T02:23:55.806Z",
    "source": "Crossref",
    "verified": true
  }
}
```

References are used by the citation system and can be formatted in APA, MLA, or Chicago styles.
