"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state until theme is properly initialized
  if (!mounted || resolvedTheme === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center pt-4 pb-2 bg-blue-100">
          <div className="w-[137px] h-[60px] bg-gray-200 rounded animate-pulse"></div>
        </div>
        <main className="min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="h-12 bg-gray-200 rounded animate-pulse mb-4 mx-auto w-48"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse mx-auto w-64"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
