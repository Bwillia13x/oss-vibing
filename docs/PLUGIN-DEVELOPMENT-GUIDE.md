# Plugin Development Guide

**Vibe University Plugin System - Phase 4.4.1**

Welcome to the Vibe University Plugin Development Guide! This document will help you create powerful extensions for Vibe University.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Plugin Architecture](#plugin-architecture)
4. [Plugin API Reference](#plugin-api-reference)
5. [Example Plugins](#example-plugins)
6. [Best Practices](#best-practices)
7. [Publishing Your Plugin](#publishing-your-plugin)

---

## Overview

The Vibe University Plugin System allows developers to extend the platform with custom functionality. Plugins can:

- Add new citation formats
- Create custom export/import formats
- Integrate with external services
- Add new UI components
- Enhance existing features
- Create custom themes

### Plugin Types

1. **Citation Plugins** - Custom citation formatters and validators
2. **Export Plugins** - New document export formats
3. **Import Plugins** - Support for additional file types
4. **Analysis Plugins** - Custom data analysis tools
5. **Formatting Plugins** - Text and document formatting utilities
6. **Theme Plugins** - Custom UI themes and styling
7. **Integration Plugins** - Connect with external services
8. **Utility Plugins** - General-purpose tools

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- TypeScript knowledge
- Basic understanding of React (for UI plugins)
- Vibe University account

### Project Structure

```
my-plugin/
├── package.json
├── plugin.manifest.json
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── commands/         # Plugin commands
│   ├── components/       # UI components (optional)
│   └── utils/            # Utility functions
├── tests/
│   └── index.test.ts
├── README.md
└── LICENSE
```

### Create Your First Plugin

1. **Initialize the project**

```bash
mkdir my-citation-plugin
cd my-citation-plugin
npm init -y
npm install --save-dev typescript @types/node
```

2. **Create plugin manifest** (`plugin.manifest.json`)

```json
{
  "id": "my-citation-plugin",
  "name": "My Citation Plugin",
  "version": "1.0.0",
  "description": "A custom citation formatter",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "license": "MIT",
  "keywords": ["citation", "formatting"],
  "category": "citation",
  "main": "dist/index.js",
  "permissions": ["access:citations"],
  "engines": {
    "vibeUniversity": ">=0.1.0"
  }
}
```

3. **Create plugin code** (`src/index.ts`)

```typescript
import { Plugin, PluginContext, PluginPermission } from '@vibe-university/plugin-api'

const myPlugin: Plugin = {
  metadata: {
    id: 'my-citation-plugin',
    name: 'My Citation Plugin',
    version: '1.0.0',
    description: 'A custom citation formatter',
    author: {
      name: 'Your Name',
      email: 'your.email@example.com',
    },
    license: 'MIT',
    keywords: ['citation', 'formatting'],
    category: 'citation',
  },
  config: {
    enabled: true,
    permissions: [PluginPermission.ACCESS_CITATIONS],
  },
  status: 'unloaded',

  onInitialize: async (context: PluginContext) => {
    context.logger.info('Plugin initialized!')

    // Register a command
    context.api.registerCommand({
      id: 'format-custom',
      name: 'Format Citation (Custom)',
      description: 'Format citation in custom style',
      execute: async (citation: any) => {
        return formatCitation(citation)
      },
    })
  },

  onActivate: async () => {
    console.log('Plugin activated!')
  },
}

function formatCitation(citation: any): string {
  // Your custom formatting logic
  return `${citation.author} (${citation.year}). ${citation.title}.`
}

export default myPlugin
```

4. **Build and test**

```bash
npm run build
npm test
```

---

## Plugin Architecture

### Plugin Lifecycle

Plugins go through several lifecycle stages:

```
UNLOADED → LOADING → LOADED → INITIALIZING → INITIALIZED → ACTIVATING → ACTIVE
                                                    ↓
                                              DEACTIVATING → DEACTIVATED → UNLOADED
```

### Lifecycle Hooks

- **`onLoad()`** - Called when plugin is first loaded
- **`onInitialize(context)`** - Called to initialize plugin with context
- **`onActivate()`** - Called when plugin is activated
- **`onDeactivate()`** - Called when plugin is deactivated
- **`onUnload()`** - Called before plugin is unloaded

### Plugin Context

The context object provides access to:

- **API** - Interact with Vibe University features
- **Storage** - Persistent plugin storage
- **Logger** - Logging utilities
- **Config** - Plugin configuration

---

## Plugin API Reference

### Commands

Register commands that users can execute:

```typescript
context.api.registerCommand({
  id: 'my-command',
  name: 'My Command',
  description: 'Does something useful',
  execute: async (args?: any) => {
    // Command logic
    return result
  },
  icon: '🚀',
  shortcut: 'Ctrl+Shift+C',
})
```

### UI Components

Add custom UI components:

```typescript
context.api.registerUIComponent({
  id: 'my-panel',
  name: 'My Panel',
  location: 'sidebar',
  render: () => <MyCustomComponent />,
})
```

### Export Formats

Register custom export formats:

```typescript
context.api.registerExportFormat({
  id: 'custom-format',
  name: 'Custom Format',
  extension: '.custom',
  mimeType: 'application/custom',
  export: async (document: any) => {
    // Convert document to your format
    const content = convertDocument(document)
    return new Blob([content], { type: 'application/custom' })
  },
})
```

### Import Formats

Support custom file imports:

```typescript
context.api.registerImportFormat({
  id: 'custom-import',
  name: 'Custom Import',
  extensions: ['.custom'],
  mimeTypes: ['application/custom'],
  import: async (file: File) => {
    // Parse file and return document
    const content = await file.text()
    return parseDocument(content)
  },
})
```

### Storage

Persist plugin data:

```typescript
// Save data
await context.storage.set('myKey', { data: 'value' })

// Load data
const data = await context.storage.get<MyType>('myKey')

// Delete data
await context.storage.delete('myKey')

// Clear all data
await context.storage.clear()
```

### Logger

Log messages:

```typescript
context.logger.debug('Debug message')
context.logger.info('Info message')
context.logger.warn('Warning message')
context.logger.error('Error message')
```

### Notifications

Show user notifications:

```typescript
context.api.notifications.show('Operation successful!', 'success')
context.api.notifications.show('Warning message', 'warning')
context.api.notifications.show('Error occurred', 'error')
context.api.notifications.show('Information', 'info')
```

---

## Example Plugins

### Citation Formatter Plugin

See [`plugins/examples/citation-formatter-plus.ts`](../plugins/examples/citation-formatter-plus.ts) for a complete example of a citation formatting plugin.

Key features:
- Implements IEEE and ACS citation styles
- Registers multiple commands
- Uses citation API

### Markdown Export Plugin

See [`plugins/examples/markdown-export.ts`](../plugins/examples/markdown-export.ts) for a document export plugin.

Key features:
- Registers export format
- Handles document conversion
- Includes frontmatter support

---

## Best Practices

### Security

1. **Request minimum permissions** - Only ask for what you need
2. **Validate user input** - Always sanitize and validate
3. **Handle errors gracefully** - Don't crash the application
4. **Use HTTPS** - For external API calls

### Performance

1. **Lazy loading** - Load resources only when needed
2. **Cache results** - Use storage for expensive operations
3. **Async operations** - Don't block the main thread
4. **Clean up resources** - In `onDeactivate()` and `onUnload()`

### User Experience

1. **Clear naming** - Use descriptive names and descriptions
2. **Provide feedback** - Use notifications and progress indicators
3. **Error messages** - Be helpful and actionable
4. **Documentation** - Include a README with examples

### Code Quality

1. **TypeScript** - Use types for better reliability
2. **Testing** - Write unit tests for your plugin
3. **Linting** - Use ESLint and Prettier
4. **Version control** - Use semantic versioning

---

## Publishing Your Plugin

### Submission Checklist

- [ ] Plugin manifest is complete and valid
- [ ] Code is well-documented
- [ ] Tests pass and coverage is good
- [ ] README includes usage examples
- [ ] License file is included
- [ ] No security vulnerabilities
- [ ] Follows plugin guidelines

### Submission Process

1. **Test thoroughly** - Make sure everything works

2. **Package your plugin**

```bash
npm run build
npm pack
```

3. **Submit to marketplace**

Visit the Vibe University Plugin Marketplace and submit your plugin package.

4. **Review process**

Our team will review your plugin for:
- Security and safety
- Code quality
- User experience
- Documentation

5. **Publication**

Once approved, your plugin will be available in the marketplace!

### Updating Your Plugin

To update your plugin:

1. Increment version in `plugin.manifest.json`
2. Document changes in CHANGELOG.md
3. Test thoroughly
4. Resubmit to marketplace

---

## Support

Need help? Here's where to get support:

- **Documentation**: https://docs.vibeuniversity.com/plugins
- **Discord**: https://discord.gg/vibeuniversity
- **GitHub**: https://github.com/vibeuniversity/plugins
- **Email**: plugins@vibeuniversity.com

---

## License

This documentation is licensed under MIT License.

---

**Happy Plugin Development!** 🚀
