#!/usr/bin/env node
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const { homedir } = require('os');

const PROVIDERS = {
  openrouter: { name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/keys' },
  groq: { name: 'Groq', envKey: 'GROQ_API_KEY', url: 'https://console.groq.com/keys' },
  openai: { name: 'OpenAI', envKey: 'OPENAI_API_KEY', url: 'https://platform.openai.com/api-keys' },
  anthropic: { name: 'Anthropic', envKey: 'ANTHROPIC_API_KEY', url: 'https://console.anthropic.com/' },
  gemini: { name: 'Gemini', envKey: 'GEMINI_API_KEY', url: 'https://aistudio.google.com/apikey' },
};

const providerId = process.argv[2] || 'openrouter';
const apiKey = process.argv[3];

if (!apiKey) {
  const p = PROVIDERS[providerId];
  console.log(`Usage: node setup-key.js [provider] YOUR_API_KEY`);
  console.log(`Providers:`);
  for (const [id, info] of Object.entries(PROVIDERS)) {
    console.log(`  ${id} → ${info.url}`);
  }
  console.log(`\nExample: node setup-key.js openrouter sk-or-v1-abc123`);
  process.exit(1);
}

const provider = PROVIDERS[providerId];
if (!provider) {
  console.error(`Unknown provider: ${providerId}`);
  process.exit(1);
}

const envPath = join(homedir(), '.codestrike', '.env');
const dir = join(homedir(), '.codestrike');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

let existing = '';
try { existing = require('fs').readFileSync(envPath, 'utf-8'); } catch {}

const newLine = `${provider.envKey}=${apiKey}`;
const regex = new RegExp(`^${provider.envKey}=.*$`, 'm');
if (regex.test(existing)) {
  existing = existing.replace(regex, newLine);
} else {
  existing += (existing ? '\n' : '') + newLine;
}
writeFileSync(envPath, existing.trim() + '\n');

process.env[provider.envKey] = apiKey;
console.log(`✓ Saved ${provider.name} API key to ~/.codestrike/.env`);
console.log(`  Restart your server or run: source ~/.codestrike/.env`);
