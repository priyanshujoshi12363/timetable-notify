import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Your Parul University Timetable PDF",
  description:
    "Upload your Parul University class timetable PDF and Class Compass reads it automatically, then keeps your whole division updated with daily lecture notifications.",
  alternates: { canonical: "/upload" },
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
