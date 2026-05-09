import 'dotenv/config';
import { getTodaySnapshot } from './whoop.js';
import { buildPlan } from './planner.js';
import { formatMessage } from './formatter.js';
import { handleError } from './utils/errors.js';

async function main(): Promise<void> {
  const snapshot = await getTodaySnapshot();
  const plan = buildPlan(snapshot);
  console.log(formatMessage(snapshot, plan));
}

main().catch(handleError);
