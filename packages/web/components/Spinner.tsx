export default function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`${className} inline-block flex-shrink-0 rounded-full border-2 animate-spin`}
      style={{ borderColor: "var(--water-light)", borderTopColor: "transparent" }}
      aria-hidden
    />
  );
}
