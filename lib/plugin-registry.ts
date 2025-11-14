/**
 * Phase 4.4.1: Plugin Registry
 * Manages plugin lifecycle, registration, and execution
 */

import {
  Plugin,
  PluginContext,
  PluginConfig,
  PluginRegistryEntry,
  PluginStatus,
  PluginPermission,
  PluginAPI,
  PluginStorage,
  PluginLogger,
} from './types/plugin'

// Plugin extension types
interface PluginCommand {
  name: string
  description: string
  execute: (context: PluginContext, ...args: unknown[]) => unknown
}

interface PluginUIComponent {
  name: string
  component: unknown
  props?: Record<string, unknown>
}

interface PluginFormat {
  name: string
  extension: string
  mimeType: string
  handler: (data: unknown) => unknown
}

/**
 * Plugin Registry - Singleton pattern
 */
class PluginRegistry {
  private static instance: PluginRegistry
  private plugins: Map<string, PluginRegistryEntry> = new Map()
  private commands: Map<string, PluginCommand> = new Map()
  private uiComponents: Map<string, PluginUIComponent> = new Map()
  private exportFormats: Map<string, PluginFormat> = new Map()
  private importFormats: Map<string, PluginFormat> = new Map()

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry()
    }
    return PluginRegistry.instance
  }

  /**
   * Register a plugin
   */
  public async register(
    plugin: Plugin,
    config: PluginConfig
  ): Promise<void> {
    const pluginId = plugin.metadata.id

    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered`)
    }

    // Validate plugin
    this.validatePlugin(plugin)

    // Create plugin context
    const context = this.createContext(plugin.metadata.id, config)

    // Create registry entry
    const entry: PluginRegistryEntry = {
      plugin: {
        ...plugin,
        config,
        status: PluginStatus.UNLOADED,
      },
      context,
      loadedAt: new Date(),
    }

    this.plugins.set(pluginId, entry)

    // Load the plugin
    await this.loadPlugin(pluginId)
  }

  /**
   * Unregister a plugin
   */
  public async unregister(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }

    // Deactivate if active
    if (entry.plugin.status === PluginStatus.ACTIVE) {
      await this.deactivatePlugin(pluginId)
    }

    // Unload the plugin
    await this.unloadPlugin(pluginId)

    // Remove from registry
    this.plugins.delete(pluginId)

    // Clean up registered items
    this.cleanupPlugin(pluginId)
  }

  /**
   * Load a plugin
   */
  private async loadPlugin(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    try {
      entry.plugin.status = PluginStatus.LOADING

      // Call onLoad hook
      if (entry.plugin.onLoad) {
        await entry.plugin.onLoad()
      }

      entry.plugin.status = PluginStatus.LOADED

      // Initialize the plugin
      await this.initializePlugin(pluginId)
    } catch (error) {
      entry.plugin.status = PluginStatus.ERROR
      throw new Error(`Failed to load plugin ${pluginId}: ${error}`)
    }
  }

  /**
   * Initialize a plugin
   */
  private async initializePlugin(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    try {
      entry.plugin.status = PluginStatus.INITIALIZING

      // Call onInitialize hook
      if (entry.plugin.onInitialize) {
        await entry.plugin.onInitialize(entry.context)
      }

      entry.plugin.status = PluginStatus.INITIALIZED

      // Auto-activate if enabled
      if (entry.plugin.config.enabled) {
        await this.activatePlugin(pluginId)
      }
    } catch (error) {
      entry.plugin.status = PluginStatus.ERROR
      throw new Error(`Failed to initialize plugin ${pluginId}: ${error}`)
    }
  }

  /**
   * Activate a plugin
   */
  public async activatePlugin(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (entry.plugin.status === PluginStatus.ACTIVE) {
      return // Already active
    }

    try {
      entry.plugin.status = PluginStatus.ACTIVATING

      // Call onActivate hook
      if (entry.plugin.onActivate) {
        await entry.plugin.onActivate()
      }

      entry.plugin.status = PluginStatus.ACTIVE
      entry.activatedAt = new Date()

      this.logInfo(pluginId, `Plugin activated`)
    } catch (error) {
      entry.plugin.status = PluginStatus.ERROR
      throw new Error(`Failed to activate plugin ${pluginId}: ${error}`)
    }
  }

  /**
   * Deactivate a plugin
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (entry.plugin.status !== PluginStatus.ACTIVE) {
      return // Not active
    }

    try {
      entry.plugin.status = PluginStatus.DEACTIVATING

      // Call onDeactivate hook
      if (entry.plugin.onDeactivate) {
        await entry.plugin.onDeactivate()
      }

      entry.plugin.status = PluginStatus.DEACTIVATED
      entry.activatedAt = undefined

      this.logInfo(pluginId, `Plugin deactivated`)
    } catch (error) {
      entry.plugin.status = PluginStatus.ERROR
      throw new Error(`Failed to deactivate plugin ${pluginId}: ${error}`)
    }
  }

  /**
   * Unload a plugin
   */
  private async unloadPlugin(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId)
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    try {
      // Call onUnload hook
      if (entry.plugin.onUnload) {
        await entry.plugin.onUnload()
      }

      entry.plugin.status = PluginStatus.UNLOADED
    } catch (error) {
      entry.plugin.status = PluginStatus.ERROR
      throw new Error(`Failed to unload plugin ${pluginId}: ${error}`)
    }
  }

  /**
   * Validate plugin
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.metadata?.id) {
      throw new Error('Plugin must have an id')
    }
    if (!plugin.metadata?.name) {
      throw new Error('Plugin must have a name')
    }
    if (!plugin.metadata?.version) {
      throw new Error('Plugin must have a version')
    }
  }

  /**
   * Create plugin context
   */
  private createContext(pluginId: string, config: PluginConfig): PluginContext {
    return {
      pluginId,
      config,
      api: this.createAPI(pluginId, config),
      storage: this.createStorage(pluginId),
      logger: this.createLogger(pluginId),
    }
  }

  /**
   * Create plugin API
   */
  private createAPI(pluginId: string, config: PluginConfig): PluginAPI {
    return {
      registerCommand: (command) => {
        const commandId = `${pluginId}.${command.id}`
        this.commands.set(commandId, { ...command, pluginId })
      },
      registerUIComponent: (component) => {
        const componentId = `${pluginId}.${component.id}`
        this.uiComponents.set(componentId, { ...component, pluginId })
      },
      registerExportFormat: (format) => {
        const formatId = `${pluginId}.${format.id}`
        this.exportFormats.set(formatId, { ...format, pluginId })
      },
      registerImportFormat: (format) => {
        const formatId = `${pluginId}.${format.id}`
        this.importFormats.set(formatId, { ...format, pluginId })
      },
      citations: {
        format: (citation, _style) => {
          // Implementation would integrate with existing citation system
          return JSON.stringify(citation)
        },
        validate: (citation) => {
          return !!citation
        },
        search: async (_query) => {
          // Implementation would integrate with existing research system
          return []
        },
      },
      files: {
        read: async (_path) => {
          this.checkPermission(config, PluginPermission.READ_FILES)
          // Implementation would integrate with file system
          return ''
        },
        write: async (_path, _content) => {
          this.checkPermission(config, PluginPermission.WRITE_FILES)
          // Implementation would integrate with file system
        },
        list: async (_directory) => {
          this.checkPermission(config, PluginPermission.READ_FILES)
          // Implementation would integrate with file system
          return []
        },
      },
      notifications: {
        show: (message, type) => {
          // Implementation would integrate with notification system
          console.log(`[${type.toUpperCase()}] ${message}`)
        },
      },
    }
  }

  /**
   * Create plugin storage
   */
  private createStorage(pluginId: string): PluginStorage {
    const storagePrefix = `plugin:${pluginId}:`

    return {
      get: async <T>(key: string): Promise<T | null> => {
        const fullKey = storagePrefix + key
        const value = localStorage.getItem(fullKey)
        return value ? JSON.parse(value) : null
      },
      set: async <T>(key: string, value: T): Promise<void> => {
        const fullKey = storagePrefix + key
        localStorage.setItem(fullKey, JSON.stringify(value))
      },
      delete: async (key: string): Promise<void> => {
        const fullKey = storagePrefix + key
        localStorage.removeItem(fullKey)
      },
      clear: async (): Promise<void> => {
        const keys = Object.keys(localStorage).filter((k) =>
          k.startsWith(storagePrefix)
        )
        keys.forEach((k) => localStorage.removeItem(k))
      },
    }
  }

  /**
   * Create plugin logger
   */
  private createLogger(pluginId: string): PluginLogger {
    const prefix = `[Plugin:${pluginId}]`

    return {
      debug: (message, ...args) => console.debug(prefix, message, ...args),
      info: (message, ...args) => console.info(prefix, message, ...args),
      warn: (message, ...args) => console.warn(prefix, message, ...args),
      error: (message, ...args) => console.error(prefix, message, ...args),
    }
  }

  /**
   * Check if plugin has permission
   */
  private checkPermission(
    config: PluginConfig,
    permission: PluginPermission
  ): void {
    if (!config.permissions.includes(permission)) {
      throw new Error(`Plugin does not have permission: ${permission}`)
    }
  }

  /**
   * Clean up plugin resources
   */
  private cleanupPlugin(pluginId: string): void {
    // Remove commands
    for (const [key, value] of this.commands.entries()) {
      if (value.pluginId === pluginId) {
        this.commands.delete(key)
      }
    }

    // Remove UI components
    for (const [key, value] of this.uiComponents.entries()) {
      if (value.pluginId === pluginId) {
        this.uiComponents.delete(key)
      }
    }

    // Remove export formats
    for (const [key, value] of this.exportFormats.entries()) {
      if (value.pluginId === pluginId) {
        this.exportFormats.delete(key)
      }
    }

    // Remove import formats
    for (const [key, value] of this.importFormats.entries()) {
      if (value.pluginId === pluginId) {
        this.importFormats.delete(key)
      }
    }
  }

  /**
   * Get all registered plugins
   */
  public getPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).map((entry) => entry.plugin)
  }

  /**
   * Get plugin by id
   */
  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)?.plugin
  }

  /**
   * Get all registered commands
   */
  public getCommands(): PluginCommand[] {
    return Array.from(this.commands.values())
  }

  /**
   * Get all registered UI components
   */
  public getUIComponents(): PluginUIComponent[] {
    return Array.from(this.uiComponents.values())
  }

  /**
   * Get all registered export formats
   */
  public getExportFormats(): PluginFormat[] {
    return Array.from(this.exportFormats.values())
  }

  /**
   * Get all registered import formats
   */
  public getImportFormats(): PluginFormat[] {
    return Array.from(this.importFormats.values())
  }

  /**
   * Log info message
   */
  private logInfo(pluginId: string, message: string): void {
    console.info(`[PluginRegistry:${pluginId}]`, message)
  }
}

export default PluginRegistry
export const pluginRegistry = PluginRegistry.getInstance()
