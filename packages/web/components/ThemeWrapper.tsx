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
        <div className="mx-3 mt-3">
          <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
