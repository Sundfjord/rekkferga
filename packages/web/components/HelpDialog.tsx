"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[14px] font-bold"
        style={{ backgroundColor: "var(--surface-variant)", color: "var(--water-light)" }}
      >
        {n}
      </span>
      <span className="pt-[3px] text-[15px] items-center leading-snug">{children}</span>
    </li>
  );
}

/**
 * "How it works": what Rekkferga does and how to get started, opened from the header's
 * question-mark button. A native modal <dialog> handles focus, Esc and the backdrop;
 * clicking the backdrop also closes it.
 */
export default function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // The content fills the dialog, so a click landing on the dialog itself is the backdrop.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[520px] overflow-y-auto rounded-[24px] p-0 shadow-[var(--shadow-elevated)] backdrop:bg-[rgba(1,22,56,0.5)]"
      style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font-dm-sans)" }}
    >
      <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <h2 id={titleId} className="text-[22px] font-bold leading-tight">
          {t("help.title")}
        </h2>
        <p className="mt-1.5 text-[15px] leading-snug" style={{ color: "var(--text-secondary)" }}>
          {t("help.intro")}
        </p>
        <ol className="mt-4 flex flex-col gap-3">
          <Step n={1}>{t("help.step1")}</Step>
          <Step n={2}>{t("help.step2")}</Step>
          <Step n={3}>{t("help.step3")} <span className="ml-1.5 inline-flex translate-y-[1px] gap-1" aria-hidden>
              {(["safe", "tight", "missed"] as const).map((tier) => (
                <span key={tier} className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--margin-${tier})` }} />
              ))}
            </span></Step>
        </ol>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-5 h-11 w-full cursor-pointer rounded-[14px] px-5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
          style={{ backgroundColor: "var(--water)" }}
        >
          {t("general.close")}
        </button>
      </div>
    </dialog>
  );
}
