"use client";

import { useTranslation } from "@/hooks/useTranslation";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-blue-50 text-[14px] font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
        {n}
      </span>
      <span className="text-[16px] leading-snug">{children}</span>
    </li>
  );
}

/**
 * "How it works": what Rekkferga does and how to get started. The content of the header's
 * help dropdown, in the same colours as the language and theme menus.
 */
export default function HelpPanel() {
  const t = useTranslation();
  return (
    <div className="px-4 pb-4 pt-3.5 text-gray-700 dark:text-gray-300">
      <h2 className="text-[18px] font-bold leading-tight text-gray-900 dark:text-gray-100">{t("help.title")}</h2>
      <p className="mt-1.5 text-[16px] leading-snug text-gray-500 dark:text-gray-400">{t("help.intro")}</p>
      <ol className="mt-3.5 flex flex-col gap-3">
        {[1, 2, 3].map((s) => (
          <Step key={s} n={s}>
            {t(`help.step${s}`)}
          </Step>
        ))}
      </ol>
    </div>
  );
}
