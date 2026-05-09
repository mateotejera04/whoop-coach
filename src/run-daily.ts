import { getTodaySnapshot } from './whoop.js';
import { buildPlan } from './planner.js';
import { formatMessage } from './formatter.js';
import { sendWhatsApp, type SendResult } from './sender.js';

export interface RunOptions {
  dryRun?: boolean;
}

export interface RunOutcome {
  message: string;
  sendResult?: SendResult;
}

export async function runDailyCoaching(opts: RunOptions = {}): Promise<RunOutcome> {
  const snapshot = await getTodaySnapshot();
  const plan = buildPlan(snapshot);
  const message = formatMessage(snapshot, plan);

  if (opts.dryRun) {
    return { message };
  }

  const sendResult = await sendWhatsApp(message);
  return { message, sendResult };
}
