import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/providers/providers";

export const metadata: Metadata = {
  title: {
    default: "Sadaqah — جمعية الصداقة والتعاون",
    template: "%s | Sadaqah",
  },
  description:
    "Platform for Friendship and Cooperation Association — Scholarships, Student Housing, Innovation, and Donor Management.",
  keywords: [
    "scholarships",
    "student housing",
    "innovation",
    "donations",
    "non-profit",
    "education",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
