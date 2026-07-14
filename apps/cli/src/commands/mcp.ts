import { Command } from 'commander';
import chalk from 'chalk';
import { MCPRegistry } from '@codestrike/mcp';
import { MCPServerConfigSchema } from '@codestrike/core';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'os';
import { homedir } from 'os';

function getConfigPath(): string {
  return join(homedir(), '.codestrike', 'config.json');
}

function loadConfig(): { mcpServers?: any[] } {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) return {};
  try { return JSON.parse(readFileSync(configPath, 'utf-8')); } catch { return {}; }
}

function saveConfig(config: any): void {
  const configPath = getConfigPath();
  const dir = join(homedir(), '.codestrike');
  if (!existsSync(dir)) { import('fs').then(fs => fs.mkdirSync(dir, { recursive: true })); }
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export const mcpCommand = new Command('mcp')
  .description('Manage MCP (Model Context Protocol) servers');

mcpCommand
  .command('list')
  .description('List configured MCP servers')
  .action(async () => {
    const config = loadConfig();
    const servers = config.mcpServers || [];

    if (servers.length === 0) {
      console.log(chalk.dim('\n  No MCP servers configured\n'));
      return;
    }

    console.log(chalk.cyan('\n  MCP Servers:\n'));
    for (const server of servers) {
      console.log(`  ${chalk.green(server.name)}`);
      console.log(`    Transport: ${server.transport}`);
      console.log(`    ${server.transport === 'stdio' ? 'Command: ' + (server.command || '') : 'URL: ' + (server.url || '')}`);
      console.log(`    Enabled: ${server.enabled !== false ? chalk.green('yes') : chalk.red('no')}`);
      console.log();
    }
  });

mcpCommand
  .command('add')
  .description('Add an MCP server')
  .requiredOption('-n, --name <name>', 'Server name')
  .option('-d, --description <desc>', 'Server description')
  .requiredOption('-t, --transport <transport>', 'Transport type (stdio or http)')
  .option('-c, --command <command>', 'Command for stdio transport')
  .option('-a, --args <args>', 'Command arguments (comma-separated)')
  .option('-u, --url <url>', 'URL for HTTP transport')
  .option('-e, --env <env>', 'Environment variables (KEY=VAL,KEY2=VAL2)')
  .action(async (options) => {
    const config = loadConfig();
    const servers = config.mcpServers || [];

    if (servers.find((s: any) => s.name === options.name)) {
      console.log(chalk.red(`\n  Server "${options.name}" already exists\n`));
      return;
    }

    const env: Record<string, string> = {};
    if (options.env) {
      for (const pair of options.env.split(',')) {
        const [k, ...v] = pair.split('=');
        if (k) env[k.trim()] = v.join('=').trim();
      }
    }

    const server: Record<string, any> = {
      name: options.name,
      description: options.description || '',
      transport: options.transport,
      enabled: true,
    };

    if (options.transport === 'stdio') {
      if (!options.command) {
        console.log(chalk.red('\n  --command is required for stdio transport\n'));
        return;
      }
      server.command = options.command;
      server.args = options.args ? options.args.split(',').map((a: string) => a.trim()) : [];
    } else {
      if (!options.url) {
        console.log(chalk.red('\n  --url is required for HTTP transport\n'));
        return;
      }
      server.url = options.url;
    }

    if (Object.keys(env).length > 0) server.env = env;

    servers.push(server);
    config.mcpServers = servers;
    saveConfig(config);

    console.log(chalk.green(`\n  MCP server "${options.name}" added\n`));
  });

mcpCommand
  .command('remove')
  .description('Remove an MCP server')
  .requiredOption('-n, --name <name>', 'Server name')
  .action(async (options) => {
    const config = loadConfig();
    const servers = (config.mcpServers || []).filter((s: any) => s.name !== options.name);

    if (servers.length === (config.mcpServers || []).length) {
      console.log(chalk.red(`\n  Server "${options.name}" not found\n`));
      return;
    }

    config.mcpServers = servers;
    saveConfig(config);
    console.log(chalk.green(`\n  MCP server "${options.name}" removed\n`));
  });

mcpCommand
  .command('test')
  .description('Test connection to an MCP server')
  .requiredOption('-n, --name <name>', 'Server name')
  .action(async (options) => {
    const config = loadConfig();
    const serverConfig = (config.mcpServers || []).find((s: any) => s.name === options.name);

    if (!serverConfig) {
      console.log(chalk.red(`\n  Server "${options.name}" not found\n`));
      return;
    }

    console.log(chalk.cyan(`\n  Testing connection to "${options.name}"...\n`));

    try {
      const parsed = MCPServerConfigSchema.parse(serverConfig);
      const registry = MCPRegistry.getInstance();
      await registry.initialize([parsed]);
      const client = registry.getClient(options.name);

      if (!client) {
        console.log(chalk.red('  Failed to connect\n'));
        return;
      }

      const tools = await client.listTools();
      console.log(chalk.green('  Connected successfully!\n'));
      console.log(`  Tools available: ${tools.length}`);
      for (const tool of tools) {
        console.log(`    - ${tool.name}: ${tool.description}`);
      }
      console.log();

      await registry.disconnectAll();
    } catch (error) {
      console.log(chalk.red(`  Connection failed: ${error instanceof Error ? error.message : String(error)}\n`));
    }
  });
