/**
 * myvcs down - Stop the myvcs platform
 *
 * Gracefully stops all myvcs services:
 * - API server
 * - Web UI
 * - Database (optional)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { colors } from '../utils/colors';

export const DOWN_HELP = `
myvcs down - Stop the myvcs platform

Usage: myvcs down [options]

Options:
  --keep-db       Don't stop the database
  --remove-data   Remove all data (DESTRUCTIVE)
  -h, --help      Show this help message

Examples:
  myvcs down                  Stop all services
  myvcs down --keep-db        Stop but keep database running
  myvcs down --remove-data    Stop and delete all data
`;

const WIT_DIR = path.join(os.homedir(), '.myvcs');
const PID_FILE = path.join(WIT_DIR, 'myvcs.pid');

export async function handleDown(args: string[]): Promise<void> {
  if (args.includes('-h') || args.includes('--help')) {
    console.log(DOWN_HELP);
    return;
  }

  const keepDb = args.includes('--keep-db');
  const removeData = args.includes('--remove-data');

  console.log(colors.bold('\n🛑 Stopping myvcs platform...\n'));

  // Load PID file
  let pids: Record<string, any> = {};
  if (fs.existsSync(PID_FILE)) {
    try {
      pids = JSON.parse(fs.readFileSync(PID_FILE, 'utf-8'));
    } catch {
      // Invalid PID file
    }
  }

  let stoppedSomething = false;

  // Stop web UI
  if (pids.web) {
    try {
      process.kill(pids.web, 'SIGTERM');
      console.log(colors.green('  ✓ Web UI stopped'));
      stoppedSomething = true;
    } catch {
      console.log(colors.dim('  Web UI was not running'));
    }
  }

  // Stop server
  if (pids.server) {
    try {
      process.kill(pids.server, 'SIGTERM');
      console.log(colors.green('  ✓ API server stopped'));
      stoppedSomething = true;
    } catch {
      console.log(colors.dim('  API server was not running'));
    }
  }

  // Stop database
  if (!keepDb) {
    try {
      execSync('docker stop myvcs-postgres 2>/dev/null', { stdio: 'ignore' });
      execSync('docker rm myvcs-postgres 2>/dev/null', { stdio: 'ignore' });
      console.log(colors.green('  ✓ Database stopped'));
      stoppedSomething = true;
    } catch {
      console.log(colors.dim('  Database was not running'));
    }
  } else {
    console.log(colors.dim('  Database kept running (--keep-db)'));
  }

  // Remove PID file
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }

  // Remove data if requested
  if (removeData) {
    console.log();
    console.log(colors.yellow('  ⚠️  Removing all data...'));
    
    if (fs.existsSync(WIT_DIR)) {
      fs.rmSync(WIT_DIR, { recursive: true, force: true });
      console.log(colors.green('  ✓ Data removed'));
    }
  }

  if (stoppedSomething) {
    console.log(colors.green('\n✓ myvcs stopped\n'));
  } else {
    console.log(colors.dim('\n  myvcs was not running\n'));
  }
}



