import { type DayName, type DaySchedule, type Slot, type Batch } from "@/lib/timetable";

export interface TimetableMeta {
  division: string | null;
  semester: number | null;
  academicYear: string | null;
  program: string | null;
  effectiveFrom: string | null;
}

export interface ParsedTimetable {
  meta: TimetableMeta;
  schedule: DaySchedule[];
}

interface Item {
  x: number;
  y: number;
  text: string;
}

const DAY_LOOKUP: Record<string, DayName> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

const TIME_RE = /\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/;
const ROOM_RE = /\b([A-Z]{1,3}-\d{2,4})\b/;
const PLAIN_SUBJECTS = ["LIBRARY/SELF STUDY", "SELF STUDY", "LIBRARY", "CODE CHEF", "HOLIDAY"];

async function extractItems(data: Uint8Array): Promise<Item[]> {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();

  const items: Item[] = [];
  for (const it of tc.items as any[]) {
    const text = (it.str ?? "").replace(/\s+/g, " ").trim();
    if (text) items.push({ x: it.transform[4], y: it.transform[5], text });
  }
  await doc.destroy();

  if (!items.length) {
    throw new Error("No selectable text found — this PDF looks scanned, not a digital export.");
  }
  return items;
}

function parseMeta(headerText: string): TimetableMeta {
  const grab = (re: RegExp) => {
    const m = headerText.match(re);
    return m ? m[1].trim() : null;
  };

  const semStr = grab(/SEMESTER\s*:?\s*([0-9]+)\s*(?:ST|ND|RD|TH)?/i);

  const rawDivision = grab(/DIVISION\s*:?\s*([A-Z0-9_]+)/i);
  const division = rawDivision
    ? rawDivision.includes("_")
      ? rawDivision.split("_").filter(Boolean).pop()!
      : rawDivision
    : null;

  return {
    division,
    semester: semStr ? Number(semStr) : null,
    academicYear:
      grab(/ACADEMIC\s*YEAR\s*:?\s*([0-9]{2,4}\s*-\s*[0-9]{2,4})/i)?.replace(/\s+/g, "") ?? null,
    program: grab(/PROGRAM\s*NAME\s*:?\s*([A-Z0-9.&,\- ]+?)\s+(?:DIVISION|YEAR|LEVEL)/i),
    effectiveFrom: grab(/EFFECTIVE\s*FROM\s*:?\s*([0-9]{1,2}-[0-9]{1,2}-[0-9]{2,4})/i),
  };
}

interface ParsedEntry {
  batch: string | null;
  subject: string | null;
  faculty: string | null;
  room: string | null;
}

export function parseCellEntry(raw: string): ParsedEntry | null {
  const text = raw.replace(/([A-Za-z])-\s+/g, "$1-").replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (/RECESS/i.test(text)) return null;

  const upper = text.toUpperCase();
  const plain = PLAIN_SUBJECTS.find((p) => upper.includes(p));
  if (plain && !text.includes(":")) {
    return {
      batch: null,
      subject: plain === "SELF STUDY" ? "LIBRARY/SELF STUDY" : plain,
      faculty: null,
      room: null,
    };
  }

  let parts = text.split(":").map((s) => s.trim()).filter(Boolean);
  if (parts.length && /^\d?[A-Z]{2,}\d*$/i.test(parts[0])) parts.shift();

  let batch: string | null = null;
  if (parts.length && /^[0-9]$/.test(parts[0])) batch = parts.shift()!;

  let room: string | null = null;
  for (let i = parts.length - 1; i >= 0; i--) {
    const m = parts[i].match(ROOM_RE);
    if (m) {
      room = m[1];
      parts.splice(i, 1);
      break;
    }
  }

  const subject = parts.shift() || null;
  const faculty =
    parts
      .map((p) => p.replace(/[()]/g, "").trim())
      .filter((p) => p && !/^[0-9]$/.test(p))
      .join("/") || null;

  if (!subject && !faculty && !room) return null;
  return { batch, subject, faculty, room };
}

function splitEntries(cellText: string, divisionCore: string | null): string[] {
  const core = divisionCore || "[A-Z]{2,}";
  const re = new RegExp(`(?=\\b\\d?\\s*${core}\\s*\\d+\\s*:)`, "gi");
  const pieces = cellText.split(re).map((s) => s.trim()).filter(Boolean);
  return pieces.length ? pieces : [cellText.trim()].filter(Boolean);
}

function buildSlot(time: string, cellText: string, divisionCore: string | null): Slot | null {
  const entries = splitEntries(cellText, divisionCore)
    .map((e) => parseCellEntry(e))
    .filter((e): e is ParsedEntry => !!e);

  if (!entries.length) return null;

  if (entries.length === 1 && !entries[0].batch) {
    const e = entries[0];
    return { time, subject: e.subject, faculty: e.faculty, room: e.room, batches: [] };
  }

  const batches: Batch[] = entries.map((e, i) => ({
    batch: e.batch || String(i + 1),
    subject: e.subject,
    faculty: e.faculty,
    room: e.room,
  }));
  return { time, subject: null, faculty: null, room: null, batches };
}

export async function parseTimetablePdf(buffer: Buffer): Promise<ParsedTimetable> {
  const items = await extractItems(new Uint8Array(buffer));

  const dayHeaders = items
    .map((it) => ({ ...it, day: DAY_LOOKUP[it.text.toUpperCase()] }))
    .filter((it): it is Item & { day: DayName } => !!it.day)
    .sort((a, b) => a.x - b.x);

  if (dayHeaders.length < 2) {
    throw new Error("Could not detect the weekday columns — is this a timetable PDF?");
  }
  const headerY = dayHeaders.reduce((s, h) => s + h.y, 0) / dayHeaders.length;

  const timeHeader = items.find((it) => it.text.toUpperCase() === "TIME");
  const timeColX = timeHeader ? timeHeader.x : dayHeaders[0].x - 10;

  const dayX = dayHeaders.map((h) => h.x);
  const colBounds = dayHeaders.map((h, i) => ({
    day: h.day,
    left: i === 0 ? (timeColX + dayX[0]) / 2 : (dayX[i - 1] + dayX[i]) / 2,
    right: i === dayHeaders.length - 1 ? Infinity : (dayX[i] + dayX[i + 1]) / 2,
  }));
  const firstColLeft = colBounds[0].left;

  const legend = items.find((it) => /^SUBJECT[_ ]?CODE/i.test(it.text));
  const legendY = legend ? legend.y : -Infinity;

  const headerText = items
    .filter((it) => it.y > headerY)
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map((i) => i.text)
    .join(" ");
  const meta = parseMeta(headerText);
  const divisionCore = meta.division?.match(/[A-Z]+/gi)?.pop() || null;

  const timeColItems = items
    .filter((it) => it.x < firstColLeft && it.y < headerY && it.y > legendY)
    .sort((a, b) => b.y - a.y);

  const rows: { label: string; y: number }[] = [];
  let bucket: Item[] = [];
  const flush = () => {
    if (!bucket.length) return;
    const joined = bucket.sort((a, b) => a.x - b.x).map((i) => i.text).join(" ");
    if (TIME_RE.test(joined)) {
      const m = joined.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)!;
      rows.push({ label: `${m[1]}-${m[2]}`, y: bucket[0].y });
    }
    bucket = [];
  };
  for (const it of timeColItems) {
    if (bucket.length && Math.abs(it.y - bucket[0].y) > 3) flush();
    bucket.push(it);
  }
  flush();

  if (!rows.length) throw new Error("Could not detect time-slot rows in the PDF.");
  rows.sort((a, b) => b.y - a.y);

  const rowBands = rows.map((r, i) => ({
    ...r,
    upper: i === 0 ? headerY : (rows[i - 1].y + r.y) / 2,
    lower: i === rows.length - 1 ? legendY : (r.y + rows[i + 1].y) / 2,
  }));

  const cells = new Map<string, Item[]>();
  for (const it of items) {
    if (it.y >= headerY || it.y <= legendY) continue;
    if (it.x < firstColLeft) continue;
    if (/RECESS/i.test(it.text)) continue;

    const colIdx = colBounds.findIndex((c) => it.x >= c.left && it.x < c.right);
    if (colIdx === -1) continue;
    const rowIdx = rowBands.findIndex((r) => it.y >= r.lower && it.y < r.upper);
    if (rowIdx === -1) continue;

    const key = `${colIdx}|${rowIdx}`;
    const arr = cells.get(key);
    if (arr) arr.push(it);
    else cells.set(key, [it]);
  }

  const schedule: DaySchedule[] = colBounds.map((col, colIdx) => {
    const slots: Slot[] = [];
    rowBands.forEach((row, rowIdx) => {
      const cellItems = cells.get(`${colIdx}|${rowIdx}`);
      if (!cellItems?.length) return;
      const cellText = cellItems
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((i) => i.text)
        .join(" ");
      const slot = buildSlot(row.label, cellText, divisionCore);
      if (slot) slots.push(slot);
    });
    return { day: col.day, slots };
  });

  return { meta, schedule: schedule.filter((d) => d.slots.length) };
}
