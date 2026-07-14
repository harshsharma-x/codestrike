import { FastifyInstance } from 'fastify';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROVIDER_ENV_KEYS: Record<string, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  groq: 'GROQ_API_KEY',
  huggingface: 'HUGGINGFACE_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  together: 'TOGETHER_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  fireworks: 'FIREWORKS_API_KEY',
  xai: 'XAI_API_KEY',
  nemotron: 'NVIDIA_API_KEY',
};

export async function configRoutes(server: FastifyInstance) {
  server.get('/', async () => {
    const configPath = join(process.cwd(), 'codestrike.json');

    const apiKeys: Record<string, boolean> = {};
    for (const [provider, envKey] of Object.entries(PROVIDER_ENV_KEYS)) {
      apiKeys[provider] = !!process.env[envKey];
    }

    if (!existsSync(configPath)) {
      return { configured: false, apiKeys };
    }

    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      return { configured: true, apiKeys, ...config };
    } catch {
      return { configured: false, error: 'Invalid config file' };
    }
  });

  server.post('/', async (request, reply) => {
    const body = request.body as Record<string, unknown>;

    if (body.apiKey && body.provider) {
      const envKey = PROVIDER_ENV_KEYS[body.provider as string];
      if (envKey) {
        const envPath = join(homedir(), '.codestrike', '.env');
        const dir = join(homedir(), '.codestrike');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

        let existing = '';
        try { existing = readFileSync(envPath, 'utf-8'); } catch { /* */ }

        const newLine = `${envKey}=${body.apiKey}`;
        const regex = new RegExp(`^${envKey}=.*$`, 'm');
        if (regex.test(existing)) {
          existing = existing.replace(regex, newLine);
        } else {
          existing += (existing.endsWith('\n') ? '' : '\n') + newLine;
        }
        writeFileSync(envPath, existing.trim() + '\n');

        process.env[envKey] = body.apiKey as string;
        return { success: true, envKey };
      }
      return reply.status(400).send({ error: 'Unknown provider' });
    }

    const configPath = join(process.cwd(), 'codestrike.json');
    try {
      writeFileSync(configPath, JSON.stringify(body, null, 2));
      return { success: true };
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to save config',
        message: String(error),
      });
    }
  });

  server.get('/env', async () => {
    const status: Record<string, boolean> = {};
    for (const [, envKey] of Object.entries(PROVIDER_ENV_KEYS)) {
      status[envKey] = !!process.env[envKey];
    }
    return { providers: status };
  });
}
