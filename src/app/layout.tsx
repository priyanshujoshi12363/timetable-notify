import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NotificationListener from "@/service/notification";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Classes Compass",
    template: "%s | Classes Compass",
  },

  description:
    "Classes Compass is a smart student portal designed to help you track attendance, view daily timetables, and receive automatic class notifications. Stay organized, focused, and never miss a lecture.",

  keywords: [
    "Classes Compass",
    "Student Timetable App",
    "Attendance Tracker for Students",
    "College Timetable Manager",
    "Class Reminder App",
    "Attendance Management System",
    "Student Notification App",
    "Academic Planner for Students",
    "College Productivity App",
    "Smart Student Dashboard",
  ],

  authors: [
    {
      name: "Priyanshu Joshi",
      url: "https://timetable-notify.onrender.com",
    },
  ],

  creator: "Priyanshu Joshi",
  publisher: "Classes Compass",

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
    title: "Classes Compass – Smart Student Timetable & Attendance App",
    description:
      "Track attendance, manage your timetable, and receive smart class notifications automatically with Classes Compass.",
    url: "https://timetable-notify.onrender.com",
    siteName: "Classes Compass",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Classes Compass Student Dashboard Preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Classes Compass – Student Timetable & Attendance App",
    description:
      "Smart attendance tracking and automated class notifications for students.",
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
      <NotificationListener />
        <Navbar />
        <main className="max-w-6xl mx-auto px-4">
          {children}
        </main>
      </body>
    </html>
  );
}