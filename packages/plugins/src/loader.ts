import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { CodeStrikePlugin } from './types';
import { PluginRegistry } from './registry';
import { Logger } from '@codestrike/core';

export class PluginLoader {
  private registry: PluginRegistry;
  private logger: Logger;

  constructor(registry: PluginRegistry) {
    this.registry = registry;
    this.logger = new Logger('PluginLoader');
  }

  loadFromDirectory(dir: string): void {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      try {
        const pluginPath = join(dir, entry);
        const plugin = require(pluginPath) as { default?: CodeStrikePlugin; plugin?: CodeStrikePlugin };
        const p = plugin.default || plugin.plugin;
        if (p && p.manifest && p.hooks) {
          this.registry.register(p);
          this.logger.info(`Loaded plugin: ${p.manifest.name}@${p.manifest.version}`);
        }
      } catch (error) {
        this.logger.error(`Failed to load plugin from ${entry}: ${error}`);
      }
    }
  }

  loadFromNodeModules(pattern?: string): void {
    // Scans node_modules/@codestrike-plugins-* for plugins
    const searchPaths = [
      ...(process.env.NODE_PATH ? process.env.NODE_PATH.split(':') : []),
      join(process.cwd(), 'node_modules'),
    ];
    for (const basePath of searchPaths) {
      const pluginsDir = join(basePath, '@codestrike');
      if (existsSync(pluginsDir)) {
        for (const pkg of readdirSync(pluginsDir)) {
          if (pattern && !pkg.includes(pattern)) continue;
          const pkgPath = join(pluginsDir, pkg);
          const pkgJson = join(pkgPath, 'package.json');
          if (existsSync(pkgJson)) {
            try {
              const plugin = require(pkgPath) as { default?: CodeStrikePlugin; plugin?: CodeStrikePlugin };
              const p = plugin.default || plugin.plugin;
              if (p && p.manifest && p.hooks) {
                this.registry.register(p);
                this.logger.info(`Loaded plugin: ${p.manifest.name}@${p.manifest.version} from ${pkgPath}`);
              }
            } catch { /* skip invalid plugins */ }
          }
        }
      }
    }
  }
}
