/**
 * The blue band directly under the app header: it continues the header's background and
 * holds whatever gives the content below its context (search field, quay header, back).
 */
export default function Band({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-shrink-0 rounded-b-[28px] px-4 pb-[18px] pt-1"
      style={{ backgroundColor: "var(--background)", color: "var(--text-on-water)" }}
    >
      {children}
    </div>
  );
}
