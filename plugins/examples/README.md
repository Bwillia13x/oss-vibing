# Plugin Examples

This directory contains example plugins that demonstrate the Vibe University Plugin System.

## Available Examples

### 1. Citation Formatter Plus
**File:** `citation-formatter-plus.ts`

An advanced citation formatting plugin that adds support for IEEE and ACS citation styles.

**Features:**
- IEEE citation formatting
- ACS (American Chemical Society) citation formatting
- Command registration
- Citation API integration

**Usage:**
```typescript
import citationFormatterPlugin from './examples/citation-formatter-plus'
import { pluginRegistry } from '@/lib/plugin-registry'

// Register the plugin
await pluginRegistry.register(citationFormatterPlugin, {
  enabled: true,
  permissions: [PluginPermission.ACCESS_CITATIONS],
})

// Use the plugin commands
// The plugin will register IEEE and ACS formatting commands
```

### 2. Markdown Export
**File:** `markdown-export.ts`

A document export plugin that converts documents to GitHub-flavored Markdown.

**Features:**
- GitHub-flavored Markdown export
- Frontmatter support
- Metadata inclusion
- Citation formatting in Markdown
- Export format registration

**Usage:**
```typescript
import markdownExportPlugin from './examples/markdown-export'
import { pluginRegistry } from '@/lib/plugin-registry'

// Register the plugin
await pluginRegistry.register(markdownExportPlugin, {
  enabled: true,
  permissions: [
    PluginPermission.READ_FILES,
    PluginPermission.WRITE_FILES
  ],
  settings: {
    includeMetadata: true,
    includeFrontmatter: true,
  },
})

// Use the export command
// The plugin will register a "Export as Markdown" command
// Shortcut: Ctrl+Shift+M
```

## Creating Your Own Plugin

See the [Plugin Development Guide](../../docs/PLUGIN-DEVELOPMENT-GUIDE.md) for comprehensive documentation on creating your own plugins.

### Quick Start

1. Create a new TypeScript file in the plugins directory
2. Import the plugin types:
   ```typescript
   import {
     Plugin,
     PluginContext,
     PluginPermission,
   } from '@/lib/types/plugin'
   ```
3. Define your plugin object with metadata and lifecycle hooks
4. Implement your plugin's functionality
5. Test your plugin locally
6. Submit to the marketplace

## Plugin Structure

All plugins should follow this basic structure:

```typescript
const myPlugin: Plugin = {
  metadata: {
    id: 'my-plugin-id',
    name: 'My Plugin Name',
    version: '1.0.0',
    description: 'What my plugin does',
    author: {
      name: 'Your Name',
      email: 'your.email@example.com',
    },
    license: 'MIT',
    keywords: ['keyword1', 'keyword2'],
    category: 'utility',
  },
  config: {
    enabled: true,
    permissions: [/* required permissions */],
    settings: {/* plugin settings */},
  },
  status: 'unloaded',

  onLoad: async () => {
    // Called when plugin is loaded
  },

  onInitialize: async (context: PluginContext) => {
    // Called to initialize plugin
    // Register commands, UI components, etc.
  },

  onActivate: async () => {
    // Called when plugin is activated
  },

  onDeactivate: async () => {
    // Called when plugin is deactivated
  },

  onUnload: async () => {
    // Called when plugin is unloaded
  },
}

export default myPlugin
```

## Testing Plugins

To test a plugin locally:

1. Import and register the plugin:
   ```typescript
   import { pluginRegistry } from '@/lib/plugin-registry'
   import myPlugin from './path/to/my-plugin'
   
   await pluginRegistry.register(myPlugin, config)
   ```

2. Activate the plugin:
   ```typescript
   await pluginRegistry.activatePlugin('my-plugin-id')
   ```

3. Test plugin functionality through the registered commands or UI components

4. Check logs for any errors:
   ```typescript
   const plugins = pluginRegistry.getPlugins()
   console.log(plugins)
   ```

## Plugin Categories

- **citation** - Citation formatting and management
- **export** - Document export formats
- **import** - Document import formats
- **analysis** - Data analysis tools
- **formatting** - Text and document formatting
- **theme** - UI themes and styling
- **integration** - External service integrations
- **utility** - General-purpose tools

## Resources

- [Plugin Development Guide](../../docs/PLUGIN-DEVELOPMENT-GUIDE.md)
- [Plugin API Reference](../../lib/types/plugin.ts)
- [Plugin Registry](../../lib/plugin-registry.ts)
- [Plugin Marketplace API](../../app/api/plugins/route.ts)

## Support

For help with plugin development:
- Documentation: https://docs.vibeuniversity.com/plugins
- Discord: https://discord.gg/vibeuniversity
- GitHub Issues: https://github.com/vibeuniversity/plugins/issues
