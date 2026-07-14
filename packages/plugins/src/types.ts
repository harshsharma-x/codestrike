export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  entry: string;
}

export interface PluginHooks {
  onRegister?: () => void | Promise<void>;
  onUnregister?: () => void | Promise<void>;
  onCommand?: (name: string, args: string[]) => boolean | Promise<boolean>;
  onTool?: (name: string, args: Record<string, unknown>) => unknown | Promise<unknown>;
}

export interface CodeStrikePlugin {
  manifest: PluginManifest;
  hooks: PluginHooks;
}

export interface PluginConfig {
  enabled: boolean;
  config?: Record<string, unknown>;
}
