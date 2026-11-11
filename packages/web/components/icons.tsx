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
