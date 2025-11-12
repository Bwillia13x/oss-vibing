# Tasks and Assignments

This folder contains task definitions with due dates, status, and artifact links.

Each task includes:
- Task description and requirements
- Due date and priority
- Status (todo, in-progress, done)
- Links to related artifacts (docs, sheets, notes)
- Completion metadata

## Example Structure

```json
{
  "id": "essay-climate-change",
  "title": "Research Essay on Climate Change",
  "description": "Write a 10-page research paper on climate change impacts",
  "course": "ENV-101",
  "dueAt": "2025-12-01T23:59:59.000Z",
  "priority": "high",
  "status": "in-progress",
  "artifacts": {
    "outline": "docs/climate-change-outline.mdx",
    "draft": "docs/climate-change-draft.mdx",
    "references": ["references/smith2024.json", "references/jones2023.json"]
  },
  "checklist": [
    {"item": "Create outline", "done": true},
    {"item": "Find 10 sources", "done": true},
    {"item": "Write first draft", "done": false},
    {"item": "Run integrity check", "done": false},
    {"item": "Submit final version", "done": false}
  ],
  "created": "2025-11-01T10:00:00.000Z",
  "updated": "2025-11-12T02:23:55.806Z"
}
```

Tasks integrate with the semester planner and calendar system.
