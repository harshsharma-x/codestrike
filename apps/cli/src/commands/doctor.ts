import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { ProviderRegistry } from '@codestrike/ai';
import { PROVIDER_INFO } from '@codestrike/shared';

export const doctorCommand = new Command('doctor')
  .description('Check system health and configuration')
  .action(async () => {
    console.log(chalk.bold('\n  🔍 CodeStrike Diagnostics\n'));

    let allGood = true;

    const checks: { name: string; status: boolean; message: string }[] = [];

    // Node version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    const nodeOk = nodeMajor >= 18;
    checks.push({
      name: 'Node.js version',
      status: nodeOk,
      message: `${nodeVersion} ${nodeOk ? '' : '(minimum 18 required)'}`,
    });

    // Git
    try {
      execSync('git --version', { stdio: 'pipe' });
      checks.push({ name: 'Git installed', status: true, message: '✓' });
    } catch {
      checks.push({ name: 'Git installed', status: false, message: '✗ Not found' });
      allGood = false;
    }

    // Config file
    const configExists = existsSync('codestrike.json');
    checks.push({
      name: 'codestrike.json',
      status: configExists,
      message: configExists ? '✓ Found' : '✗ Not found (run codestrike init)',
    });

    // API Keys
    for (const [provider, info] of Object.entries(PROVIDER_INFO)) {
      if (provider === 'ollama' || provider === 'lmstudio') continue;
      const key = process.env[info.envKey || `${provider.toUpperCase()}_API_KEY`];
      checks.push({
        name: `${info.name} API key`,
        status: !!key,
        message: key ? '✓ Set' : `✗ Not set (${info.envKey})`,
      });
      if (!key) allGood = false;
    }

    // Ollama
    try {
      execSync('ollama --version', { stdio: 'pipe' });
      checks.push({ name: 'Ollama', status: true, message: '✓ Installed' });
    } catch {
      checks.push({ name: 'Ollama', status: false, message: '✗ Not installed (optional)' });
    }

    for (const check of checks) {
      const icon = check.status ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${icon} ${check.name}: ${check.status ? chalk.dim(check.message) : chalk.red(check.message)}`);
    }

    console.log();
    if (allGood) {
      console.log(chalk.green('  ✓ All checks passed! CodeStrike is ready.\n'));
    } else {
      console.log(chalk.yellow('  ⚠ Some checks failed. Review the issues above.\n'));
    }
  });
