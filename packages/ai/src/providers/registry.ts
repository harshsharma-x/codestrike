import { AIProvider } from './interface';
import { OpenRouterProvider } from './openrouter';
import { GroqProvider } from './groq';
import { HuggingFaceProvider } from './huggingface';
import { OllamaProvider } from './ollama';
import { LMStudioProvider } from './lmstudio';
import { DeepSeekProvider } from './deepseek';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { MistralProvider } from './mistral';
import { TogetherProvider } from './together';
import { CerebrasProvider } from './cerebras';
import { FireworksProvider } from './fireworks';
import { XAIProvider } from './xai';
import { NemotronProvider } from './nemotron';
import { GGUFProvider } from './gguf';
import { CodeStrikeError } from '@codestrike/core';

export type ProviderName = 'openrouter' | 'groq' | 'huggingface' | 'ollama' | 'lmstudio' | 'deepseek' | 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'together' | 'cerebras' | 'fireworks' | 'xai' | 'nemotron' | 'gguf';

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<ProviderName, AIProvider> = new Map();

  private constructor() {
    this.registerDefaultProviders();
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  private registerDefaultProviders(): void {
    this.register('openrouter', new OpenRouterProvider());
    this.register('groq', new GroqProvider());
    this.register('huggingface', new HuggingFaceProvider());
    this.register('ollama', new OllamaProvider());
    this.register('lmstudio', new LMStudioProvider());
    this.register('deepseek', new DeepSeekProvider());
    this.register('openai', new OpenAIProvider());
    this.register('anthropic', new AnthropicProvider());
    this.register('gemini', new GeminiProvider());
    this.register('mistral', new MistralProvider());
    this.register('together', new TogetherProvider());
    this.register('cerebras', new CerebrasProvider());
    this.register('fireworks', new FireworksProvider());
    this.register('xai', new XAIProvider());
    this.register('nemotron', new NemotronProvider());
    this.register('gguf', new GGUFProvider());
  }

  register(name: ProviderName, provider: AIProvider): void {
    this.providers.set(name, provider);
  }

  get(name: ProviderName, config?: { apiKey?: string; baseUrl?: string }): AIProvider {
    const existing = this.providers.get(name);
    if (existing && !config) return existing;

    switch (name) {
      case 'openrouter': return new OpenRouterProvider(config);
      case 'groq': return new GroqProvider(config);
      case 'huggingface': return new HuggingFaceProvider(config);
      case 'ollama': return new OllamaProvider(config);
      case 'lmstudio': return new LMStudioProvider(config);
      case 'deepseek': return new DeepSeekProvider(config);
      case 'openai': return new OpenAIProvider(config);
      case 'anthropic': return new AnthropicProvider(config);
      case 'gemini': return new GeminiProvider(config);
      case 'mistral': return new MistralProvider(config);
      case 'together': return new TogetherProvider(config);
      case 'cerebras': return new CerebrasProvider(config);
      case 'fireworks': return new FireworksProvider(config);
      case 'xai': return new XAIProvider(config);
      case 'nemotron': return new NemotronProvider(config);
      case 'gguf': return new GGUFProvider(config);
      default:
        throw new CodeStrikeError(`Unknown provider: ${name}`, 'AI_PROVIDER_ERROR');
    }
  }

  getAllProviders(): Map<ProviderName, AIProvider> {
    return this.providers;
  }

  getAvailableProviders(): ProviderName[] {
    return Array.from(this.providers.keys());
  }
}
