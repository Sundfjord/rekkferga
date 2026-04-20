"use client";

import { useState } from "react";
import Search from "@/components/Search";
import Journey from "@/components/Journey";
import type { ResultItem } from "@shared/types";

export default function Home() {
  const [destination, setDestination] = useState<ResultItem | null>(null);

  if (destination) {
    return (
      <Journey
        destination={destination}
        onExit={() => setDestination(null)}
      />
    );
  }

  return <Search onSelect={setDestination} />;
}
