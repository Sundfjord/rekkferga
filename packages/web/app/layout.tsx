import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { ThemeWrapper } from "../components/ThemeWrapper";
import { LanguageProvider } from "../contexts/LanguageContext";
import Header from "../components/Header";

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
    <html lang="no" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ThemeWrapper>
            <LanguageProvider>
              {/* Full-viewport background */}
              <div className="h-screen bg-background flex justify-center">
                {/* Constrained column — app-like on desktop, full-width on mobile */}
                <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl flex flex-col h-full border-x border-gray-100 dark:border-gray-800">
                  <Header />
                  <main className="flex-1 overflow-hidden">{children}</main>
                </div>
              </div>
            </LanguageProvider>
          </ThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
