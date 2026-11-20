"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import HelpPanel from "@/components/HelpPanel";
import { CheckIcon, ChevronDownIcon, HelpIcon, MenuIcon, MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import type { Language } from "@shared/utils";

// ── Data ──────────────────────────────────────────────────────────────────────

// On the blue header (the menu buttons).
const ICON_CLS = "w-4 h-4 sm:w-[18px] sm:h-[18px] text-white/70";
// Inside a dropdown: takes the item's text colour, so it reads on the light and dark menu.
const MENU_ICON_CLS = "w-4 h-4 sm:w-[18px] sm:h-[18px]";

const THEME_OPTIONS = [
  { value: "light",  labelKey: "general.themeLight",  icon: <SunIcon className={MENU_ICON_CLS} /> },
  { value: "dark",   labelKey: "general.themeDark",   icon: <MoonIcon className={MENU_ICON_CLS} /> },
  { value: "system", labelKey: "general.themeSystem", icon: <MonitorIcon className={MENU_ICON_CLS} /> },
];

const LANG_OPTIONS: { value: Language; label: string; flag: string; code: string }[] = [
  { value: "nn", label: "Nynorsk", flag: "🇳🇴", code: "NN" },
  { value: "no", label: "Bokmål",  flag: "🇩🇰", code: "NO" },
  { value: "en", label: "English", flag: "🇬🇧", code: "EN" },
];

// ── Shared dropdown primitives ────────────────────────────────────────────────

function DropdownShell({
  trigger,
  label,
  open,
  onOpen,
  onClose,
  chevron = true,
  triggerClassName = "px-3 py-2",
  panelClassName = "min-w-[160px]",
  children,
}: {
  trigger: React.ReactNode;
  /** Accessible name (and tooltip) for the trigger; must contain any visible trigger text. */
  label: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** A chevron after the trigger (the desktop menus); the phone's hamburger has none. */
  chevron?: boolean;
  /** Trigger padding / size. */
  triggerClassName?: string;
  /** Panel width; menus size to their items, the help panel and phone menu are wider. */
  panelClassName?: string;
  children: React.ReactNode;
}) {
  // Esc closes an open dropdown, as clicking outside it does.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => (open ? onClose() : onOpen())}
        className={`flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/15 backdrop-blur-[8px] transition-colors ${triggerClassName}`}
      >
        {trigger}
        {chevron && <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className={`absolute right-0 top-full mt-1.5 z-30 ${panelClassName} bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden`}>
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
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

/** A labelled row of equal-width options, one of them active (the phone menu's language and theme). */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">{label}</span>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={`flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[14px] transition-colors ${
                active
                  ? "bg-white font-semibold text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-300"
                  : "text-gray-700 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-700/50"
              }`}
            >
              {opt.icon}
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

type OpenSection = "theme" | "lang" | "help" | "menu" | null;

/**
 * The blue app header: the logo, then the language, theme and help dropdowns. On a phone the
 * three collapse into one hamburger menu holding the same settings and the help text.
 */
export default function Header() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  // The theme is only known in the browser, so the menus render after mount.
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState<OpenSection>(null);
  const close = useCallback(() => setOpen(null), []);
  const t = useTranslation();

  useEffect(() => { setMounted(true); }, []);

  const currentLang = LANG_OPTIONS.find((l) => l.value === language) ?? LANG_OPTIONS[1];

  return (
    // The blue header is as wide as the page's centred column (app/page.tsx). On a phone that's
    // the full width; once the column is narrower than the window, its bottom corners round off.
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 bg-background px-4 py-2.5 sm:p-4 md:rounded-b-[24px] lg:p-6">
      <Image
        src="/logo-revised.png"
        alt="Rekkferga"
        width={125}
        height={73}
        priority
        className="h-auto w-[86px] object-contain sm:w-[125px]"
      />

      {mounted && (
        <>
          {/* Phone: one hamburger menu. */}
          <div className="sm:hidden">
            <DropdownShell
              trigger={<MenuIcon className="text-white/85" />}
              label={t("general.menu")}
              open={open === "menu"}
              onOpen={() => setOpen("menu")}
              onClose={close}
              chevron={false}
              triggerClassName="h-10 w-10 justify-center"
              panelClassName="w-[calc(100vw-32px)] max-h-[calc(100dvh-80px)] overflow-y-auto!"
            >
              <div className="flex flex-col gap-3 px-4 pb-4 pt-3.5">
                <Segmented
                  label={t("general.language")}
                  value={language}
                  options={LANG_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  onChange={setLanguage}
                />
                <Segmented
                  label={t("general.theme")}
                  value={theme}
                  options={THEME_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey), icon: o.icon }))}
                  onChange={setTheme}
                />
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800">
                <HelpPanel />
              </div>
            </DropdownShell>
          </div>

          {/* Wider screens: the three dropdowns. */}
          <div className="hidden items-center gap-2 sm:flex">
            <DropdownShell
              trigger={
                <span className="text-sm font-semibold tracking-wide text-white/80">
                  {currentLang.code}
                </span>
              }
              label={`${t("general.language")}: ${currentLang.code}`}
              open={open === "lang"}
              onOpen={() => setOpen("lang")}
              onClose={close}
            >
              {LANG_OPTIONS.map((opt) => (
                <DropdownItem
                  key={opt.value}
                  active={language === opt.value}
                  onClick={() => { setLanguage(opt.value); close(); }}
                >
                  <span className="text-base leading-none" aria-hidden>{opt.flag}</span>
                  <span className="flex-1">{opt.label}</span>
                </DropdownItem>
              ))}
            </DropdownShell>

            <DropdownShell
              trigger={resolvedTheme === "dark" ? <MoonIcon className={ICON_CLS} /> : <SunIcon className={ICON_CLS} />}
              label={t("general.theme")}
              open={open === "theme"}
              onOpen={() => setOpen("theme")}
              onClose={close}
            >
              {THEME_OPTIONS.map((opt) => (
                <DropdownItem
                  key={opt.value}
                  active={theme === opt.value}
                  onClick={() => { setTheme(opt.value); close(); }}
                >
                  {opt.icon}
                  <span className="flex-1">{t(opt.labelKey)}</span>
                </DropdownItem>
              ))}
            </DropdownShell>

            <DropdownShell
              trigger={<HelpIcon className={ICON_CLS} />}
              label={t("help.open")}
              open={open === "help"}
              onOpen={() => setOpen("help")}
              onClose={close}
              panelClassName="w-[min(450px,calc(100vw-32px))]"
            >
              <HelpPanel />
            </DropdownShell>
          </div>
        </>
      )}
    </header>
  );
}
