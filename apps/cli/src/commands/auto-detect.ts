import { Command } from 'commander';
import chalk from 'chalk';
import { ProviderRegistry } from '@codestrike/ai';
import { PROVIDER_INFO } from '@codestrike/shared';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const autoDetectCommand = new Command('auto-detect')
  .description('Auto-detect and configure the best available AI provider')
  .option('-s, --set-default', 'Save the detected provider as default')
  .action(async (options: { setDefault?: boolean }) => {
    const registry = ProviderRegistry.getInstance();
    const all = registry.getAvailableProviders();
    const testPrompt = 'Reply with only the word "ok"';

    console.log(chalk.bold('\n  🔍 Auto-Detecting Best AI Provider\n'));

    const results: {
      name: string;
      displayName: string;
      time: number;
      free: boolean;
      model: string;
    }[] = [];

    for (const name of all) {
      const info = PROVIDER_INFO[name];
      if (!info) continue;

      process.stdout.write(`  ${chalk.dim('→')} Testing ${chalk.bold(info.name)}... `);

      const provider = registry.get(name);
      const isConfigured = await provider.validateConfig();

      if (!isConfigured) {
        process.stdout.write(chalk.dim('not available\n'));
        continue;
      }

      const start = Date.now();
      try {
        const response = await provider.complete({
          provider: name,
          model: info.defaultModel,
          messages: [{ role: 'user' as const, content: testPrompt }],
          maxTokens: 10,
          temperature: 0,
          stream: false,
        });
        const elapsed = Date.now() - start;
        process.stdout.write(chalk.green(`${elapsed}ms\n`));
        results.push({
          name,
          displayName: info.name,
          time: elapsed,
          free: info.free,
          model: response.model || info.defaultModel,
        });
      } catch {
        process.stdout.write(chalk.red('failed\n'));
      }
    }

    if (results.length === 0) {
      console.log(chalk.yellow('\n  ⚠ No AI providers configured or available.'));
      console.log(
        chalk.dim(
          '  Run codestrike login to set up API keys, or start Ollama/LM Studio locally.\n',
        ),
      );
      return;
    }

    results.sort((a, b) => a.time - b.time);
    const best = results[0];

    console.log(chalk.bold('\n  Results (sorted by speed)\n'));
    for (const r of results) {
      const isFastest = r.name === best.name;
      const icon = isFastest ? chalk.green('★') : chalk.dim('○');
      const timeStr = chalk.dim(`${r.time}ms`);
      const costStr = r.free ? chalk.green('Free') : chalk.yellow('Paid');
      console.log(
        `  ${icon} ${isFastest ? chalk.bold(r.displayName) : r.displayName} ${timeStr} ${costStr}`,
      );
    }

    console.log(
      chalk.green(
        `\n  ⚡ Recommended: ${chalk.bold(best.displayName)} (${best.time}ms, ${best.model})`,
      ),
    );

    if (options.setDefault) {
      const configDir = join(homedir(), '.codestrike');
      const configPath = join(configDir, '.env');

      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      const existing = existsSync(configPath) ? readFileSync(configPath, 'utf-8') : '';
      const newLine = `CODESTRIKE_DEFAULT_PROVIDER=${best.name}\nCODESTRIKE_DEFAULT_MODEL=${best.model}`;

      if (existing.includes('CODESTRIKE_DEFAULT_PROVIDER')) {
        const updated = existing
          .replace(/CODESTRIKE_DEFAULT_PROVIDER=.*/, `CODESTRIKE_DEFAULT_PROVIDER=${best.name}`)
          .replace(/CODESTRIKE_DEFAULT_MODEL=.*/, `CODESTRIKE_DEFAULT_MODEL=${best.model}`);
        writeFileSync(configPath, updated);
      } else {
        writeFileSync(configPath, existing.trimEnd() + '\n' + newLine + '\n');
      }

      process.env['CODESTRIKE_DEFAULT_PROVIDER'] = best.name;
      process.env['CODESTRIKE_DEFAULT_MODEL'] = best.model;
      console.log(chalk.green(`  ✓ Saved ${chalk.bold(best.displayName)} as default provider\n`));
    } else {
      console.log(chalk.dim('  Run with --set-default to save this selection.\n'));
    }
  });
