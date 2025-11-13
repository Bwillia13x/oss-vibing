/**
 * Phase 4.4.1: Plugin/Extension System Type Definitions
 * Defines the core interfaces and types for the plugin system
 */

/**
 * Plugin metadata information
 */
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: {
    name: string
    email?: string
    url?: string
  }
  homepage?: string
  repository?: string
  license: string
  keywords: string[]
  category: PluginCategory
  icon?: string
  screenshots?: string[]
}

/**
 * Plugin categories
 */
export enum PluginCategory {
  CITATION = 'citation',
  EXPORT = 'export',
  IMPORT = 'import',
  ANALYSIS = 'analysis',
  FORMATTING = 'formatting',
  THEME = 'theme',
  INTEGRATION = 'integration',
  UTILITY = 'utility',
  OTHER = 'other',
}

/**
 * Plugin permissions
 */
export enum PluginPermission {
  READ_FILES = 'read:files',
  WRITE_FILES = 'write:files',
  ACCESS_NETWORK = 'access:network',
  EXECUTE_CODE = 'execute:code',
  ACCESS_STORAGE = 'access:storage',
  MODIFY_UI = 'modify:ui',
  ACCESS_CITATIONS = 'access:citations',
  ACCESS_TEMPLATES = 'access:templates',
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  enabled: boolean
  permissions: PluginPermission[]
  settings?: Record<string, any>
  rateLimits?: {
    requestsPerMinute: number
    requestsPerHour: number
  }
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /**
   * Called when the plugin is loaded
   */
  onLoad?: () => Promise<void> | void

  /**
   * Called when the plugin is initialized
   */
  onInitialize?: (context: PluginContext) => Promise<void> | void

  /**
   * Called when the plugin is activated
   */
  onActivate?: () => Promise<void> | void

  /**
   * Called when the plugin is deactivated
   */
  onDeactivate?: () => Promise<void> | void

  /**
   * Called when the plugin is unloaded
   */
  onUnload?: () => Promise<void> | void
}

/**
 * Plugin context provided to plugins
 */
export interface PluginContext {
  pluginId: string
  config: PluginConfig
  api: PluginAPI
  storage: PluginStorage
  logger: PluginLogger
}

/**
 * Plugin API for interacting with the application
 */
export interface PluginAPI {
  /**
   * Register a command
   */
  registerCommand: (command: PluginCommand) => void

  /**
   * Register a UI component
   */
  registerUIComponent: (component: PluginUIComponent) => void

  /**
   * Register an export format
   */
  registerExportFormat: (format: PluginExportFormat) => void

  /**
   * Register an import format
   */
  registerImportFormat: (format: PluginImportFormat) => void

  /**
   * Access citation tools
   */
  citations: {
    format: (citation: any, style: string) => string
    validate: (citation: any) => boolean
    search: (query: string) => Promise<any[]>
  }

  /**
   * Access file operations
   */
  files: {
    read: (path: string) => Promise<string>
    write: (path: string, content: string) => Promise<void>
    list: (directory: string) => Promise<string[]>
  }

  /**
   * Access UI notifications
   */
  notifications: {
    show: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  }
}

/**
 * Plugin storage interface
 */
export interface PluginStorage {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, value: T) => Promise<void>
  delete: (key: string) => Promise<void>
  clear: () => Promise<void>
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
}

/**
 * Plugin command
 */
export interface PluginCommand {
  id: string
  name: string
  description: string
  execute: (args?: any) => Promise<any>
  icon?: string
  shortcut?: string
}

/**
 * Plugin UI component
 */
export interface PluginUIComponent {
  id: string
  name: string
  location: 'sidebar' | 'toolbar' | 'modal' | 'panel'
  render: () => React.ReactNode
}

/**
 * Plugin export format
 */
export interface PluginExportFormat {
  id: string
  name: string
  extension: string
  mimeType: string
  export: (document: any) => Promise<Blob>
}

/**
 * Plugin import format
 */
export interface PluginImportFormat {
  id: string
  name: string
  extensions: string[]
  mimeTypes: string[]
  import: (file: File) => Promise<any>
}

/**
 * Plugin manifest (package.json equivalent)
 */
export interface PluginManifest extends PluginMetadata {
  main: string // Entry point file
  permissions: PluginPermission[]
  dependencies?: Record<string, string>
  engines?: {
    vibeUniversity?: string
  }
}

/**
 * Plugin instance
 */
export interface Plugin extends PluginHooks {
  metadata: PluginMetadata
  config: PluginConfig
  status: PluginStatus
}

/**
 * Plugin status
 */
export enum PluginStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  DEACTIVATED = 'deactivated',
  ERROR = 'error',
}

/**
 * Plugin registry entry
 */
export interface PluginRegistryEntry {
  plugin: Plugin
  context: PluginContext
  loadedAt: Date
  activatedAt?: Date
}

/**
 * Plugin marketplace listing
 */
export interface PluginMarketplaceListing {
  metadata: PluginMetadata
  downloads: number
  rating: number
  reviewCount: number
  verified: boolean
  featured: boolean
  pricing?: {
    type: 'free' | 'paid' | 'freemium'
    price?: number
    currency?: string
  }
  createdAt: Date
  updatedAt: Date
}
