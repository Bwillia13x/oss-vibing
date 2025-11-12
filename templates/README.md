# Template Library

This directory contains templates for documents, spreadsheets, and presentations to help students get started quickly with common academic tasks.

## Phase 3.2.2 Implementation

Part of the Phase 3 Platform Optimization work, the template library provides:

- Pre-built templates for common academic needs
- Organized by type (docs, sheets, decks)
- Categorized by discipline and use case
- Accessible via API and UI components

## Directory Structure

```
templates/
├── docs/              # Document templates
│   ├── essay-template.json
│   ├── research-paper-template.json
│   └── lab-report-template.json
├── sheets/            # Spreadsheet templates
│   ├── data-analysis-template.json
│   └── budget-template.json
├── decks/             # Presentation templates
│   ├── research-presentation-template.json
│   └── class-presentation-template.json
└── index.json         # Template index/catalog
```

## Available Templates

### Documents (docs/)

1. **Academic Essay Template** 📝
   - Standard 5-paragraph essay structure
   - Introduction, body paragraphs, conclusion
   - Citation placeholders

2. **Research Paper Template** 📄
   - Comprehensive research paper format
   - Abstract, literature review, methodology
   - Results, discussion, conclusion
   - Reference section

3. **Lab Report Template** 🔬
   - Scientific lab report format
   - Sections: Introduction, materials, procedure
   - Results, discussion, conclusion
   - STEM-focused

4. **Thesis Template** 🎓
   - Graduate thesis/dissertation format
   - 6 comprehensive chapters
   - Abstract through appendices
   - Complete academic structure

5. **Research Proposal Template** 📋
   - Grant/thesis proposal format
   - Executive summary, objectives
   - Methodology, timeline, budget
   - Ethical considerations

6. **Case Study Template** 💼
   - Business case study analysis
   - Problem statement, analysis
   - Recommendations, implementation
   - Social sciences focused

### Spreadsheets (sheets/)

1. **Data Analysis Template** 📊
   - Raw data, descriptive statistics
   - Correlation analysis
   - Hypothesis testing sections

2. **Budget Tracker Template** 💰
   - Monthly budget planner
   - Income and expense tracking
   - Transaction log

3. **Project Timeline Template** 📅
   - Gantt-style project tracker
   - Task scheduling and milestones
   - Status tracking and notes
   - Academic project management

4. **Grade Calculator Template** 🎯
   - Course grade tracking
   - Assignment and exam scores
   - GPA calculation
   - Grade scale reference

### Presentations (decks/)

1. **Research Presentation Template** 🎓
   - Academic research presentation
   - Introduction, methodology, results
   - Discussion, conclusions

2. **Class Presentation Template** 🎯
   - General purpose presentation
   - Flexible structure
   - Professional design

3. **Thesis Defense Presentation Template** 🎓
   - Graduate defense presentation
   - 20 comprehensive slides
   - Full defense structure
   - Committee-ready format

## Usage

### Via API

```typescript
// Get all templates
const response = await fetch('/api/templates')
const templates = await response.json()

// Get templates of specific type
const response = await fetch('/api/templates?type=docs')
const docTemplates = await response.json()

// Get specific template
const response = await fetch('/api/templates?type=docs&id=essay')
const essayTemplate = await response.json()
```

### Via UI Component

```typescript
import { TemplateBrowser } from '@/components/template-browser'

// Use in your component
<TemplateBrowser 
  type="docs"
  onSelect={(template, type) => {
    console.log('Selected template:', template, type)
  }}
/>
```

## Template Format

### Document Templates

```json
{
  "name": "Template Name",
  "description": "Template description",
  "category": "category",
  "discipline": "discipline",
  "content": {
    "title": "Document Title",
    "sections": [
      {
        "type": "heading",
        "level": 1,
        "content": "Section Title"
      },
      {
        "type": "paragraph",
        "content": "Section content..."
      }
    ]
  }
}
```

### Spreadsheet Templates

```json
{
  "name": "Template Name",
  "description": "Template description",
  "category": "category",
  "discipline": "discipline",
  "content": {
    "title": "Spreadsheet Title",
    "sheets": [
      {
        "name": "Sheet Name",
        "rows": [
          ["Header1", "Header2"],
          ["Data1", "Data2"]
        ]
      }
    ]
  }
}
```

### Presentation Templates

```json
{
  "name": "Template Name",
  "description": "Template description",
  "category": "category",
  "discipline": "discipline",
  "content": {
    "title": "Presentation Title",
    "slides": [
      {
        "type": "title",
        "title": "Title Text",
        "subtitle": "Subtitle Text"
      },
      {
        "type": "content",
        "title": "Slide Title",
        "bullets": ["Point 1", "Point 2"]
      }
    ]
  }
}
```

## Adding New Templates

1. Create your template JSON file following the format above
2. Place it in the appropriate directory (docs/, sheets/, or decks/)
3. Add an entry to `index.json`:

```json
{
  "id": "unique-id",
  "name": "Template Name",
  "description": "Brief description",
  "category": "category-key",
  "discipline": "discipline-key",
  "file": "template-filename.json",
  "icon": "📝"
}
```

4. Add category/discipline to index if needed

## Categories

- essay: Essays & Writing
- research: Research Papers
- lab-report: Lab Reports
- case-study: Case Studies
- analysis: Data Analysis
- finance: Finance & Budgeting
- project-management: Project Management
- academic-planning: Academic Planning
- academic: Academic Presentations
- presentation: General Presentations

## Disciplines

- general: General (all fields)
- stem: STEM
- humanities: Humanities
- social-science: Social Sciences
- business: Business

## Future Enhancements

- [ ] User-submitted templates
- [ ] Template ratings and reviews
- [ ] More discipline-specific templates
- [ ] Template customization wizard
- [ ] Template preview before selection
- [ ] Save custom templates
- [ ] Share templates with others
- [ ] Template marketplace

## Roadmap Alignment

This feature implements:
- **Phase 3.2.2**: Smart Suggestions & Templates
  - Build template library ✅
  - Add discipline-specific templates ✅
  - Implement template selection UI ✅

**Status**: ~45% of Phase 3.2.2 complete (expanded library implemented)

**Next Steps**:
- Template preview functionality
- Smart auto-complete
- Writing suggestions based on context
- Citation style auto-detection
- User custom templates
