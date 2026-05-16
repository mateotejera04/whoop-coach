import 'dotenv/config';
import cron from 'node-cron';
import { runDailyCoaching } from './run-daily.js';

const CRON_TIME = process.env.CRON_TIME ?? '0 7 * * *';
const TZ = process.env.TZ ?? 'America/Argentina/Buenos_Aires';

if (!cron.validate(CRON_TIME)) {
  console.error(`Invalid CRON_TIME: "${CRON_TIME}"`);
  process.exit(1);
}

function ts(): string {
  return new Date().toISOString();
}

async function tick(): Promise<void> {
  console.log(`[${ts()}] tick — starting daily coaching run`);
  try {
    const { sendResult } = await runDailyCoaching();
    if (sendResult) {
      console.log(`[${ts()}] sent (sid=${sendResult.sid}, status=${sendResult.status})`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${ts()}] tick failed: ${msg}`);
  }
}

cron.schedule(CRON_TIME, tick, { timezone: TZ });

console.log('whoop-coach scheduler started');
console.log(`  schedule: ${CRON_TIME}`);
console.log(`  timezone: ${TZ}`);
console.log("  next run will fire at the configured cron time; use 'npm run send-now' to test now");
