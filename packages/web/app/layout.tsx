import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Header from "@/components/Header";

// Variable font: every weight in one file, plus the optical-size axis so headings get
// tighter letterforms than body text automatically (font-optical-sizing: auto).
const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rekkferga - Finn din kai. Rekk ferga.",
  description: "Rekkferga - Finn din kai. Rekk ferga.",
  // favicon.ico, icon.svg and apple-icon.png in app/ are linked automatically; the manifest's
  // 192/512 px icons are in public/. All come from the ferry's wheelhouse.
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#011638",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class, and LanguageProvider `lang`,
    // on <html> in the browser.
    <html lang="no" suppressHydrationWarning className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <FavoritesProvider>
              {/* Full-viewport page: the header, then the ferry board filling the rest. Both
                  are prerendered; settings stored in the browser apply after hydration. */}
              <div className="flex h-dvh w-full flex-col bg-surface-tint">
                <Header />
                <main className="relative flex-1 overflow-hidden">{children}</main>
              </div>
            </FavoritesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
