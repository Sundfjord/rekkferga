// Small inline icons shared by the margin panel. Decorative: aria-hidden; the
// surrounding control carries the accessible name.

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

export const CloseIcon = ({ size = 22, className }: IconProps) => (
  <svg {...stroke(size, className, 2)}>
    <path d="M6 18L18 6M6 6l12 12" />
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

export const SearchIcon = ({ size = 20, className }: IconProps) => (
  <svg {...stroke(size, className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
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
