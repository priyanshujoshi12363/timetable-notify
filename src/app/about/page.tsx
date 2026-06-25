import type { Metadata } from "next";
import Link from "next/link";
import {
  Info, Mail, MessageSquarePlus, Bug, GraduationCap, Heart,
  CalendarDays, UploadCloud, Sparkles,
} from "lucide-react";
import { SITE_NAME, SITE_DESCRIPTION, AUTHOR, CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About & Contact",
  description:
    "About Class Compass — a free Parul University timetable and class-notification app. Contact the developer for help, feedback, or feature suggestions.",
  alternates: { canonical: "/about" },
};

const mailto = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

export default function AboutPage() {
  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-lg border border-white/40">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              About {SITE_NAME}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">Help, feedback &amp; suggestions.</p>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6 space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <Sparkles className="w-5 h-5 text-violet-600" /> What is {SITE_NAME}?
          </h2>
          <p className="text-sm text-gray-600">{SITE_DESCRIPTION}</p>
          <div className="grid sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <CalendarDays className="w-5 h-5 text-blue-600 mb-1" />
              <p className="text-sm font-medium text-gray-800">See your timetable</p>
              <p className="text-xs text-gray-500">Pick your class and view the week.</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <UploadCloud className="w-5 h-5 text-violet-600 mb-1" />
              <p className="text-sm font-medium text-gray-800">Upload a PDF</p>
              <p className="text-xs text-gray-500">We read it automatically.</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <GraduationCap className="w-5 h-5 text-emerald-600 mb-1" />
              <p className="text-sm font-medium text-gray-800">Daily reminders</p>
              <p className="text-xs text-gray-500">Never miss a lecture.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
            <Heart className="w-5 h-5 text-rose-500" /> Made by
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {AUTHOR.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800">{AUTHOR}</p>
              <a href={mailto(`${SITE_NAME} — Hello`)} className="text-sm text-blue-600 hover:text-blue-800 break-all flex items-center gap-1.5">
                <Mail className="w-4 h-4 shrink-0" /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6 space-y-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <MessageSquarePlus className="w-5 h-5 text-blue-600" /> Get help or send a suggestion
          </h2>
          <p className="text-sm text-gray-600">
            Found a problem, want a feature, or your class timetable isn&apos;t reading correctly?
            Reach out — every message helps make {SITE_NAME} better.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <a href={mailto(`${SITE_NAME} — Help`)} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white text-sm font-semibold shadow hover:shadow-lg transition">
              <Mail className="w-4 h-4" /> Get help
            </a>
            <a href={mailto(`${SITE_NAME} — Suggestion`)} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              <MessageSquarePlus className="w-4 h-4" /> Suggest a feature
            </a>
            <a href={mailto(`${SITE_NAME} — Bug report`)} className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              <Bug className="w-4 h-4" /> Report a bug
            </a>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 px-1">
          <Link href="/" className="hover:text-blue-600">Timetable</Link>
          <Link href="/upload" className="hover:text-blue-600">Upload</Link>
          <Link href="/attandance" className="hover:text-blue-600">Attendance</Link>
        </div>

        <p className="text-xs text-gray-400 px-1">
          {SITE_NAME} is a free, student-built tool for Parul University students and is not an
          official Parul University product.
        </p>
      </div>
    </div>
  );
}
