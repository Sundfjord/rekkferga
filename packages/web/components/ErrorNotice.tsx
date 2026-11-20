"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { WarningIcon } from "@/components/icons";

/**
 * Tells the user that data couldn't be fetched — so a failed request is never mistaken for
 * "no results". Announced to screen readers when it appears; optional retry button.
 */
export default function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useTranslation();
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[16px] border-[1.5px] border-margin-missed/35 px-3.5 py-2.5 text-[14px] text-text-primary sm:px-4 sm:py-3 sm:text-[15px]"
      style={{ backgroundColor: "color-mix(in srgb, var(--margin-missed) 8%, var(--surface))" }}
    >
      <WarningIcon className="mt-0.5 flex-shrink-0 text-margin-missed" />
      <span className="min-w-0 flex-1">
        {message}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 block cursor-pointer font-bold underline underline-offset-2"
          >
            {t("general.retry")}
          </button>
        )}
      </span>
    </div>
  );
}
