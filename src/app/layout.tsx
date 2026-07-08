import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/offline/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Busk-O",
  description:
    "Chords, lyrics, and setlists for worship singers, musicians, and buskers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Busk-O" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
  // Lock the mobile view: no pinch-zoom or double-tap zoom, so the layout
  // stays fixed. Text size is adjusted only via the in-app A−/A+ controls.
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The pre-paint script below sets --chord on <html>; suppress the
      // resulting SSR/client attribute mismatch (same pattern as theme scripts).
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Apply the saved chord color before paint to avoid a color flash.
            Keep the map in sync with src/lib/chord-color.ts. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var v=localStorage.getItem('busko:chord-color');var m={amber:'#f59e0b',blue:'#60a5fa',rose:'#fb7185'};if(v&&m[v])document.documentElement.style.setProperty('--chord',m[v]);}catch(e){}`,
          }}
        />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
