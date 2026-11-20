// List building blocks shared by the home lists, the search results and the suggestions, so
// they all read like the quay view: 16–19px names, 14–15px secondary text, 13px bold section
// labels, cards with the departure card's radius. Phones get the smaller sizes, from `sm` up the
// larger ones.

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mx-1 mt-1 text-[13px] font-bold text-text-secondary">{children}</h2>;
}

/** A card of rows separated by hairlines. */
export function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-surface-variant overflow-hidden rounded-[18px] bg-surface shadow-raised">{children}</div>
  );
}

/** A tappable list row: icon tile, then RowText, then any trailing mark. */
export const ROW =
  "flex min-h-[56px] w-full cursor-pointer items-center gap-3 px-3.5 py-2 sm:min-h-[64px] sm:py-2.5 text-left text-text-primary transition-colors hover:bg-surface-tint";
/** The secondary line under a row's name. */
export const ROW_SUB = "truncate text-[14px] leading-snug text-text-secondary sm:text-[15px]";

/** A row's name, bold, with an optional secondary line below it. */
export function RowText({ name, sub }: { name: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-[16px] font-bold leading-tight sm:text-[17px]">{name}</span>
      {sub && <span className={ROW_SUB}>{sub}</span>}
    </span>
  );
}

/** An icon in a tinted square; marks what kind of row it is. */
export function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-[34px] w-[34px] flex-none sm:h-[38px] sm:w-[38px] items-center justify-center rounded-[11px] bg-surface-variant text-water-light">
      {children}
    </span>
  );
}
