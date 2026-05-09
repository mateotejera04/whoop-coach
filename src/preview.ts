import type { DailySnapshot } from './whoop.js';
import { buildPlan, type Zone } from './planner.js';
import { formatMessage } from './formatter.js';
import { getWhoopDay } from './utils/date.js';

const FIXTURES: Record<Zone, DailySnapshot> = {
  high: {
    date: getWhoopDay(),
    recovery: 78,
    hrv: 44,
    restingHr: 58,
    sleepPerformance: 82,
    sleepDurationMin: 6 * 60 + 30,
    sleepDebtMin: 72,
    strain: 9.2,
  },
  medium: {
    date: getWhoopDay(),
    recovery: 52,
    hrv: 38,
    restingHr: 60,
    sleepPerformance: 74,
    sleepDurationMin: 6 * 60 + 5,
    sleepDebtMin: 95,
    strain: 11.3,
  },
  low: {
    date: getWhoopDay(),
    recovery: 22,
    hrv: 28,
    restingHr: 64,
    sleepPerformance: 58,
    sleepDurationMin: 5 * 60 + 20,
    sleepDebtMin: 145,
    strain: 8.4,
  },
  rest: {
    date: getWhoopDay(),
    recovery: 6,
    hrv: 21,
    restingHr: 68,
    sleepPerformance: 41,
    sleepDurationMin: 4 * 60 + 30,
    sleepDebtMin: 210,
    strain: 5.1,
  },
};

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return undefined;
  return process.argv[idx + 1];
}

function isZone(s: string | undefined): s is Zone {
  return s === 'high' || s === 'medium' || s === 'low' || s === 'rest';
}

const zoneArg = getArg('zone');
const strainArg = getArg('strain');

const zone: Zone = isZone(zoneArg) ? zoneArg : 'high';
if (zoneArg && !isZone(zoneArg)) {
  console.error(`Unknown zone "${zoneArg}". Use: high | medium | low | rest`);
  process.exit(1);
}

const snapshot: DailySnapshot = { ...FIXTURES[zone] };
if (strainArg !== undefined) {
  const n = Number(strainArg);
  if (Number.isNaN(n)) {
    console.error(`--strain must be a number, got "${strainArg}"`);
    process.exit(1);
  }
  snapshot.strain = n;
}

const plan = buildPlan(snapshot);
console.log(formatMessage(snapshot, plan));
