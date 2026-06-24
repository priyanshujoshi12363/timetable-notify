import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance Calculator for Parul University Students",
  description:
    "Calculate your attendance percentage and find out how many lectures you need to attend to reach your target — a free tool for Parul University students by Class Compass.",
  alternates: { canonical: "/attandance" },
};

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
