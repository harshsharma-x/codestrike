#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { chatCommand } from './commands/chat';
import { modelsCommand } from './commands/models';
import { doctorCommand } from './commands/doctor';
import { configCommand } from './commands/config';
import { indexCommand } from './commands/index';
import { reviewCommand } from './commands/review';
import { commitCommand } from './commands/commit';
import { explainCommand } from './commands/explain';
import { debugCommand } from './commands/debug';
import { fixCommand } from './commands/fix';
import { testCommand } from './commands/test';
import { docsCommand } from './commands/docs';
import { searchCommand } from './commands/search';
import { statusCommand } from './commands/status';
import { runCommand } from './commands/run';
import { loginCommand } from './commands/login';
import { terminalCommand } from './commands/terminal';
import { sessionCommand } from './commands/session';
import { providersCommand } from './commands/providers';
import { agentCommand } from './commands/agent';
import { memoryCommand } from './commands/memory';
import { pluginsCommand } from './commands/plugins';
import { updateCommand } from './commands/update';
import { mcpCommand } from './commands/mcp';

const pkgVersion = '0.1.0';

const program = new Command();

program
  .name('codestrike')
  .description('CodeStrike AI - Your AI-powered coding assistant')
  .version(pkgVersion)
  .usage('<command> [options]');

program.addCommand(initCommand);
program.addCommand(chatCommand);
program.addCommand(modelsCommand);
program.addCommand(doctorCommand);
program.addCommand(configCommand);
program.addCommand(indexCommand);
program.addCommand(reviewCommand);
program.addCommand(commitCommand);
program.addCommand(explainCommand);
program.addCommand(debugCommand);
program.addCommand(fixCommand);
program.addCommand(testCommand);
program.addCommand(docsCommand);
program.addCommand(searchCommand);
program.addCommand(statusCommand);
program.addCommand(runCommand);
program.addCommand(loginCommand);
program.addCommand(terminalCommand);
program.addCommand(sessionCommand);
program.addCommand(providersCommand);
program.addCommand(agentCommand);
program.addCommand(memoryCommand);
program.addCommand(pluginsCommand);
program.addCommand(updateCommand);
program.addCommand(mcpCommand);

program.on('command:*', () => {
  console.error(chalk.red('Invalid command:'), program.args.join(' '));
  console.log();
  program.help();
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}
