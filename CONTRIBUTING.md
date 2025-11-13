# Contributing to Vibe University

Thank you for your interest in contributing to Vibe University! We're building the premier academic workflow platform for students worldwide, and we welcome contributions from developers, designers, educators, and students.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@vibeuniversity.com.

### Our Standards

**Positive behaviors:**
- ✅ Being respectful and inclusive
- ✅ Welcoming diverse perspectives
- ✅ Accepting constructive criticism gracefully
- ✅ Focusing on what's best for the community
- ✅ Showing empathy toward others

**Unacceptable behaviors:**
- ❌ Harassment, discrimination, or intimidation
- ❌ Trolling, insulting comments, or personal attacks
- ❌ Publishing others' private information
- ❌ Spam or off-topic content
- ❌ Other unprofessional conduct

---

## How Can I Contribute?

### Reporting Bugs

Found a bug? Please check if it's already reported in [GitHub Issues](https://github.com/Bwillia13x/oss-vibing/issues).

**To report a new bug:**

1. Go to [Issues](https://github.com/Bwillia13x/oss-vibing/issues/new)
2. Choose "Bug Report" template
3. Fill in all required fields:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Environment (browser, OS, version)
4. Add relevant labels (bug, help wanted, good first issue, etc.)

**Good bug report example:**
```
Title: PDF export fails for documents with tables

Steps to reproduce:
1. Create a new document
2. Insert a table with 5 rows and 3 columns
3. Click Export → PDF
4. Observe error message

Expected: PDF downloads successfully
Actual: Error "Failed to generate PDF"

Environment:
- Browser: Chrome 118.0.5993.70
- OS: macOS 13.5
- Account: Free tier

Screenshot: [attached]
```

### Suggesting Features

Have an idea for a new feature? We'd love to hear it!

1. Check [existing feature requests](https://github.com/Bwillia13x/oss-vibing/labels/enhancement)
2. If not already suggested, [open a new issue](https://github.com/Bwillia13x/oss-vibing/issues/new)
3. Use "Feature Request" template
4. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions considered
   - How this helps students/researchers

**Good feature request example:**
```
Title: Add support for Harvard citation style

Problem:
Business and economics students need Harvard citation style, which
is not currently supported.

Proposed solution:
Add Harvard style to the citation formatter using the CSL (Citation
Style Language) Harvard definition.

Alternatives:
- Allow custom CSL file upload
- Manually format citations (not scalable)

Impact:
- Helps business/economics students (~20% of user base)
- Harvard is the 5th most popular citation style
- Requested by 3+ universities
```

### Contributing Code

We welcome code contributions! Here's how:

#### Good First Issues

New to the project? Look for issues labeled [`good first issue`](https://github.com/Bwillia13x/oss-vibing/labels/good%20first%20issue). These are:
- Well-defined and scoped
- Good for learning the codebase
- Have mentorship available
- Typically take 1-4 hours

#### Areas to Contribute

**Frontend:**
- React components (TypeScript, Tailwind CSS)
- UI/UX improvements
- Accessibility enhancements
- Performance optimizations
- Mobile responsiveness

**Backend:**
- API endpoints (Next.js API routes)
- Database queries (when DB is implemented)
- External API integrations
- Caching and optimization

**Features:**
- Citation formatters
- Export generators
- Statistical analysis
- AI tool integrations
- PDF processing

**Testing:**
- Unit tests (Vitest)
- Integration tests
- E2E tests (Playwright)
- Performance tests

**Documentation:**
- User guides
- API documentation
- Code comments
- Video tutorials

### Contributing Documentation

Documentation is just as important as code!

**Types of documentation:**
- User guides and tutorials
- API reference documentation
- Architecture diagrams
- Code comments
- README improvements

**To contribute documentation:**
1. Fork the repository
2. Edit or create Markdown files in `/docs`
3. Follow the [documentation style guide](#documentation-style)
4. Submit a pull request

---

## Development Setup

### Prerequisites

- **Node.js:** 20.x or higher
- **npm:** 10.x or higher
- **Git:** Latest version
- **Code editor:** VS Code recommended

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/Bwillia13x/oss-vibing.git
cd oss-vibing

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at http://localhost:3000

### Environment Variables

Create `.env.local` with:

```bash
# Required for AI features
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Optional monitoring (for testing error tracking)
SENTRY_DSN=your_sentry_dsn_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Optional academic APIs (for testing citations)
SEMANTIC_SCHOLAR_API_KEY=your_key_here
UNPAYWALL_EMAIL=your_email@example.com
```

**Note:** Free API keys are available for development:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Semantic Scholar: https://www.semanticscholar.org/product/api

### Project Structure

```
oss-vibing/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   └── ...               # Feature components
├── lib/                   # Core libraries
│   ├── api/              # API clients
│   ├── citations/        # Citation management
│   ├── export/           # Export generators
│   ├── monitoring/       # Error tracking & analytics
│   ├── statistics/       # Statistical analysis
│   └── ...               # Other utilities
├── ai/                    # AI tool definitions
│   └── tools/            # Individual tool configs
├── docs/                  # Documentation
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # E2E tests
├── public/                # Static assets
└── ...                    # Config files
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
npm run e2e              # Run E2E tests
npm run e2e:ui           # Run E2E tests with UI

# Code Quality
npm run lint             # Lint code (coming soon)
npm run format           # Format code (coming soon)
npm run type-check       # Check TypeScript types
```

### Development Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make changes:**
   - Write code following our [coding standards](#coding-standards)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test locally:**
   ```bash
   npm run build          # Ensure builds successfully
   npm run test           # Run tests
   npm run e2e            # Run E2E tests (if applicable)
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add Harvard citation style"
   # See commit message guidelines below
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Then create PR on GitHub
   ```

---

## Pull Request Process

### Before Submitting

✅ **Checklist:**
- [ ] Code follows our coding standards
- [ ] All tests pass (`npm run test`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete

### Creating a Pull Request

1. **Fill out the PR template** (appears automatically)
2. **Link related issues** using keywords:
   - `Fixes #123` - Closes issue when PR is merged
   - `Relates to #456` - References issue without closing
3. **Add labels:**
   - `bug` - Bug fixes
   - `enhancement` - New features
   - `documentation` - Documentation changes
   - `dependencies` - Dependency updates
   - `breaking change` - Breaking changes
4. **Request review** from maintainers
5. **Be responsive** to feedback

### PR Title Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

Examples:
feat(citations): add Harvard citation style
fix(export): resolve PDF table rendering issue
docs(api): add endpoint documentation
test(citations): add unit tests for APA formatting
refactor(ui): simplify export dialog
perf(api): optimize citation lookup
chore(deps): update dependencies
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `chore` - Maintenance tasks
- `ci` - CI/CD changes

**Scopes:**
- `citations` - Citation management
- `export` - Export system
- `statistics` - Statistical analysis
- `api` - API changes
- `ui` - UI components
- `monitoring` - Error tracking/analytics
- `ai` - AI tools

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update

## Testing
How has this been tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed my code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
- [ ] Build succeeds

## Screenshots (if applicable)
Add screenshots for UI changes

## Additional Notes
Any additional information
```

### Review Process

1. **Automated checks** run automatically (build, tests, linting)
2. **Code review** by at least one maintainer
3. **Changes requested** if needed - address feedback and update PR
4. **Approval** - PR is approved when all checks pass
5. **Merge** - Maintainer merges the PR
6. **Celebrate** 🎉 - Your contribution is now part of Vibe University!

**Review timeline:**
- Most PRs reviewed within 48 hours
- Simple fixes: <24 hours
- Large features: up to 7 days

---

## Coding Standards

### TypeScript

**We use TypeScript for type safety and better developer experience.**

```typescript
// ✅ Good: Explicit types
interface CitationOptions {
  style: 'apa' | 'mla' | 'chicago';
  includeURL: boolean;
  year: number;
}

function formatCitation(data: CitationData, options: CitationOptions): string {
  // ...
}

// ❌ Bad: Implicit any
function formatCitation(data, options) {
  // ...
}
```

**Type guidelines:**
- Always define interfaces for complex objects
- Avoid `any` type unless absolutely necessary
- Use union types for limited options
- Export types that are used across files
- Use generics for reusable components

### React Components

**Functional components with TypeScript:**

```typescript
// ✅ Good: Typed props, clear interface
interface ExportButtonProps {
  format: 'pdf' | 'docx' | 'pptx';
  onExport: (filename: string) => Promise<void>;
  disabled?: boolean;
}

export function ExportButton({ format, onExport, disabled = false }: ExportButtonProps) {
  const handleClick = async () => {
    await onExport(`document.${format}`);
  };

  return (
    <button onClick={handleClick} disabled={disabled}>
      Export {format.toUpperCase()}
    </button>
  );
}

// ❌ Bad: No types, unclear props
export function ExportButton(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

**Component guidelines:**
- One component per file (except small helpers)
- Use descriptive, PascalCase names
- Extract complex logic into custom hooks
- Use `memo()` for expensive renders
- Keep components small and focused

### Styling

**We use Tailwind CSS for styling:**

```tsx
// ✅ Good: Tailwind utility classes
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <p className="text-sm text-gray-600">Description</p>
</div>

// ❌ Bad: Inline styles
<div style={{ display: 'flex', padding: '16px', background: 'white' }}>
  <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Title</h2>
</div>
```

**Styling guidelines:**
- Use Tailwind utilities first
- Extract repeated patterns into components
- Use shadcn/ui components for complex UI
- Maintain responsive design (mobile-first)
- Follow color scheme (theme-aware)

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `ExportButton.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-citation.ts`)
- Tests: `*.test.ts` or `*.spec.ts`
- Types: `types.ts` or inline with component

**Variables:**
- Constants: `UPPER_SNAKE_CASE`
- Variables: `camelCase`
- React components: `PascalCase`
- Private functions: `_camelCase` (prefix with underscore)

**Functions:**
- Use descriptive verb names: `fetchData`, `calculateTotal`, `handleClick`
- Async functions: prefixed with verb (e.g., `fetchCitations`, not `getCitations`)
- Event handlers: `handle` prefix (e.g., `handleSubmit`, `handleClick`)
- Boolean returns: `is`, `has`, `should` prefix (e.g., `isValid`, `hasError`)

### Code Organization

**File structure:**
```typescript
// 1. Imports (external, then internal)
import React from 'react';
import { formatDate } from 'date-fns';

import { Button } from '@/components/ui/button';
import { formatCitation } from '@/lib/citations';

// 2. Types and interfaces
interface ComponentProps {
  // ...
}

// 3. Constants
const MAX_ITEMS = 100;

// 4. Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // 4a. Hooks
  const [state, setState] = useState();
  const ref = useRef();

  // 4b. Derived state
  const computed = useMemo(() => calculate(state), [state]);

  // 4c. Effects
  useEffect(() => {
    // ...
  }, []);

  // 4d. Event handlers
  const handleClick = () => {
    // ...
  };

  // 4e. Render
  return (
    // ...
  );
}

// 5. Helper functions (after component)
function helperFunction() {
  // ...
}
```

### Comments and Documentation

**JSDoc comments for all exported functions:**

```typescript
/**
 * Format a citation according to the specified style.
 * 
 * @param data - Citation data including author, title, year
 * @param style - Citation style (APA, MLA, Chicago)
 * @returns Formatted citation string
 * 
 * @example
 * ```typescript
 * const citation = formatCitation(
 *   { author: 'Smith', title: 'Paper', year: 2023 },
 *   'apa'
 * );
 * // Returns: "Smith (2023). Paper."
 * ```
 */
export function formatCitation(data: CitationData, style: CitationStyle): string {
  // Implementation...
}
```

**Inline comments for complex logic:**

```typescript
// Calculate citation coverage percentage
// Coverage = (cited sentences / total sentences) * 100
const coverage = (citedSentences / totalSentences) * 100;
```

**Comment guidelines:**
- Explain WHY, not WHAT
- Keep comments up-to-date with code
- Use TODO comments for known issues
- Don't comment obvious code

---

## Testing Requirements

### Test Coverage

**Minimum coverage requirements:**
- Core functions: 90%+
- API endpoints: 80%+
- UI components: 70%+
- Overall: 80%+

### Unit Tests

**Every new function should have unit tests:**

```typescript
// lib/citations/formatter.test.ts
import { describe, it, expect } from 'vitest';
import { formatCitation } from './formatter';

describe('formatCitation', () => {
  it('formats APA citation correctly', () => {
    const data = {
      authors: [{ given: 'John', family: 'Smith' }],
      title: 'Test Paper',
      year: 2023,
    };

    const result = formatCitation(data, 'apa');
    
    expect(result).toBe('Smith, J. (2023). Test paper.');
  });

  it('handles multiple authors', () => {
    // Test with 2 authors
    // Test with 3+ authors (et al.)
  });

  it('throws error for missing required fields', () => {
    expect(() => formatCitation({}, 'apa')).toThrow();
  });
});
```

### Integration Tests

**Test API endpoints:**

```typescript
// tests/api/citations.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/citations/route';

describe('POST /api/citations', () => {
  it('returns citation for valid DOI', async () => {
    const request = new Request('http://localhost/api/citations', {
      method: 'POST',
      body: JSON.stringify({ doi: '10.1000/xyz' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('citation');
    expect(data.citation).toContain('2023');
  });

  it('returns 400 for invalid DOI', async () => {
    const request = new Request('http://localhost/api/citations', {
      method: 'POST',
      body: JSON.stringify({ doi: 'invalid' }),
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });
});
```

### E2E Tests

**Test critical user flows:**

```typescript
// tests/e2e/export.spec.ts
import { test, expect } from '@playwright/test';

test('user can export document to PDF', async ({ page }) => {
  // Navigate to app
  await page.goto('/');

  // Create a document
  await page.click('text=New Document');
  await page.fill('[placeholder="Document title"]', 'Test Document');
  await page.fill('[contenteditable]', 'This is test content.');

  // Export to PDF
  await page.click('button:has-text("Export")');
  await page.click('text=PDF');

  // Wait for download
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('.pdf');
});
```

### Running Tests

```bash
# Unit tests
npm run test                  # Run all tests
npm run test:ui               # Run with UI
npm run test:coverage         # Generate coverage

# E2E tests
npm run e2e                   # Run all E2E tests
npm run e2e:ui                # Run with UI
npm run e2e:headed            # Run in headed mode

# Watch mode (for development)
npm run test:watch            # Re-run tests on changes
```

---

## Documentation

### Code Documentation

**JSDoc for all exported functions:**
- Clear description
- Parameter types and descriptions
- Return value description
- Usage examples
- See links to related functions

**README files for major features:**
- Create `README.md` in feature directories
- Explain purpose and architecture
- Include usage examples
- Document API if applicable

### User Documentation

**When adding user-facing features:**
- Update [USER-GUIDE.md](./docs/USER-GUIDE.md)
- Add to [FAQ.md](./docs/FAQ.md) if needed
- Create video tutorial (for major features)
- Update in-app help text

### API Documentation

**For new API endpoints:**
- Document in [API.md](./docs/API.md)
- Include request/response examples
- Document all parameters
- List possible error codes
- Add authentication requirements

---

## Community

### Communication Channels

**GitHub:**
- [Issues](https://github.com/Bwillia13x/oss-vibing/issues) - Bug reports and feature requests
- [Discussions](https://github.com/Bwillia13x/oss-vibing/discussions) - Q&A and general discussion
- [Pull Requests](https://github.com/Bwillia13x/oss-vibing/pulls) - Code contributions

**Other channels:**
- Discord: [Join our server](https://discord.gg/vibeuniversity)
- Forum: [community.vibeuniversity.com](https://community.vibeuniversity.com)
- Twitter: [@vibeuniversity](https://twitter.com/vibeuniversity)

### Getting Help

**For contributors:**
- Ask questions in [GitHub Discussions](https://github.com/Bwillia13x/oss-vibing/discussions)
- Tag issues with `help wanted` or `question`
- Join our Discord for real-time help
- Email: opensource@vibeuniversity.com

**For maintainers:**
- Review PRs promptly (target: <48 hours)
- Be welcoming and helpful
- Provide constructive feedback
- Recognize and celebrate contributions

### Recognition

**Contributors are recognized in:**
- [CONTRIBUTORS.md](./CONTRIBUTORS.md) (automatically updated)
- Release notes
- Social media shoutouts
- Annual contributor spotlight

**Top contributors receive:**
- Free premium subscription
- Exclusive contributor badge
- Early access to new features
- Invitations to contributor events

---

## Questions?

**Need help contributing?**
- 📧 Email: opensource@vibeuniversity.com
- 💬 Discord: [Join server](https://discord.gg/vibeuniversity)
- 🐙 GitHub: [Discussions](https://github.com/Bwillia13x/oss-vibing/discussions)

**Thank you for contributing to Vibe University!** 🎉

---

*Last updated: November 13, 2025*  
*Version: 5.7.1*
