import Link from "next/link";

export default function TripPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <p className="text-gray-400 text-sm">Trip view — coming in Phase 3</p>
      <Link href="/" className="text-blue-600 hover:underline text-sm">
        ← Back
      </Link>
    </div>
  );
}
