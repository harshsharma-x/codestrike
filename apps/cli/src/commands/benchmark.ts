import { Command } from 'commander';
import chalk from 'chalk';
import { ProviderRegistry } from '@codestrike/ai';
import { PROVIDER_INFO } from '@codestrike/shared';

interface BenchmarkResult {
  name: string;
  displayName: string;
  status: 'ok' | 'slow' | 'error' | 'skipped';
  time: number;
  model: string;
  free: boolean;
  error?: string;
}

export const benchmarkCommand = new Command('benchmark')
  .description('Benchmark all available AI providers')
  .option('-q, --quick', 'Quick mode — single short prompt')
  .option('-p, --provider <name>', 'Benchmark a specific provider only')
  .action(async (options: { quick?: boolean; provider?: string }) => {
    const registry = ProviderRegistry.getInstance();
    const testPrompt = options.quick ? 'Say "ok"' : 'Explain what recursion is in one sentence.';
    const results: BenchmarkResult[] = [];
    const all = registry.getAvailableProviders();

    console.log(chalk.bold('\n  📊 AI Provider Benchmark\n'));

    const providersToTest = options.provider
      ? all.filter(
          (p) =>
            p === options.provider ||
            PROVIDER_INFO[p]?.name.toLowerCase().includes(options.provider!.toLowerCase()),
        )
      : all;

    for (const name of providersToTest) {
      const info = PROVIDER_INFO[name];
      if (!info) {
        results.push({
          name,
          displayName: name,
          status: 'skipped',
          time: 0,
          model: '?',
          free: false,
          error: 'Unknown provider',
        });
        continue;
      }

      process.stdout.write(`  ${chalk.dim('→')} Testing ${chalk.bold(info.name)}... `);

      const provider = registry.get(name);
      const isConfigured = await provider.validateConfig();

      if (!isConfigured) {
        if (name === 'ollama' || name === 'lmstudio' || name === 'gguf') {
          process.stdout.write(chalk.dim('offline (local)\n'));
          results.push({
            name,
            displayName: info.name,
            status: 'error',
            time: 0,
            model: info.defaultModel,
            free: info.free,
            error: 'Not running locally',
          });
        } else {
          process.stdout.write(chalk.dim('no API key\n'));
          results.push({
            name,
            displayName: info.name,
            status: 'skipped',
            time: 0,
            model: info.defaultModel,
            free: info.free,
            error: 'API key not set',
          });
        }
        continue;
      }

      const start = Date.now();
      try {
        const response = await provider.complete({
          provider: name,
          model: info.defaultModel,
          messages: [{ role: 'user' as const, content: testPrompt }],
          maxTokens: 50,
          temperature: 0,
          stream: false,
        });
        const elapsed = Date.now() - start;
        const status = elapsed < 2000 ? 'ok' : elapsed < 5000 ? 'slow' : 'error';
        process.stdout.write(chalk.green(`${elapsed}ms\n`));
        results.push({
          name,
          displayName: info.name,
          status,
          time: elapsed,
          model: response.model || info.defaultModel,
          free: info.free,
        });
      } catch (e) {
        const elapsed = Date.now() - start;
        const msg = e instanceof Error ? e.message : 'Unknown';
        process.stdout.write(chalk.red(`failed (${elapsed}ms)\n`));
        results.push({
          name,
          displayName: info.name,
          status: 'error',
          time: elapsed,
          model: info.defaultModel,
          free: info.free,
          error: msg,
        });
      }
    }

    console.log(chalk.bold('\n  Results\n'));
    for (const r of results) {
      const icon =
        r.status === 'ok'
          ? chalk.green('✓')
          : r.status === 'slow'
            ? chalk.yellow('⚠')
            : chalk.red('✗');
      const timeStr = r.time > 0 ? chalk.dim(`${r.time}ms`) : chalk.dim('-');
      const modelStr = chalk.dim(r.model);
      const costStr = r.free ? chalk.green('Free') : chalk.yellow('Paid');
      const errorStr = r.error ? chalk.red(` ${r.error}`) : '';
      console.log(
        `  ${icon} ${chalk.bold(r.displayName)} ${timeStr} ${modelStr} ${costStr}${errorStr}`,
      );
    }

    const ok = results.filter((r) => r.status === 'ok');
    const slow = results.filter((r) => r.status === 'slow');

    console.log();
    if (ok.length > 0) {
      const fastest = results
        .filter((r) => r.status !== 'error' && r.status !== 'skipped')
        .sort((a, b) => a.time - b.time)[0];
      if (fastest) {
        console.log(chalk.green(`  ⚡ Fastest: ${fastest.displayName} (${fastest.time}ms)`));
      }
    }
    console.log(chalk.dim(`  ${ok.length + slow.length}/${results.length} providers responded`));
    console.log();
  });
