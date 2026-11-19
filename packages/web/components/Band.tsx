/**
 * The blue band directly under the app header: it continues the header's background and
 * holds whatever gives the content below its context (search field, quay header, back).
 *
 * `hero` (the home page when not searching): the band shrinks to a lip under the header and
 * its content (heading + large search field) sits below it on the page, in page colours.
 * The children keep their place in the tree either way, so the search field stays the same
 * element (and keeps focus) when the page switches between the two.
 */
export default function Band({ children, hero = false }: { children: React.ReactNode; hero?: boolean }) {
  return (
    <div
      className={
        hero
          ? "relative flex-shrink-0 px-4 pb-1 pt-10"
          : "flex-shrink-0 rounded-b-[28px] px-4 pb-[18px] pt-1"
      }
      style={hero ? { color: "var(--text-primary)" } : { backgroundColor: "var(--background)", color: "var(--text-on-water)" }}
    >
      {hero && <div aria-hidden className="absolute inset-x-0 top-0 h-4 rounded-b-[28px]" style={{ backgroundColor: "var(--background)" }} />}
      {children}
    </div>
  );
}
