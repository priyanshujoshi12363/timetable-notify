"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { generateFCMToken } from "@/lib/getfcmtoken";
import {
  Bell, Search, Loader2, CalendarDays, Clock, Users, MapPin,
  PartyPopper, BookMarked, Coffee, UploadCloud, CheckCircle, AlertCircle,
  GraduationCap, RefreshCw,
} from "lucide-react";

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

function SlotCard({ slot }: { slot: Slot }) {
  const hasBatches = slot.batches?.length > 0;
  const isHoliday = slot.subject === "HOLIDAY";
  const isLibrary = slot.subject === "LIBRARY/SELF STUDY" || slot.subject === "LIBRARY";
  const isEvent = slot.subject === "CODE CHEF";

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition hover:shadow-md ${
      hasBatches ? "border-purple-200 bg-purple-50/40" : "border-blue-200 bg-blue-50/30"
    }`}>
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${hasBatches ? "bg-purple-100/50 border-purple-200" : "bg-blue-100/50 border-blue-200"}`}>
        <Clock className={`w-3.5 h-3.5 ${hasBatches ? "text-purple-600" : "text-blue-600"}`} />
        <span className="text-xs font-semibold text-gray-700">{slot.time.replace("-", " - ")}</span>
      </div>
      <div className="p-3">
        {hasBatches ? (
          <div className="space-y-2">
            {slot.batches.map((b, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">Batch {b.batch}</span>
                <span className="font-bold text-gray-800">{b.subject || "—"}</span>
                {b.faculty && <span className="text-gray-600 flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full text-xs"><Users className="w-3 h-3" />{b.faculty}</span>}
                {b.room && <span className="text-gray-600 flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-full text-xs"><MapPin className="w-3 h-3" />{b.room}</span>}
              </div>
            ))}
          </div>
        ) : isHoliday ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm"><PartyPopper className="w-5 h-5" /> Holiday</div>
        ) : isLibrary ? (
          <div className="flex items-center gap-2 text-amber-600 text-sm"><BookMarked className="w-5 h-5" /> Library / Self Study</div>
        ) : isEvent ? (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium"><GraduationCap className="w-5 h-5" /> {slot.subject}</div>
        ) : slot.subject ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-gray-800 text-base">{slot.subject}</span>
            {slot.faculty && <span className="text-gray-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full text-xs"><Users className="w-3 h-3" />{slot.faculty}</span>}
            {slot.room && <span className="text-gray-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full text-xs"><MapPin className="w-3 h-3" />Room {slot.room}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400 text-sm"><Coffee className="w-5 h-5" /> Free period</div>
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
        }),
      });
      const data = await res.json();
      setSubscribed(!!data.success);
    } catch {
      return;
    } finally {
      setSubscribing(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg border border-white/40">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Class Compass
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">Parul University timetable &amp; daily class notifications — pick your class to begin.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <CalendarDays className="w-4 h-4 text-blue-600" /> Find your class
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowList(true); }}
              onFocus={() => setShowList(true)}
              onBlur={() => setTimeout(() => setShowList(false), 150)}
              placeholder="Search e.g. AIML 15"
              className="w-full rounded-xl border border-gray-200 hover:border-blue-300 focus:border-blue-500 bg-white pl-9 pr-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            {showList && filtered.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                {filtered.map((d) => (
                  <button
                    key={d.division}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectClass(d.division)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between ${
                      selected === d.division ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    <span className="font-medium">{d.division}</span>
                    <span className="text-xs text-gray-400">
                      {d.course}{d.semester ? ` · Sem ${d.semester}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {query.trim() && filtered.length === 0 ? (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Can&apos;t find &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-gray-600">Your class isn&apos;t added yet. Upload its timetable PDF and it&apos;ll appear here for everyone in your class.</p>
                </div>
              </div>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside pl-1">
                <li>Get your official class timetable PDF.</li>
                <li>Open Upload and drop the PDF — we read it automatically.</li>
                <li>Review and save. Done!</li>
              </ol>
              <Link href="/upload" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-white text-sm font-semibold shadow hover:shadow-lg transition">
                <UploadCloud className="w-4 h-4" /> Upload your timetable PDF
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-400">
                {divisions.length ? `${divisions.length} class${divisions.length > 1 ? "es" : ""} available` : "No class timetables yet."}
              </p>
              <Link href="/upload" className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800">
                <UploadCloud className="w-4 h-4" /> Upload a timetable
              </Link>
            </div>
          )}

          {subscribed && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4" /> You'll get daily reminders for {selected}.
            </div>
          )}
          {subscribing && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Enabling notifications…
            </div>
          )}
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center py-16 bg-white rounded-2xl shadow-xl">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500 mt-3">Loading timetable…</p>
          </div>
        )}

        {status === "notfound" && (
          <div className="bg-white rounded-2xl shadow-xl border border-amber-200 p-8 text-center">
            <div className="inline-flex p-4 bg-amber-100 rounded-2xl mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-800">No timetable for {selected} yet</h3>
            <p className="text-sm text-gray-500 mt-1 mb-5">Be the first to add it — upload the PDF and your whole class is set.</p>
            <Link href="/upload" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition">
              <UploadCloud className="w-5 h-5" /> Upload timetable
            </Link>
          </div>
        )}

        {status === "ready" && timetable && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {days.map((day) => {
                  const isActive = day === selectedDay;
                  const isToday = day === todayName();
                  return (
                    <button key={day} onClick={() => setSelectedDay(day)}
                      className={`relative flex flex-col items-center py-2.5 rounded-xl text-xs font-medium transition ${
                        isActive ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md scale-105" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}>
                      {isToday && !isActive && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />}
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-gray-800">
                {selectedDay === todayName() ? "Today" : selectedDay} · {timetable.division}
              </h3>
              <button onClick={() => selectClass(selected)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {daySlots.length ? (
              <div className="space-y-3">{daySlots.map((s, i) => <SlotCard key={i} slot={s} />)}</div>
            ) : (
              <div className="flex flex-col items-center py-14 bg-white rounded-2xl shadow-xl">
                <PartyPopper className="w-10 h-10 text-amber-500 mb-3" />
                <p className="font-medium text-gray-700">No classes on {selectedDay}</p>
                <p className="text-sm text-gray-500">Enjoy your day off!</p>
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
