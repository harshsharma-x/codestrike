export class ConfigManager {
  private static instance: ConfigManager;
  private config: Map<string, unknown> = new Map();

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  get<T>(key: string): T | undefined {
    return this.config.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.config.set(key, value);
  }

  has(key: string): boolean {
    return this.config.has(key);
  }

  delete(key: string): boolean {
    return this.config.delete(key);
  }

  clear(): void {
    this.config.clear();
  }

  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.config.entries());
  }
}
