import prisma from '@/lib/prisma';

export const DAILY_SLOTS_STATE_KEY = 'daily_slots_state';
export const EXPERT_SPOTS_RESET_VALUE = 12;
export const EXPERT_SPOTS_ROLLOVER_THRESHOLD = 8;

export type DailySlotsState = {
  dayKey: string;
  remaining: number;
  defaultSpots: number;
};

const getUkDayKey = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

/** If spots < 8 at UK day boundary, reset to default (12); otherwise carry forward. */
export function applyExpertSpotsDayRollover(
  previousRemaining: number,
  defaultSpots: number = EXPERT_SPOTS_RESET_VALUE,
): number {
  const normalizedDefault = Math.max(1, Math.floor(Number(defaultSpots) || EXPERT_SPOTS_RESET_VALUE));
  const normalizedPrevious = Math.max(
    0,
    Math.floor(Number(previousRemaining) || normalizedDefault),
  );
  if (normalizedPrevious < EXPERT_SPOTS_ROLLOVER_THRESHOLD) {
    return normalizedDefault;
  }
  return normalizedPrevious;
}

export async function readDailySlotsState(): Promise<DailySlotsState> {
  const dayKey = getUkDayKey();
  const row = await prisma.siteContent.findUnique({
    where: { key: DAILY_SLOTS_STATE_KEY },
  });
  if (!row?.value) {
    const initial = {
      dayKey,
      remaining: EXPERT_SPOTS_RESET_VALUE,
      defaultSpots: EXPERT_SPOTS_RESET_VALUE,
    };
    await writeDailySlotsState(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(row.value) as DailySlotsState;
    const defaultSpots = Math.max(
      1,
      Number(parsed.defaultSpots) || EXPERT_SPOTS_RESET_VALUE,
    );
    if (parsed.dayKey !== dayKey) {
      const previousRemaining = Math.max(
        0,
        Math.floor(Number(parsed.remaining) ?? defaultSpots),
      );
      const rolled = {
        dayKey,
        remaining: applyExpertSpotsDayRollover(previousRemaining, defaultSpots),
        defaultSpots,
      };
      await writeDailySlotsState(rolled);
      return rolled;
    }
    const remaining = Math.max(
      0,
      Math.min(defaultSpots, Math.floor(Number(parsed.remaining) || defaultSpots))
    );
    return { dayKey, remaining, defaultSpots };
  } catch {
    const fallback = {
      dayKey,
      remaining: EXPERT_SPOTS_RESET_VALUE,
      defaultSpots: EXPERT_SPOTS_RESET_VALUE,
    };
    await writeDailySlotsState(fallback);
    return fallback;
  }
}

export async function writeDailySlotsState(state: DailySlotsState) {
  await prisma.siteContent.upsert({
    where: { key: DAILY_SLOTS_STATE_KEY },
    update: { value: JSON.stringify(state), type: 'json' },
    create: {
      key: DAILY_SLOTS_STATE_KEY,
      value: JSON.stringify(state),
      type: 'json',
    },
  });
}

export async function syncDailySlotsDefault(defaultSpots: number) {
  const normalized = Math.max(1, Math.floor(Number(defaultSpots) || 12));
  const current = await readDailySlotsState();
  const dayKey = getUkDayKey();
  const remaining =
    current.dayKey !== dayKey || current.defaultSpots !== normalized
      ? normalized
      : Math.min(current.remaining, normalized);
  await writeDailySlotsState({
    dayKey,
    remaining,
    defaultSpots: normalized,
  });
}

export async function decrementDailySlots(): Promise<DailySlotsState> {
  const state = await readDailySlotsState();
  const next = Math.max(0, state.remaining - 1);
  const updated = { ...state, remaining: next };
  await writeDailySlotsState(updated);
  return updated;
}
