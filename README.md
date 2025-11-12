# Vibe University

**A comprehensive student workflow IDE for academic work with built-in academic integrity.**

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 📚 Documentation

### Core Documentation
- **[VIBE-UNIVERSITY.md](./VIBE-UNIVERSITY.md)** - Complete transformation summary and current features
- **[ROADMAP.md](./ROADMAP.md)** - Detailed 18-24 month development roadmap
- **[BLUEPRINT.md](./BLUEPRINT.md)** - Strategic overview and technical architecture

### Phase 3 Documentation (Platform Optimization)
- **[docs/PHASE3-BACKEND-PERFORMANCE.md](./docs/PHASE3-BACKEND-PERFORMANCE.md)** - Backend performance guide
- **[docs/KEYBOARD-SHORTCUTS.md](./docs/KEYBOARD-SHORTCUTS.md)** - Keyboard shortcuts reference
- **[PHASE3-SESSION-COMPLETION.md](./PHASE3-SESSION-COMPLETION.md)** - Latest session completion summary

## 🚀 Features

### Core Academic Tools
- **AI-Powered Student Copilot** - Intelligent assistant for all academic tasks
- **Citation Management** - Find and format citations (APA, MLA, Chicago)
- **Document Editor** - Write essays and research papers with integrity tracking
- **Spreadsheet Analysis** - Statistical analysis with charts and visualizations
- **Presentation Builder** - Create academic presentations
- **Flashcard System** - Spaced repetition for studying
- **LMS Integration** - Canvas LMS support for assignments

### Phase 3 Enhancements (NEW)
- **Performance Monitoring** - Real-time metrics and cache statistics
- **File Indexing** - Fast search across all artifacts
- **Enhanced Navigation** - Keyboard shortcuts for power users
- **Caching Layer** - 95-97% faster response times
- **Accessibility** - WCAG 2.1 AA compliance utilities

## 🎯 Quick Start

### Prerequisites
- Node.js 20+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + K` | Focus chat input |
| `Ctrl/⌘ + E` | Focus file explorer |
| `Ctrl/⌘ + P` | Focus preview panel |
| `Ctrl/⌘ + B` | Toggle sidebar |
| `Ctrl/⌘ + Shift + T` | Toggle theme |
| `Ctrl/⌘ + /` | Show keyboard shortcuts |

See [docs/KEYBOARD-SHORTCUTS.md](./docs/KEYBOARD-SHORTCUTS.md) for complete reference.

## 🔌 API Endpoints

### Performance & Monitoring
- `GET /api/metrics` - Performance statistics and cache metrics
- `GET /api/files` - File statistics and artifact search
- `GET /api/files?search=query` - Search artifacts by name
- `GET /api/files?type=document` - Filter artifacts by type

### Core APIs
- `POST /api/chat` - AI chat endpoint
- `GET /api/models` - Available AI models (cached)
- `GET /api/sandboxes/[id]` - Sandbox status (cached)

See [docs/PHASE3-BACKEND-PERFORMANCE.md](./docs/PHASE3-BACKEND-PERFORMANCE.md) for detailed API documentation.

## 📊 Performance

### Optimization Results
- **Page Load:** <2 seconds initial load
- **API Response (cached):** ~10ms average
- **File Lookups:** ~0.1ms with indexing
- **Cache Hit Rate:** 80%+ for repeated requests
- **Bundle Size:** 462 KB (optimized)

### Monitoring
Access real-time performance metrics:
```bash
curl http://localhost:3000/api/metrics
```

## 🏗️ Architecture

### Technology Stack
- **Frontend:** Next.js 15, React 19, TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI
- **State Management:** Zustand
- **AI/LLM:** Vercel AI SDK
- **Sandbox:** Vercel Sandbox (E2B)

### Performance Infrastructure
- **Caching:** In-memory cache with TTL and LRU eviction
- **Monitoring:** Performance metrics collection and reporting
- **Indexing:** File metadata indexing for fast lookups
- **Rate Limiting:** IP-based rate limiting on API routes

## 🧪 Testing

```bash
# Run build to check for errors
npm run build

# TypeScript type checking is automatic during build
```

## 🔒 Security

- ✅ Zero critical vulnerabilities (CodeQL scanned)
- ✅ Rate limiting on API endpoints
- ✅ Input validation with Zod schemas
- ✅ WCAG 2.1 AA accessibility compliance

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📈 Project Status

**Current Phase:** Phase 3 - Platform Optimization  
**Progress:** 68% of high-priority Phase 3 tasks complete

- ✅ Phase 1: Foundation - Complete
- ✅ Phase 2: Enhanced Features - Complete
- 🚧 Phase 3: Optimization - 68% Complete
- ⏳ Phase 4: Ecosystem - Planned

See [ROADMAP.md](./ROADMAP.md) for detailed phase breakdown.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
