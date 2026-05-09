import 'dotenv/config';
import { getTodaySnapshot } from './whoop.js';
import { buildPlan } from './planner.js';
import { formatMessage } from './formatter.js';
import { sendWhatsApp } from './sender.js';
import { handleError } from './utils/errors.js';

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main(): Promise<void> {
  const dryRun = hasFlag('dry-run');

  const snapshot = await getTodaySnapshot();
  const plan = buildPlan(snapshot);
  const message = formatMessage(snapshot, plan);

  if (dryRun) {
    console.log(message);
    return;
  }

  try {
    const result = await sendWhatsApp(message);
    console.log(`Sent (sid=${result.sid}, status=${result.status})`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`First send attempt failed: ${msg}. Retrying once...`);
    const result = await sendWhatsApp(message);
    console.log(`Sent (sid=${result.sid}, status=${result.status})`);
  }
}

main().catch(handleError);
