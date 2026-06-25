"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { generateFCMToken } from "@/lib/getfcmtoken";
import { TbCompass, TbUnlink } from "react-icons/tb";
import {
  FiSearch, FiClock, FiUser, FiMapPin, FiUploadCloud, FiCheckCircle,
  FiAlertCircle, FiRefreshCw, FiLoader, FiCoffee, FiBookOpen, FiCode,
  FiSun, FiCalendar, FiChevronRight,
} from "react-icons/fi";

interface Batch { batch: string; subject: string | null; faculty: string | null; room: string | null; }
interface Slot { time: string; subject: string | null; faculty: string | null; room: string | null; batches: Batch[]; }
interface DaySchedule { day: string; slots: Slot[]; }
interface Timetable {
  division: string; branch: string; course: string; semester: number;
  academicYear?: string; schedule: DaySchedule[];
}
interface DivisionInfo { division: string; branch: string; course: string; semester: number; }

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayName() {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
}

function getDeviceId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto?.randomUUID
      ? crypto.randomUUID()
      : `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("deviceId", id);
  }
  return id;
}

function Chip({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200">
      <Icon className="h-3 w-3 text-slate-400" /> {children}
    </span>
  );
}

function SlotCard({ slot }: { slot: Slot }) {
  const hasBatches = slot.batches?.length > 0;
  const isHoliday = slot.subject === "HOLIDAY";
  const isLibrary = slot.subject === "LIBRARY/SELF STUDY" || slot.subject === "LIBRARY";
  const isEvent = slot.subject === "CODE CHEF";

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500">
          <FiClock className="h-3.5 w-3.5" /> {slot.time.replace("-", " – ")}
        </span>
        {hasBatches && (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
            {slot.batches.length} batches
          </span>
        )}
      </div>

      <div className="p-4">
        {hasBatches ? (
          <div className="space-y-2">
            {slot.batches.map((b, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-violet-50/70 px-3 py-2">
                <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white">B{b.batch}</span>
                <span className="font-bold text-slate-800">{b.subject || "—"}</span>
                {b.faculty && <Chip icon={FiUser}>{b.faculty}</Chip>}
                {b.room && <Chip icon={FiMapPin}>{b.room}</Chip>}
              </div>
            ))}
          </div>
        ) : isHoliday ? (
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500"><FiSun className="h-5 w-5 text-amber-500" /> Holiday</div>
        ) : isLibrary ? (
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600"><FiBookOpen className="h-5 w-5" /> Library / Self Study</div>
        ) : isEvent ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600"><FiCode className="h-5 w-5" /> {slot.subject}</div>
        ) : slot.subject ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-slate-800">{slot.subject}</span>
            {slot.faculty && <Chip icon={FiUser}>{slot.faculty}</Chip>}
            {slot.room && <Chip icon={FiMapPin}>Room {slot.room}</Chip>}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400"><FiCoffee className="h-5 w-5" /> Free period</div>
        )}
      </div>
    </div>
  );
}

function NotificationScreen() {
  const params = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [divisions, setDivisions] = useState<DivisionInfo[]>([]);
  const [selected, setSelected] = useState("");
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "notfound">("idle");
  const [selectedDay, setSelectedDay] = useState(todayName());
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [query, setQuery] = useState("");
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/timetable/divisions")
      .then((r) => r.json())
      .then((d) => setDivisions(d.divisions || []))
      .catch(() => {});
    const initial = params.get("division") || localStorage.getItem("myClass");
    if (initial) selectClass(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const days = useMemo(
    () => (timetable?.schedule || []).map((d) => d.day).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)),
    [timetable]
  );
  const daySlots = useMemo(
    () => timetable?.schedule.find((d) => d.day === selectedDay)?.slots || [],
    [timetable, selectedDay]
  );

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return divisions;
    return divisions.filter((d) => norm(`${d.division} ${d.course}`).includes(q));
  }, [divisions, query]);

  async function selectClass(division: string) {
    setSelected(division);
    setQuery(division);
    setShowList(false);
    setStatus("loading");
    setSubscribed(false);
    try {
      const res = await fetch(`/api/timetable/get?division=${encodeURIComponent(division)}`);
      const data = await res.json();
      if (!data.exists) { setTimetable(null); setStatus("notfound"); return; }

      const tt: Timetable = data.timetable;
      setTimetable(tt);
      localStorage.setItem("myClass", division);
      const t = todayName();
      const has = tt.schedule.some((d) => d.day === t);
      setSelectedDay(has ? t : tt.schedule[0]?.day || "Monday");
      setStatus("ready");
      subscribe(tt);
    } catch {
      setStatus("notfound");
    }
  }

  async function subscribe(tt: Timetable) {
    setSubscribing(true);
    try {
      const token = await generateFCMToken();
      if (!token) { setSubscribing(false); return; }
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: tt.branch, course: tt.course, division: tt.division,
          semester: tt.semester, academicYear: tt.academicYear, fcmToken: token,
          deviceId: getDeviceId(),
        }),
      });
      const data = await res.json();
      setSubscribed(!!data.success);
      if (data.success && data.data?._id) {
        localStorage.setItem("myDeviceId", data.data._id);
      }
    } catch {
      return;
    } finally {
      setSubscribing(false);
    }
  }

  async function unlink() {
    if (
      !confirm(
        `Remove ${selected} from this device? You'll stop getting its reminders and can pick or upload another class.`
      )
    ) {
      return;
    }
    const id = localStorage.getItem("myDeviceId");
    if (id) {
      try {
        await fetch(`/api/delete?userId=${id}`, { method: "DELETE" });
      } catch {
        void 0;
      }
    }
    localStorage.removeItem("myClass");
    localStorage.removeItem("myDeviceId");
    setSelected("");
    setQuery("");
    setTimetable(null);
    setSubscribed(false);
    setStatus("idle");
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">

        <div className="animate-in-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 shadow-xl shadow-indigo-500/20 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <TbCompass className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Class Compass</h1>
              <p className="mt-0.5 text-sm text-indigo-100">Parul University timetable &amp; daily class reminders</p>
            </div>
          </div>
        </div>

        <div className="animate-in-up space-y-3 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 sm:p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FiCalendar className="h-4 w-4 text-indigo-600" /> Find your class
          </label>

          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowList(true); }}
              onFocus={() => setShowList(true)}
              onBlur={() => setTimeout(() => setShowList(false), 150)}
              placeholder="Search e.g. AIML 15"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3 text-sm text-slate-700 transition placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />

            {showList && filtered.length > 0 && (
              <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-100 bg-white p-1 shadow-2xl shadow-slate-300/40">
                {filtered.map((d) => (
                  <button
                    key={d.division}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectClass(d.division)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition ${
                      selected === d.division ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-medium">{d.division}</span>
                    <span className="text-xs text-slate-400">
                      {d.course}{d.semester ? ` · Sem ${d.semester}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {query.trim() && filtered.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
              <div className="flex items-start gap-2.5">
                <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Can&apos;t find &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-slate-600">Your class isn&apos;t added yet. Upload its timetable PDF and it&apos;ll appear here for everyone in your class.</p>
                </div>
              </div>
              <ol className="list-inside list-decimal space-y-1 pl-1 text-xs text-slate-600">
                <li>Get your official class timetable PDF.</li>
                <li>Open Upload and drop the PDF — we read it automatically.</li>
                <li>Review and save. Done!</li>
              </ol>
              <Link href="/upload" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:shadow-lg">
                <FiUploadCloud className="h-4 w-4" /> Upload your timetable PDF
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-slate-400">
                {divisions.length ? `${divisions.length} class${divisions.length > 1 ? "es" : ""} available` : "No class timetables yet."}
              </p>
              <Link href="/upload" className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 transition hover:text-violet-800">
                <FiUploadCloud className="h-4 w-4" /> Upload a timetable
              </Link>
            </div>
          )}

          {subscribed && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <FiCheckCircle className="h-4 w-4" /> You&apos;ll get daily reminders for {selected}.
            </div>
          )}
          {subscribing && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FiLoader className="h-4 w-4 animate-spin" /> Enabling notifications…
            </div>
          )}
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center rounded-3xl bg-white py-16 shadow-lg ring-1 ring-slate-100">
            <FiLoader className="h-9 w-9 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm text-slate-500">Loading timetable…</p>
          </div>
        )}

        {status === "notfound" && (
          <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-lg">
            <div className="mb-4 inline-flex rounded-2xl bg-amber-100 p-4">
              <FiAlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No timetable for {selected} yet</h3>
            <p className="mb-5 mt-1 text-sm text-slate-500">Be the first to add it — upload the PDF and your whole class is set.</p>
            <Link href="/upload" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl">
              <FiUploadCloud className="h-5 w-5" /> Upload timetable <FiChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === "ready" && timetable && (
          <div className="animate-in-up space-y-4">
            <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
              <div className="grid grid-cols-6 gap-1.5">
                {days.map((day) => {
                  const isActive = day === selectedDay;
                  const isToday = day === todayName();
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`relative rounded-xl py-2.5 text-xs font-semibold transition ${
                        isActive
                          ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {isToday && !isActive && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-end justify-between px-1">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {selectedDay === todayName() ? "Today" : selectedDay}
                </h3>
                <p className="text-xs text-slate-400">
                  {timetable.division} · {daySlots.length} class{daySlots.length === 1 ? "" : "es"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => selectClass(selected)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100">
                  <FiRefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
                <button onClick={unlink} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-50">
                  <TbUnlink className="h-3.5 w-3.5" /> Unlink
                </button>
              </div>
            </div>

            {daySlots.length ? (
              <div className="space-y-3">{daySlots.map((s, i) => <SlotCard key={i} slot={s} />)}</div>
            ) : (
              <div className="flex flex-col items-center rounded-3xl bg-white py-14 shadow-lg ring-1 ring-slate-100">
                <FiSun className="mb-3 h-10 w-10 text-amber-500" />
                <p className="font-semibold text-slate-700">No classes on {selectedDay}</p>
                <p className="text-sm text-slate-500">Enjoy your day off!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NotificationScreen />
    </Suspense>
  );
}
