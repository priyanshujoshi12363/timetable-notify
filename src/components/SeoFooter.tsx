import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, FAQ } from "@/lib/site";

export default function SeoFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white/60">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-800">
            {SITE_NAME} — {SITE_TAGLINE}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">{SITE_DESCRIPTION}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800">
            Frequently asked questions
          </h2>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="text-sm font-semibold text-gray-700">{item.q}</h3>
                <p className="mt-1 text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Timetable &amp; Notifications</Link>
          <Link href="/upload" className="hover:text-blue-600">Upload Timetable</Link>
          <Link href="/attandance" className="hover:text-blue-600">Attendance Calculator</Link>
        </section>

        <p className="text-xs text-gray-400">
          {SITE_NAME} is a free, student-built tool for Parul University students and is not an
          official Parul University product.
        </p>
      </div>
    </footer>
  );
}
