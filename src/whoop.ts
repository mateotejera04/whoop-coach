export * from './api/client.js';
export * from './types/whoop.js';

import { getRecovery, getSleep, getCycle } from './api/client.js';
import { WhoopError, ExitCode } from './utils/errors.js';
import { analyzeTrends, type TrendData } from './utils/analysis.js';
import type { WhoopRecovery, WhoopSleep } from './types/whoop.js';

export interface DailySnapshot {
  date: string;
  recovery: number;
  hrv: number;
  restingHr: number;
  sleepPerformance: number;
  sleepDurationMin: number;
  sleepDebtMin: number;
  strain: number;
}

function pickLatest<T extends { updated_at?: string; created_at?: string }>(records: T[]): T | undefined {
  if (!records.length) return undefined;
  return [...records].sort((a, b) => {
    const ta = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
    return tb - ta;
  })[0];
}

export async function getTodaySnapshot(): Promise<DailySnapshot> {
  const cycles = await getCycle({ limit: 1 });
  const cycle = cycles[0];
  if (!cycle) {
    throw new WhoopError('No WHOOP cycle data available', ExitCode.GENERAL_ERROR);
  }

  const params = {
    start: cycle.start,
    end: cycle.end ?? new Date().toISOString(),
  };

  const [recoveryArr, sleepArr] = await Promise.all([
    getRecovery(params),
    getSleep(params),
  ]);

  const recovery: WhoopRecovery | undefined = pickLatest(recoveryArr);
  const sleep: WhoopSleep | undefined = pickLatest(sleepArr.filter((s) => !s.nap));

  const sleepStage = sleep?.score?.stage_summary;
  const sleepInBedMs = sleepStage?.total_in_bed_time_milli ?? 0;
  const awakeMs = sleepStage?.total_awake_time_milli ?? 0;
  const sleepDurationMin = Math.round((sleepInBedMs - awakeMs) / 60000);

  const need = sleep?.score?.sleep_needed;
  const sleepDebtMin = need ? Math.round(need.need_from_sleep_debt_milli / 60000) : 0;

  const embeddedRecovery = cycle.recovery;

  return {
    date: cycle.start.slice(0, 10),
    recovery: recovery?.score?.recovery_score ?? embeddedRecovery?.recovery_score ?? 0,
    hrv: recovery?.score?.hrv_rmssd_milli ?? embeddedRecovery?.hrv_rmssd_milli ?? 0,
    restingHr: recovery?.score?.resting_heart_rate ?? embeddedRecovery?.resting_heart_rate ?? 0,
    sleepPerformance: sleep?.score?.sleep_performance_percentage ?? 0,
    sleepDurationMin,
    sleepDebtMin,
    strain: cycle.score?.strain ?? 0,
  };
}

export async function getTrends(days: number = 7): Promise<TrendData> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const params = { start: start.toISOString(), end: end.toISOString() };
  const [recovery, sleep, cycle] = await Promise.all([
    getRecovery(params, true),
    getSleep(params, true),
    getCycle(params, true),
  ]);
  return analyzeTrends(recovery, sleep, cycle, days);
}
