// Small inline icons. Decorative: aria-hidden; the surrounding control carries the
// accessible name.

type IconProps = { size?: number; className?: string };

const stroke = (size: number, className?: string, width = 2.2) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const HeartIcon = ({ size = 24, className, filled }: IconProps & { filled: boolean }) => (
  <svg {...stroke(size, className, 1.8)} fill={filled ? "currentColor" : "none"}>
    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

export const ChevronRightIcon = ({ size = 22, className }: IconProps) => (
  <svg {...stroke(size, className)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ChevronLeftIcon = ({ size = 22, className }: IconProps) => (
  <svg {...stroke(size, className)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const CloseIcon = ({ size = 22, className }: IconProps) => (
  <svg {...stroke(size, className)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const SearchIcon = ({ size = 20, className }: IconProps) => (
  <svg {...stroke(size, className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const FerryIcon = ({ size = 20, className }: IconProps) => (
  <svg {...stroke(size, className, 2)}>
    <path d="M3 16h18l-2.2 4.5H5.2z" />
    <path d="M6 16v-4.5h12V16" />
    <path d="M10 11.5V8h4v3.5" />
  </svg>
);

export const PlaceIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path
      fillRule="evenodd"
      d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.003 3.5-4.567 3.5-7.327a6.79 6.79 0 0 0-13.58 0c0 2.76 1.556 5.323 3.5 7.327a19.579 19.579 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      clipRule="evenodd"
    />
  </svg>
);

export const WarningIcon = ({ size = 20, className }: IconProps) => (
  <svg {...stroke(size, className, 2)}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </svg>
);

// Solid icons for the header menus, sized by className.

export const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 4.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 4.5ZM18.364 6.343a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 1 1-1.062-1.061l1.061-1.061a.75.75 0 0 1 1.061 0ZM19.5 12a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM16.243 17.303a.75.75 0 0 1-1.061 0l-1.061-1.06a.75.75 0 1 1 1.06-1.062l1.062 1.061a.75.75 0 0 1 0 1.061ZM12 18a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 18ZM7.757 16.243a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.061a.75.75 0 0 1 1.061 0ZM4.5 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 4.5 12ZM7.757 7.757a.75.75 0 0 1-1.061 0L5.636 6.696a.75.75 0 0 1 1.06-1.061l1.062 1.06a.75.75 0 0 1 0 1.062ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
  </svg>
);

export const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
  </svg>
);

export const MonitorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path fillRule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v9.75c0 .83.672 1.5 1.5 1.5h13.5c.828 0 1.5-.67 1.5-1.5V5.25c0-.828-.672-1.5-1.5-1.5H5.25c-.828 0-1.5.672-1.5 1.5Z" clipRule="evenodd" />
  </svg>
);

export const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
);

export const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
  </svg>
);

export const HelpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9.25" />
    <path d="M9.5 9.25a2.6 2.6 0 0 1 5.05.85c0 1.75-2.55 2.3-2.55 3.9" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);
