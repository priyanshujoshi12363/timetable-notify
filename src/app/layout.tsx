import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Timely – Smart Student Attendance & Timetable App",
    template: "%s | Timely",
  },
  description:
    "Timely is a smart student portal that helps you track attendance, view daily timetables, and receive automatic class notifications. Stay organized and never miss a lecture.",

  keywords: [
    "Timely App",
    "Student Attendance Tracker",
    "College Timetable App",
    "Student Dashboard",
    "Class Reminder App",
    "Attendance Management System",
    "College Notification App",
    "Academic Planner",
    "Student Productivity App",
  ],

  authors: [{ name: "Priyanshu Joshi", url: "https://timetable-notify.onrender.com" }],
  creator: "Priyanshu Joshi",
  publisher: "Timely",

  metadataBase: new URL("https://timetable-notify.onrender.com"),

  alternates: {
    canonical: "https://timetable-notify.onrender.com",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  openGraph: {
    title: "Timely – Smart Student Attendance & Timetable App",
    description:
      "Track attendance, manage your timetable, and receive smart class notifications automatically with Timely.",
    url: "https://timetable-notify.onrender.com",
    siteName: "Timely",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png", // Add this file in /public
        width: 1200,
        height: 630,
        alt: "Timely Student Dashboard Preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Timely – Student Attendance & Timetable App",
    description:
      "Smart attendance tracking and class notifications for students.",
    images: ["/og-image.png"],
    creator: "@yourtwitterhandle",
  },

  category: "education",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-100 font-sans pt-5 md:pt-20 pb-16 md:pb-0 min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4">
          {children}
        </main>
      </body>
    </html>
  );
}