"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud, FileText, Loader2, X, Plus, Trash2, Save, CheckCircle,
  AlertCircle, Clock, Users, MapPin, ArrowLeft, ScanLine, Sparkles,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
type DayName = (typeof DAYS)[number];

interface Batch { batch: string; subject: string | null; faculty: string | null; room: string | null; }
interface Slot { time: string; subject: string | null; faculty: string | null; room: string | null; batches: Batch[]; }
interface DaySchedule { day: DayName; slots: Slot[]; }
interface Meta {
  division: string | null; semester: number | null;
  academicYear: string | null; program: string | null; effectiveFrom: string | null;
}

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400";

function deriveCourse(program: string | null): string {
  const p = (program || "").toUpperCase();
  if (p.includes("ARTIFICIAL INTELLIGENCE") || p.includes("AIML") || p.includes("MACHINE LEARNING")) return "AIML";
  if (p.includes("COMPUTER SCIENCE") || p.includes("CSE")) return "CSE";
  return "AIML";
}

export default function UploadTimetablePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);
  const [branch, setBranch] = useState("CSE");
  const [course, setCourse] = useState("AIML");
  const [division, setDivision] = useState("");
  const [semester, setSemester] = useState<number>(0);
  const [academicYear, setAcademicYear] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const acceptFile = useCallback((f: File | undefined) => {
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) { setError("Please drop a PDF file."); return; }
    if (f.size > 15 * 1024 * 1024) { setError("PDF too large (max 15MB)."); return; }
    setError(null); setSuccess(null); setSchedule(null);
    setFile(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true); setError(null); setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/timetable/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to parse PDF");

      const meta: Meta = data.meta || {};
      setSchedule(
        (data.schedule as DaySchedule[]).map((d) => ({
          ...d,
          slots: d.slots.map((s) => ({ ...s, batches: s.batches ?? [] })),
        }))
      );
      setDivision(meta.division || "");
      setSemester(meta.semester || 0);
      setAcademicYear(meta.academicYear || "");
      setCourse(deriveCourse(meta.program));
    } catch (e: any) {
      setError(e.message || "Failed to parse PDF");
    } finally {
      setParsing(false);
    }
  };

  const mutate = (fn: (draft: DaySchedule[]) => void) =>
    setSchedule((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as DaySchedule[];
      fn(next);
      return next;
    });

  const updateSlot = (di: number, si: number, key: keyof Slot, value: string) =>
    mutate((d) => { (d[di].slots[si] as any)[key] = value || null; });
  const updateBatch = (di: number, si: number, bi: number, key: keyof Batch, value: string) =>
    mutate((d) => { (d[di].slots[si].batches[bi] as any)[key] = value || null; });
  const addSlot = (di: number) =>
    mutate((d) => { d[di].slots.push({ time: "", subject: null, faculty: null, room: null, batches: [] }); });
  const removeSlot = (di: number, si: number) => mutate((d) => { d[di].slots.splice(si, 1); });
  const addBatch = (di: number, si: number) =>
    mutate((d) => { const b = d[di].slots[si].batches; b.push({ batch: String(b.length + 1), subject: null, faculty: null, room: null }); });
  const removeBatch = (di: number, si: number, bi: number) =>
    mutate((d) => { d[di].slots[si].batches.splice(bi, 1); });
  const addDay = () =>
    mutate((d) => { const used = new Set(d.map((x) => x.day)); const n = DAYS.find((x) => !used.has(x)); if (n) d.push({ day: n, slots: [] }); });
  const removeDay = (di: number) => mutate((d) => { d.splice(di, 1); });

  const totalClasses = useMemo(() => schedule?.reduce((n, d) => n + d.slots.length, 0) ?? 0, [schedule]);

  const handleSave = async () => {
    if (!division.trim()) { setError("Division is required."); return; }
    if (!semester) { setError("Semester is required."); return; }
    if (!schedule?.length) { setError("Nothing to save."); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/timetable/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, course, semester, academicYear, division: division.trim(), schedule }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
      setSuccess("Saved! Taking you to your timetable…");
      setTimeout(() => router.push(`/?division=${encodeURIComponent(division.trim())}`), 1200);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { setFile(null); setSchedule(null); setError(null); setSuccess(null); };

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg border border-white/40">
          <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Upload Timetable PDF
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Drop your timetable PDF — we read it instantly, you review, the division gets notified.
            </p>
          </div>
        </div>

        {!schedule && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
                dragging ? "border-violet-500 bg-violet-50 scale-[1.01]" : "border-gray-300 hover:border-violet-400 hover:bg-violet-50/40"
              }`}
            >
              <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0] ?? undefined)} />
              {file ? (
                <div className="flex items-center gap-3 p-6">
                  <div className="p-3 bg-violet-100 rounded-xl"><FileText className="w-7 h-7 text-violet-600" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · PDF</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="p-4 bg-violet-100 rounded-2xl mb-4"><UploadCloud className="w-8 h-8 text-violet-600" /></div>
                  <p className="font-medium text-gray-700">Drag & drop your timetable PDF</p>
                  <p className="text-sm text-gray-400 mt-1">or click to browse · PDF · max 15MB</p>
                </div>
              )}
            </div>

            {file && (
              <button onClick={handleParse} disabled={parsing}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-white font-semibold shadow-lg transition hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                {parsing ? <><Loader2 className="w-5 h-5 animate-spin" /> Reading PDF…</> : <><Sparkles className="w-5 h-5" /> Read timetable</>}
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{success}</span>
          </div>
        )}

        {schedule && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" /> Detected from PDF
                </h3>
                <button onClick={reset} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="w-4 h-4" /> Start over
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="text-xs text-gray-500 space-y-1">Division
                  <input value={division} onChange={(e) => setDivision(e.target.value)} className={inputCls} placeholder="3AIML15" />
                </label>
                <label className="text-xs text-gray-500 space-y-1">Semester
                  <input type="number" value={semester || ""} onChange={(e) => setSemester(Number(e.target.value))} className={inputCls} />
                </label>
                <label className="text-xs text-gray-500 space-y-1">Course
                  <input value={course} onChange={(e) => setCourse(e.target.value)} className={inputCls} />
                </label>
                <label className="text-xs text-gray-500 space-y-1">Academic Year
                  <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={inputCls} placeholder="2026-27" />
                </label>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {schedule.length} days · {totalClasses} classes — check everything matches the PDF before saving.
              </p>
            </div>

            {schedule.map((day, di) => (
              <div key={day.day} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600">
                  <h4 className="font-bold text-white">{day.day}</h4>
                  <button onClick={() => removeDay(di)} className="p-1.5 hover:bg-white/20 rounded-lg text-white" title="Remove day">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 sm:p-4 space-y-3">
                  {day.slots.map((slot, si) => (
                    <div key={si} className="rounded-xl border border-gray-200 p-3 bg-gray-50/60">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-violet-600 shrink-0" />
                        <input value={slot.time} onChange={(e) => updateSlot(di, si, "time", e.target.value)}
                          placeholder="7:30-8:25" className={`${inputCls} max-w-[140px] font-medium`} />
                        <button onClick={() => removeSlot(di, si)} className="ml-auto p-1.5 text-gray-400 hover:text-red-500" title="Remove slot">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {slot.batches.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input value={slot.subject ?? ""} onChange={(e) => updateSlot(di, si, "subject", e.target.value)} placeholder="Subject" className={inputCls} />
                          <input value={slot.faculty ?? ""} onChange={(e) => updateSlot(di, si, "faculty", e.target.value)} placeholder="Faculty" className={inputCls} />
                          <input value={slot.room ?? ""} onChange={(e) => updateSlot(di, si, "room", e.target.value)} placeholder="Room" className={inputCls} />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {slot.batches.map((b, bi) => (
                            <div key={bi} className="flex flex-wrap items-center gap-2 rounded-lg bg-purple-50 border border-purple-200 p-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-purple-700">
                                <Users className="w-3.5 h-3.5" />
                                <input value={b.batch} onChange={(e) => updateBatch(di, si, bi, "batch", e.target.value)} className="w-10 bg-white rounded px-1.5 py-1 border border-purple-200" />
                              </span>
                              <input value={b.subject ?? ""} onChange={(e) => updateBatch(di, si, bi, "subject", e.target.value)} placeholder="Subject" className={`${inputCls} flex-1 min-w-[90px]`} />
                              <input value={b.faculty ?? ""} onChange={(e) => updateBatch(di, si, bi, "faculty", e.target.value)} placeholder="Faculty" className={`${inputCls} flex-1 min-w-[80px]`} />
                              <span className="flex items-center gap-1 flex-1 min-w-[90px]">
                                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                                <input value={b.room ?? ""} onChange={(e) => updateBatch(di, si, bi, "room", e.target.value)} placeholder="Room" className={inputCls} />
                              </span>
                              <button onClick={() => removeBatch(di, si, bi)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => addBatch(di, si)} className="mt-2 text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> {slot.batches.length ? "Add batch" : "Split into batches"}
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addSlot(di)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm text-gray-500 hover:border-violet-300 hover:text-violet-600 transition">
                    <Plus className="w-4 h-4" /> Add time slot
                  </button>
                </div>
              </div>
            ))}

            {schedule.length < DAYS.length && (
              <button onClick={addDay}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition">
                <Plus className="w-4 h-4" /> Add a day
              </button>
            )}

            <div className="sticky bottom-3 bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3">
              <p className="text-xs text-gray-500 flex-1">
                {division ? <>Saving to <b className="text-gray-700">{division}</b> · whole division will be notified.</> : "Division required to save."}
              </p>
              <button onClick={handleSave} disabled={saving || !division.trim() || !semester}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 text-white font-semibold shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : <><Save className="w-5 h-5" /> Save timetable</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
