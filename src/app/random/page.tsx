import { Suspense } from "react";
import type { Metadata } from "next";
import { RandomGame } from "@/components/RandomGame";

export const metadata: Metadata = { title: "Random puzzle · BluDoku" };

export default function RandomPage() {
  return (
    <main className="page">
      <Suspense>
        <RandomGame />
      </Suspense>
    </main>
  );
}
