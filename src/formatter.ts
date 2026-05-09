import type { DailySnapshot } from './whoop.js';
import type { TrainingPlan } from './planner.js';

function minutesToHm(min: number): string {
  if (min <= 0) return '0min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function weekdayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatMessage(
  snapshot: DailySnapshot,
  plan: TrainingPlan,
  today: Date = new Date()
): string {
  const lines: string[] = [];

  lines.push(`🏋️ WhoopCoach — ${weekdayName(today)} ${snapshot.date}`);
  lines.push('');
  lines.push('📊 Your metrics today');
  lines.push(`• Recovery: ${snapshot.recovery}%`);
  lines.push(`• HRV: ${Math.round(snapshot.hrv)}ms`);
  lines.push(`• Resting HR: ${snapshot.restingHr} bpm`);
  lines.push(
    `• Sleep: ${snapshot.sleepPerformance}% (${minutesToHm(snapshot.sleepDurationMin)})`
  );
  lines.push(`• Sleep debt: ${minutesToHm(snapshot.sleepDebtMin)}`);
  lines.push(`• Strain: ${snapshot.strain.toFixed(1)}`);
  lines.push('');
  lines.push(`${plan.zoneEmoji} Training zone: ${plan.zone.toUpperCase()}`);
  lines.push(plan.zoneRationale);

  if (plan.gym) {
    lines.push('');
    lines.push('💪 Gym');
    lines.push(`Focus: ${plan.gym.focusLabel}`);
    lines.push(`Intensity: ${plan.gym.intensity}`);
    lines.push('Exercises:');
    for (const ex of plan.gym.exercises) {
      lines.push(`  - ${ex}`);
    }
  }

  if (plan.running) {
    lines.push('');
    lines.push('🏃 Running');
    lines.push(`Type: ${plan.running.type}`);
    lines.push(`Distance: ${plan.running.distance}`);
    lines.push(`Zone: ${plan.running.zone}`);
    lines.push(plan.running.detail);
  }

  lines.push('');
  lines.push('💡 Tip of the day');
  lines.push(plan.tip);

  return lines.join('\n');
}
