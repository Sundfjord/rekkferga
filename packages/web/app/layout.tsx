import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { ThemeWrapper } from "../components/ThemeWrapper";
import { LanguageProvider } from "../contexts/LanguageContext";
import { FavoritesProvider } from "../contexts/FavoritesContext";
import Header from "../components/Header";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider>
          <ThemeWrapper>
            <LanguageProvider>
            <FavoritesProvider>
              {/* Full-viewport background */}
              <div className="h-screen bg-background flex justify-center">
                {/* Constrained column — app-like on desktop, full-width on mobile */}
                <div className="container flex flex-col h-full">
                  <Header />
                  <main className="flex-1 overflow-hidden">{children}</main>
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
