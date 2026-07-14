import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_PATH = join(process.cwd(), 'codestrike.json');
const ENV_PATH = join(homedir(), '.codestrike', '.env');

function loadEnvFile(): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!existsSync(ENV_PATH)) return vars;
  const content = readFileSync(ENV_PATH, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key) vars[key] = val;
  }
  return vars;
}

function saveEnvFile(vars: Record<string, string>): void {
  const dir = join(homedir(), '.codestrike');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const content = Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
  writeFileSync(ENV_PATH, content);
}

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

export async function GET() {
  try {
    const config = existsSync(CONFIG_PATH)
      ? JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
      : {};

    const envVars = loadEnvFile();
    const apiKeys: Record<string, boolean> = {};
    for (const [provider, envKey] of Object.entries(PROVIDER_ENV_KEYS)) {
      apiKeys[provider] = !!(envVars[envKey] || process.env[envKey]);
    }

    return NextResponse.json({
      configured: existsSync(CONFIG_PATH),
      apiKeys,
      ...config,
    });
  } catch {
    return NextResponse.json({ configured: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.apiKey && body.provider) {
      const envKey = PROVIDER_ENV_KEYS[body.provider as string];
      if (envKey) {
        const envVars = loadEnvFile();
        envVars[envKey] = body.apiKey;
        saveEnvFile(envVars);
        process.env[envKey] = body.apiKey;
        return NextResponse.json({ success: true, saved: envKey });
      }
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save', message: String(error) },
      { status: 500 },
    );
  }
}