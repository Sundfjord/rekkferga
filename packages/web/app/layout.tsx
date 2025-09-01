import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { ThemeWrapper } from "../components/ThemeWrapper";
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
            <div className="flex flex-col h-screen">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
          </ThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
