import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GrowEasy CSV Importer",
  description: "AI-powered CSV importer that maps any CRM export into GrowEasy's lead format.",
};

// Applies the saved theme before first paint, so there's no flash of the
// wrong theme on load. Runs as an inline script because it has to execute
// before React hydrates.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('groweasy-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html 
      lang="en" 
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[var(--color-bg)] font-[family-name:var(--font-body)] antialiased">
        {children}
      </body>
    </html>
  );
}
