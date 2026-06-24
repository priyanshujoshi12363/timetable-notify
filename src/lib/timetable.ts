export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayName = (typeof DAYS)[number];

export interface Batch {
  batch: string;
  subject: string | null;
  faculty: string | null;
  room: string | null;
}

export interface Slot {
  time: string;
  subject: string | null;
  faculty: string | null;
  room: string | null;
  batches: Batch[];
}

export interface DaySchedule {
  day: DayName;
  slots: Slot[];
}

const DAY_ALIASES: Record<string, DayName> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  weds: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
};

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (["null", "none", "n/a", "na", "-", "--", "—"].includes(lower)) return null;
  return trimmed;
}

function normalizeBatches(input: unknown): Batch[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((b: any, i): Batch => ({
      batch: clean(b?.batch) ?? String(i + 1),
      subject: clean(b?.subject),
      faculty: clean(b?.faculty),
      room: clean(b?.room),
    }))
    .filter((b) => b.subject || b.faculty || b.room);
}

function normalizeSlot(input: any): Slot | null {
  const time = clean(input?.time);
  if (!time) return null;

  const batches = normalizeBatches(input?.batches);
  const subject = clean(input?.subject);

  if (!subject && batches.length === 0 && !clean(input?.faculty)) {
    return {
      time,
      subject: null,
      faculty: null,
      room: null,
      batches: [],
    };
  }

  return {
    time,
    subject,
    faculty: clean(input?.faculty),
    room: clean(input?.room),
    batches,
  };
}

export function normalizeSchedule(raw: unknown): DaySchedule[] {
  const days = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.schedule)
      ? (raw as any).schedule
      : [];

  const byDay = new Map<DayName, Slot[]>();

  for (const day of days) {
    const key = String(day?.day ?? "").trim().toLowerCase();
    const dayName = DAY_ALIASES[key];
    if (!dayName) continue;

    const slots = Array.isArray(day?.slots) ? day.slots : [];
    const existing = byDay.get(dayName) ?? [];
    for (const s of slots) {
      const slot = normalizeSlot(s);
      if (slot) existing.push(slot);
    }
    byDay.set(dayName, existing);
  }

  return DAYS.filter((d) => byDay.has(d)).map((d) => ({
    day: d,
    slots: byDay.get(d)!,
  }));
}
