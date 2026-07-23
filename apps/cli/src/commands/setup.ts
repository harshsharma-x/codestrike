import { Command } from 'commander';
import chalk from 'chalk';
import { loginWithGitHub, loginWithGoogle, markSetupComplete, saveApiKey } from '../utils/auth';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createInterface } from 'readline';

const ART = chalk.cyan(`
   ╔══════════════════════════════════════════════════╗
   ║                                                  ║
   ║     ██████╗ ██████╗ ██████╗ ███████╗            ║
   ║    ██╔════╝██╔═══██╗██╔══██╗██╔════╝            ║
   ║    ██║     ██║   ██║██║  ██║█████╗              ║
   ║    ██║     ██║   ██║██║  ██║██╔══╝              ║
   ║    ╚██████╗╚██████╔╝██████╔╝███████╗            ║
   ║     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝            ║
   ║                                                  ║
   ║       ${chalk.bold('CodeStrike AI')}${'                    '}
   ║       ${chalk.dim('Your AI-powered coding assistant')}${'          '}
   ║                                                  ║
   ╚══════════════════════════════════════════════════╝
`);

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(chalk.cyan(`  ${question}: `), (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function confirm(question: string): Promise<boolean> {
  return prompt(`${question} ${chalk.dim('(Y/n)')}`).then((a) => a.toLowerCase() !== 'n');
}

export const setupCommand = new Command('setup')
  .description('Run the initial setup wizard')
  .action(async () => {
    console.log(ART);
    console.log(chalk.cyan("  Welcome to CodeStrike AI! Let's get you set up.\n"));

    // Step 1: Authentication
    console.log(chalk.bold('  Step 1: Authentication'));
    console.log(chalk.dim('  Connect your GitHub or Google account.\n'));

    const wantsAuth = await confirm('  Would you like to authenticate?');
    if (wantsAuth) {
      const method = await prompt('  Choose provider (github/google)');
      try {
        if (method === 'github') {
          const token = await loginWithGitHub();
          console.log(chalk.green(`\n  ✓ Authenticated as ${chalk.bold(token.userInfo.name)}\n`));
        } else if (method === 'google') {
          const token = await loginWithGoogle();
          console.log(chalk.green(`\n  ✓ Authenticated as ${chalk.bold(token.userInfo.name)}\n`));
        } else {
          console.log(chalk.yellow('  Skipping authentication.\n'));
        }
      } catch (e: any) {
        console.log(chalk.yellow(`  ⚠ ${e.message || 'Auth failed, continuing without...'}\n`));
      }
    }

    // Step 2: API Keys
    console.log(chalk.bold('  Step 2: API Keys'));
    console.log(chalk.dim('  Configure AI provider API keys.\n'));

    const providers = [
      { name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY' },
      { name: 'Groq', envKey: 'GROQ_API_KEY' },
      { name: 'Anthropic', envKey: 'ANTHROPIC_API_KEY' },
      { name: 'OpenAI', envKey: 'OPENAI_API_KEY' },
    ];

    for (const p of providers) {
      const wantsKey = await confirm(`  Configure ${chalk.bold(p.name)}?`);
      if (wantsKey) {
        const key = await prompt(`  Enter your ${p.name} API key`);
        if (key) {
          saveApiKey(p.name.toLowerCase(), key, false);
          const envPath = join(homedir(), '.codestrike', '.env');
          try {
            mkdirSync(join(homedir(), '.codestrike'), { recursive: true });
            appendFileSync(envPath, `\n${p.envKey}=${key}`, 'utf-8');
          } catch {
            /* non-fatal */
          }
          console.log(chalk.green(`  ✓ ${p.name} key saved\n`));
        }
      }
    }

    // Step 3: Initialize project
    console.log(chalk.bold('  Step 3: Project Setup'));
    console.log(chalk.dim('  Initialize CodeStrike in your project.\n'));

    const cwd = process.cwd();
    if (existsSync(join(cwd, 'codestrike.json'))) {
      console.log(chalk.dim('  codestrike.json already exists.\n'));
    } else {
      const wantsInit = await confirm('  Initialize CodeStrike in this directory?');
      if (wantsInit) {
        const { initCommand } = await import('./init');
        await initCommand.parseAsync(['node', 'init', '-y']);
        console.log();
      }
    }

    // Step 4: Default model
    console.log(chalk.bold('  Step 4: Default Model'));
    console.log(chalk.dim('  Choose your preferred AI model.\n'));

    const model = await prompt(`  Default model ${chalk.dim('(mixtral-8x7b)')}`);
    if (model) {
      const envPath = join(homedir(), '.codestrike', '.env');
      try {
        mkdirSync(join(homedir(), '.codestrike'), { recursive: true });
        appendFileSync(envPath, `\nCODESTRIKE_DEFAULT_MODEL=${model}`, 'utf-8');
      } catch {
        /* non-fatal */
      }
    }

    markSetupComplete();
    console.log();
    console.log(chalk.green('  ┌─────────────────────────────────────────────────────┐'));
    console.log(
      chalk.green('  │') +
        chalk.bold('  Setup Complete!') +
        '                                  ' +
        chalk.green('│'),
    );
    console.log(chalk.green('  ├─────────────────────────────────────────────────────┤'));
    console.log(
      chalk.green('  │') +
        chalk.dim('  Run ') +
        chalk.cyan('codestrike') +
        chalk.dim(' to start the AI chat') +
        '              ' +
        chalk.green('│'),
    );
    console.log(
      chalk.green('  │') +
        chalk.dim('  Run ') +
        chalk.cyan('codestrike --help') +
        chalk.dim(' for all commands') +
        '          ' +
        chalk.green('│'),
    );
    console.log(chalk.green('  └─────────────────────────────────────────────────────┘'));
    console.log();
  });
