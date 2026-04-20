"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@shared/utils";

// ── Icons ─────────────────────────────────────────────────────────────────────

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 4.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 4.5ZM18.364 6.343a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 1 1-1.062-1.061l1.061-1.061a.75.75 0 0 1 1.061 0ZM19.5 12a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM16.243 17.303a.75.75 0 0 1-1.061 0l-1.061-1.06a.75.75 0 1 1 1.06-1.062l1.062 1.061a.75.75 0 0 1 0 1.061ZM12 18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 18ZM7.757 16.243a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.061a.75.75 0 0 1 1.061 0ZM4.5 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 4.5 12ZM7.757 7.757a.75.75 0 0 1-1.061 0L5.636 6.696a.75.75 0 0 1 1.06-1.061l1.062 1.06a.75.75 0 0 1 0 1.062ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
  </svg>
);

const MonitorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path fillRule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v9.75c0 .83.672 1.5 1.5 1.5h13.5c.828 0 1.5-.67 1.5-1.5V5.25c0-.828-.672-1.5-1.5-1.5H5.25c-.828 0-1.5.672-1.5 1.5Z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
);

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
  </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────────

const ICON_CLS = "w-4 h-4 sm:w-[18px] sm:h-[18px] text-white/70";

const THEME_OPTIONS = [
  { value: "light",  label: "Light",  icon: <SunIcon className={ICON_CLS} /> },
  { value: "dark",   label: "Dark",   icon: <MoonIcon className={ICON_CLS} /> },
  { value: "system", label: "System", icon: <MonitorIcon className={ICON_CLS} /> },
];

const LANG_OPTIONS: { value: Language; label: string; flag: string; code: string }[] = [
  { value: "nn", label: "Nynorsk", flag: "🇳🇴", code: "NN" },
  { value: "no", label: "Bokmål",  flag: "🇩🇰", code: "NO" },
  { value: "en", label: "English", flag: "🇬🇧", code: "EN" },
];

// ── Shared dropdown primitives ────────────────────────────────────────────────

function DropdownShell({
  trigger,
  open,
  onOpen,
  onClose,
  children,
}: {
  trigger: React.ReactNode;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => (open ? onClose() : onOpen())}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
      >
        {trigger}
        <ChevronIcon className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-full mt-1.5 z-20 min-w-[160px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 z-30 rounded-xl shadow-lg overflow-hidden">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function DropdownItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm sm:text-base text-left transition-colors
        ${active
          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
    >
      {children}
      {active && <CheckIcon className="w-3.5 h-3.5 text-blue-500 ml-auto" />}
    </button>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

type OpenSection = "theme" | "lang" | null;

export default function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<OpenSection>(null);

  useEffect(() => { setMounted(true); }, []);

  const currentLang = LANG_OPTIONS.find((l) => l.value === language) ?? LANG_OPTIONS[1];
  const currentThemeIcon = mounted
    ? resolvedTheme === "dark" ? <MoonIcon className={ICON_CLS} /> : <SunIcon className={ICON_CLS} />
    : null;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Image
        src="/logo-revised.png"
        alt="Rekkferga"
        width={125}
        height={100}
        priority
        className="object-contain"
      />

      {mounted && (
        <div className="flex items-center gap-2">
          <DropdownShell
            trigger={
              <span className="text-sm font-semibold tracking-wide text-white/80">
                {currentLang.code}
              </span>
            }
            open={open === "lang"}
            onOpen={() => setOpen("lang")}
            onClose={() => setOpen(null)}
          >
            {LANG_OPTIONS.map((opt) => (
              <DropdownItem
                key={opt.value}
                active={language === opt.value}
                onClick={() => { setLanguage(opt.value); setOpen(null); }}
              >
                <span className="text-base leading-none">{opt.flag}</span>
                <span className="flex-1">{opt.label}</span>
              </DropdownItem>
            ))}
          </DropdownShell>

          <DropdownShell
            trigger={currentThemeIcon}
            open={open === "theme"}
            onOpen={() => setOpen("theme")}
            onClose={() => setOpen(null)}
          >
            {THEME_OPTIONS.map((opt) => (
              <DropdownItem
                key={opt.value}
                active={theme === opt.value}
                onClick={() => { setTheme(opt.value); setOpen(null); }}
              >
                {opt.icon}
                <span className="flex-1">{opt.label}</span>
              </DropdownItem>
            ))}
          </DropdownShell>
        </div>
      )}
    </div>
  );
}
