import { CodeStrikePlugin, PluginConfig } from './types';

export class PluginRegistry {
  private plugins: Map<string, CodeStrikePlugin> = new Map();
  private configs: Map<string, PluginConfig> = new Map();

  register(plugin: CodeStrikePlugin): void {
    this.plugins.set(plugin.manifest.name, plugin);
    this.configs.set(plugin.manifest.name, { enabled: true });
  }

  unregister(name: string): void {
    this.plugins.delete(name);
    this.configs.delete(name);
  }

  get(name: string): CodeStrikePlugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): CodeStrikePlugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabled(): CodeStrikePlugin[] {
    return this.getAll().filter(p => this.configs.get(p.manifest.name)?.enabled);
  }

  setConfig(name: string, config: Partial<PluginConfig>): void {
    const existing = this.configs.get(name) || { enabled: true };
    this.configs.set(name, { ...existing, ...config });
  }

  getConfig(name: string): PluginConfig {
    return this.configs.get(name) || { enabled: true };
  }
}
