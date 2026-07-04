/**
 * Plugin Registry
 * Manages registration, lifecycle, and access to plugins
 */

import type {
  Plugin,
  ViewerPlugin,
  EditorPlugin,
  GeneratorPlugin,
  PluginEvent,
  PluginEventHandler,
  PluginContext,
} from './types';

/**
 * Plugin Registry - Central hub for all plugins
 */
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private eventHandlers: Map<string, PluginEventHandler[]> = new Map();
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered`);
      return;
    }

    // Initialize plugin if needed
    if (plugin.initialize) {
      await plugin.initialize();
    }

    this.plugins.set(plugin.id, plugin);
    console.log(`✅ Plugin registered: ${plugin.name} (${plugin.id})`);
  }

  /**
   * Register multiple plugins
   */
  async registerMany(plugins: Plugin[]): Promise<void> {
    for (const plugin of plugins) {
      await this.register(plugin);
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin ${pluginId} not found`);
      return;
    }

    // Cleanup plugin if needed
    if (plugin.cleanup) {
      await plugin.cleanup();
    }

    this.plugins.delete(pluginId);
    console.log(`❌ Plugin unregistered: ${plugin.name} (${pluginId})`);
  }

  /**
   * Get a plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins by capability
   */
  getPluginsByCapability(capability: string): Plugin[] {
    return this.getAllPlugins().filter(p => p.capabilities.includes(capability as any));
  }

  /**
   * Get viewer plugins
   */
  getViewerPlugins(): ViewerPlugin[] {
    return this.getPluginsByCapability('viewer') as ViewerPlugin[];
  }

  /**
   * Get editor plugins
   */
  getEditorPlugins(): EditorPlugin[] {
    return this.getPluginsByCapability('editor') as EditorPlugin[];
  }

  /**
   * Get generator plugins
   */
  getGeneratorPlugins(): GeneratorPlugin[] {
    return this.getPluginsByCapability('generator') as GeneratorPlugin[];
  }

  /**
   * Find plugin that can handle a specific content type
   */
  findPluginForContentType(contentType: string, capability: string = 'viewer'): Plugin | undefined {
    return this.getAllPlugins().find(
      p => p.contentTypes.includes(contentType) && p.capabilities.includes(capability as any)
    );
  }

  /**
   * Find viewer plugin for content
   */
  findViewerForContent(url: string, contentType: string): ViewerPlugin | undefined {
    const viewers = this.getViewerPlugins();
    
    // First, try plugins with custom canHandle logic
    for (const viewer of viewers) {
      if (viewer.canHandle && viewer.canHandle(url, contentType)) {
        return viewer;
      }
    }
    
    // Fall back to contentTypes matching
    return viewers.find(v => v.contentTypes.includes(contentType));
  }

  /**
   * Find editor plugin for content
   */
  findEditorForContent(contentType: string): EditorPlugin | undefined {
    const editors = this.getEditorPlugins();
    return editors.find(e => e.contentTypes.includes(contentType));
  }

  /**
   * Get all MCP tools from all plugins
   */
  getAllTools() {
    const tools: any[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.tools) {
        tools.push(...plugin.tools);
      }
    }
    return tools;
  }

  /**
   * Emit an event
   */
  emit(event: PluginEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }

  /**
   * Listen to events
   */
  on(eventType: string, handler: PluginEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, handler: PluginEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get plugin context
   */
  getContext(): PluginContext {
    return this.context;
  }

  /**
   * Update plugin context
   */
  updateContext(updates: Partial<PluginContext>): void {
    this.context = { ...this.context, ...updates };
  }
}

/**
 * Create a new plugin registry instance
 */
export function createPluginRegistry(context: PluginContext): PluginRegistry {
  return new PluginRegistry(context);
}

