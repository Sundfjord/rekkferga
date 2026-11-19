import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { ThemeWrapper } from "../components/ThemeWrapper";
import { LanguageProvider } from "../contexts/LanguageContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import Header from "../components/Header";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="no"
      suppressHydrationWarning
      className={`${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider>
          <ThemeWrapper>
            <LanguageProvider>
            <FavoritesProvider>
              {/* Full-viewport page background; the header and the ferry board sit in its centred column */}
              <div className="h-screen bg-surface-tint flex justify-center">
                <div className="w-full flex flex-col h-full">
                  <Header />
                  <main className="flex-1 overflow-hidden relative">{children}</main>
                </div>
              </div>
            </FavoritesProvider>
            </LanguageProvider>
          </ThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
