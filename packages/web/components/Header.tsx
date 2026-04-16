"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

interface HeaderProps {
  onToggleSettings?: () => void;
  showSettings?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSettings,
  showSettings = false,
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the appropriate logo based on theme
  const getLogoSource = () => {
    // Default to light logo for SSR and initial render
    if (!mounted) {
      return "/logo-light.png";
    }

    const logoSource =
      resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";
    return logoSource;
  };

  return (
    <header
      className="flex justify-center pt-4 pb-2 relative"
      style={{ backgroundColor: "var(--primary-light, #42a5f5)" }}
    >
      <div className="flex items-center justify-center">
        <Image
          key={resolvedTheme} // Force re-render when theme changes
          src={getLogoSource()}
          alt="Rekkferga logo"
          width={137}
          height={60}
          priority
          className="h-[60px] w-[137px] object-contain"
        />
      </div>

      {onToggleSettings && (
        <button
          onClick={onToggleSettings}
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Innstillingar"
        >
          <svg
            className="w-6 h-6"
            style={{
              color: showSettings
                ? "var(--text-on-secondary, #000000)"
                : "var(--text-on-primary, #ffffff)",
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}
    </header>
  );
};

export default Header;
