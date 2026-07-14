import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_CONFIG, DefaultConfig } from './defaults';

export class ConfigLoader {
  private configPath: string;

  constructor(cwd?: string) {
    this.configPath = join(cwd || process.cwd(), 'codestrike.json');
  }

  load(): DefaultConfig {
    if (!existsSync(this.configPath)) {
      return { ...DEFAULT_CONFIG };
    }

    try {
      const raw = readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...config,
        ignorePatterns: config.ignorePatterns || DEFAULT_CONFIG.ignorePatterns,
      };
    } catch {
      console.warn('Failed to parse codestrike.json, using defaults');
      return { ...DEFAULT_CONFIG };
    }
  }

  save(config: Partial<DefaultConfig>): void {
    const existing = this.load();
    const merged = { ...existing, ...config };
    writeFileSync(this.configPath, JSON.stringify(merged, null, 2));
  }

  get(key: keyof DefaultConfig): DefaultConfig[keyof DefaultConfig] {
    return this.load()[key];
  }

  set(key: keyof DefaultConfig, value: DefaultConfig[keyof DefaultConfig]): void {
    this.save({ [key]: value });
  }

  exists(): boolean {
    return existsSync(this.configPath);
  }
}
