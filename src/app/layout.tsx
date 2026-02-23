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
    default: "Student Portal",
    template: "%s | Student Portal",
  },
  description:
    "Smart academic dashboard for attendance tracking and class notifications.",
  keywords: [
    "Student Portal",
    "Attendance App",
    "College Dashboard",
    "Class Notifications",
  ],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Student Portal",
    description:
      "Track attendance and receive smart class notifications.",
    url: "http://localhost:3000",
    siteName: "Student Portal",
    locale: "en_US",
    type: "website",
  },
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