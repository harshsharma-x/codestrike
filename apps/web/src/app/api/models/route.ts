import { NextResponse } from 'next/server';
import { ProviderRegistry } from '@codestrike/ai';

export async function GET() {
  try {
    const registry = ProviderRegistry.getInstance();
    const providers = registry.getAvailableProviders();

    const models = providers.map(name => {
      const provider = registry.get(name);
      return {
        id: provider.defaultModel,
        name: provider.defaultModel,
        provider: provider.displayName,
        providerName: name,
        free: true,
        local: ['ollama', 'lmstudio', 'gguf'].includes(name),
      };
    });

    return NextResponse.json({ models, providers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get models', message: String(error) },
      { status: 500 },
    );
  }
}