import prisma from '@/lib/prisma';

export const DAILY_SLOTS_STATE_KEY = 'daily_slots_state';

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

export async function readDailySlotsState(): Promise<DailySlotsState> {
  const dayKey = getUkDayKey();
  const row = await prisma.siteContent.findUnique({
    where: { key: DAILY_SLOTS_STATE_KEY },
  });
  if (!row?.value) {
    return { dayKey, remaining: 12, defaultSpots: 12 };
  }
  try {
    const parsed = JSON.parse(row.value) as DailySlotsState;
    const defaultSpots = Math.max(1, Number(parsed.defaultSpots) || 12);
    if (parsed.dayKey !== dayKey) {
      return { dayKey, remaining: defaultSpots, defaultSpots };
    }
    const remaining = Math.max(
      0,
      Math.min(defaultSpots, Math.floor(Number(parsed.remaining) || defaultSpots))
    );
    return { dayKey, remaining, defaultSpots };
  } catch {
    return { dayKey, remaining: 12, defaultSpots: 12 };
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
