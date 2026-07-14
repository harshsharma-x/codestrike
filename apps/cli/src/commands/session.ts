import { Command } from 'commander';
import chalk from 'chalk';

export const sessionCommand = new Command('session')
  .description('Manage chat sessions')
  .argument('[action]', 'Action: list, show, delete', 'list')
  .argument('[id]', 'Session ID')
  .action(async (action, id) => {
    console.log(chalk.dim('\n  Session management\n'));
    try {
      const { MemoryStore } = await import('@codestrike/memory');
      const store = new MemoryStore();
      if (action === 'list') {
        const sessions = store.listSessions();
        if (sessions.length === 0) {
          console.log(chalk.yellow('  No saved sessions'));
        } else {
          for (const s of sessions) {
            console.log(`  ${chalk.cyan(s.id)}  ${s.provider}/${s.model}  ${chalk.dim(s.created_at)}`);
          }
        }
      } else if (action === 'show') {
        if (!id) { console.log(chalk.red('  Session ID required')); return; }
        const session = store.getSession(id);
        if (!session) { console.log(chalk.red('  Session not found')); return; }
        console.log(chalk.cyan(`  Provider:`), session.provider);
        console.log(chalk.cyan(`  Model:`), session.model);
        console.log(chalk.cyan(`  Messages:`), session.messages.length);
      } else if (action === 'delete') {
        if (!id) { console.log(chalk.red('  Session ID required')); return; }
        store.deleteSession(id);
        console.log(chalk.green(`  Session ${id} deleted`));
      }
      store.close();
    } catch {
      console.log(chalk.yellow('  Memory system unavailable'));
    }
    console.log();
  });
