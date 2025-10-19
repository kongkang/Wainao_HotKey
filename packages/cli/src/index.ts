#!/usr/bin/env node
import process from 'node:process';
import { runExport } from './commands/export';
import { runStatus } from './commands/status';

function showHelp() {
  console.log('Wainao CLI (placeholder)');
  console.log('Commands:');
  console.log('  status      显示索引与权限摘要');
  console.log('  export      导出当前索引');
}

async function handleStatus(): Promise<void> {
  await runStatus();
}

async function handleExport(args: string[]): Promise<void> {
  const options = parseExportArgs(args);
  await runExport(options);
}

function parseExportArgs(args: string[]) {
  const options: { format?: 'json' | 'csv'; includeConflicts?: boolean; out?: string } = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--format' && args[i + 1]) {
      options.format = args[i + 1] as 'json' | 'csv';
      i += 1;
    } else if (arg === '--out' && args[i + 1]) {
      options.out = args[i + 1];
      i += 1;
    } else if (arg === '--no-conflicts') {
      options.includeConflicts = false;
    }
  }
  return options;
}

async function run(): Promise<void> {
  const [, , command, ...rest] = process.argv;
  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'export':
      await handleExport(rest);
      break;
    case undefined:
    case 'help':
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('CLI execution failed:', error);
  process.exit(1);
});
