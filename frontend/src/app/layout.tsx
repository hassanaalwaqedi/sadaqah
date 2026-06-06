import type { Metadata, Viewport } from "next";
import { Inter, Tajawal } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/providers/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const tajawal = Tajawal({ weight: ["300", "400", "500", "700"], subsets: ["arabic"], variable: "--font-tajawal" });

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "جمعية الصداقة والتعاون اليمنية - تركيا",
    template: "%s | جمعية الصداقة والتعاون",
  },
  description:
    "منصة احترافية لدعم التعاون والصداقة اليمنية التركية، المبادرات المجتمعية، الحملات، والمشاريع الإنسانية.",
  keywords: [
    "جمعية الصداقة والتعاون",
    "منح دراسية",
    "سكن طلابي",
    "ابتكار",
    "تبرعات",
    "مشاريع إنسانية",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "جمعية الصداقة والتعاون اليمنية - تركيا",
    description: "منصة احترافية لدعم التعاون والصداقة اليمنية التركية، المبادرات المجتمعية، الحملات، والمشاريع الإنسانية.",
    url: "https://sadaqah-platform.com", // Adjust to actual production URL
    siteName: "جمعية الصداقة والتعاون",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "جمعية الصداقة والتعاون اليمنية - تركيا",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "جمعية الصداقة والتعاون اليمنية - تركيا",
    description: "منصة احترافية لدعم التعاون والصداقة اليمنية التركية، المبادرات المجتمعية، الحملات، والمشاريع الإنسانية.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${inter.variable} ${tajawal.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
