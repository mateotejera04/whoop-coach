import type { DailySnapshot } from './whoop.js';

export type Zone = 'high' | 'medium' | 'low' | 'rest';

export type GymFocus =
  | 'chest+triceps'
  | 'back+biceps'
  | 'legs'
  | 'shoulders+core'
  | 'full-body'
  | 'mobility'
  | 'rest';

export interface GymPlan {
  focus: GymFocus;
  focusLabel: string;
  intensity: string;
  exercises: string[];
}

export interface RunningPlan {
  type: string;
  distance: string;
  zone: string;
  detail: string;
}

export interface TrainingPlan {
  zone: Zone;
  zoneEmoji: string;
  zoneRationale: string;
  gym: GymPlan | null;
  running: RunningPlan | null;
  tip: string;
}

const ZONE_EMOJI: Record<Zone, string> = {
  high: '🟢',
  medium: '🟡',
  low: '🟠',
  rest: '🔴',
};

const FOCUS_LABEL: Record<GymFocus, string> = {
  'chest+triceps': 'Chest + triceps',
  'back+biceps': 'Back + biceps',
  legs: 'Legs',
  'shoulders+core': 'Shoulders + core',
  'full-body': 'Full body',
  mobility: 'Mobility + core',
  rest: 'Rest',
};

const EXERCISES_BY_FOCUS: Record<GymFocus, string[]> = {
  'chest+triceps': ['Bench press', 'Incline press', 'Dips', 'Tricep extensions'],
  'back+biceps': ['Pull-ups', 'Barbell row', 'Lat pulldown', 'Bicep curls'],
  legs: ['Squat', 'Romanian deadlift', 'Leg press', 'Calf raises'],
  'shoulders+core': ['Overhead press', 'Lateral raises', 'Face pulls', 'Hanging leg raises'],
  'full-body': ['Deadlift', 'Front squat', 'Pull-ups', 'Push press'],
  mobility: ['Hip openers', 'Thoracic rotations', 'Foam rolling', 'Plank variations'],
  rest: [],
};

const INTENSITY_BY_ZONE: Record<Exclude<Zone, 'rest'>, string> = {
  high: '80% RM · 4 sets x 6-8 reps',
  medium: '70% RM · 3 sets x 10-12 reps',
  low: '60% RM · 2-3 sets x 12-15 reps',
};

const RUNNING_BY_ZONE: Record<Exclude<Zone, 'rest'>, RunningPlan> = {
  high: {
    type: 'Intervals / Tempo',
    distance: '8-12 km',
    zone: 'Zone 4-5 (anaerobic threshold)',
    detail: '1km repeats at 90% HRmax with 90s recovery, or 6-8km continuous tempo',
  },
  medium: {
    type: 'Easy run',
    distance: '6-8 km',
    zone: 'Zone 3 (aerobic)',
    detail: 'Conversational pace, steady effort',
  },
  low: {
    type: 'Zone 2 jog',
    distance: '4-5 km',
    zone: 'Zone 2 (low aerobic)',
    detail: 'Nasal-breathing pace, recovery-oriented',
  },
};

const TIP_BY_ZONE: Record<Zone, string> = {
  high: 'Perfect day to go for a PR or test a new load.',
  medium: 'Solid baseline day — execute the plan, don\'t chase records.',
  low: 'Body is asking for restraint. Keep volume low and form sharp.',
  rest: 'Full rest. Hydrate, sleep, and let the system rebuild.',
};

const SPLIT_BY_WEEKDAY: Record<number, GymFocus> = {
  0: 'rest',
  1: 'chest+triceps',
  2: 'back+biceps',
  3: 'legs',
  4: 'shoulders+core',
  5: 'full-body',
  6: 'mobility',
};

function pickZone(recovery: number, sleepPerformance: number): Zone {
  if (recovery >= 67 && sleepPerformance >= 70) return 'high';
  if (recovery >= 34) return 'medium';
  if (recovery >= 10) return 'low';
  return 'rest';
}

function buildRationale(zone: Zone, recovery: number, sleepPerformance: number): string {
  switch (zone) {
    case 'high':
      return `Recovery ${recovery}% and sleep ${sleepPerformance}% — body is ready for high load`;
    case 'medium':
      return `Recovery ${recovery}% — solid baseline, push within reason`;
    case 'low':
      return `Recovery ${recovery}% — keep it light, prioritize technique`;
    case 'rest':
      return `Recovery ${recovery}% — full rest day`;
  }
}

export function buildPlan(snapshot: DailySnapshot, today: Date = new Date()): TrainingPlan {
  const zone = pickZone(snapshot.recovery, snapshot.sleepPerformance);
  const zoneEmoji = ZONE_EMOJI[zone];
  const zoneRationale = buildRationale(zone, snapshot.recovery, snapshot.sleepPerformance);

  let gym: GymPlan | null = null;
  if (zone !== 'rest') {
    const focus = SPLIT_BY_WEEKDAY[today.getDay()];
    if (focus !== 'rest') {
      gym = {
        focus,
        focusLabel: FOCUS_LABEL[focus],
        intensity: INTENSITY_BY_ZONE[zone],
        exercises: EXERCISES_BY_FOCUS[focus],
      };
    }
  }

  let running: RunningPlan | null = null;
  if (zone !== 'rest') {
    running = RUNNING_BY_ZONE[zone];
    if (snapshot.strain > 14 && zone !== 'high') {
      running = null;
    }
  }

  return {
    zone,
    zoneEmoji,
    zoneRationale,
    gym,
    running,
    tip: TIP_BY_ZONE[zone],
  };
}
