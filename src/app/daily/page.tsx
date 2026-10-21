import type { Metadata } from "next";
import { DailyGame } from "@/components/DailyGame";

export const metadata: Metadata = { title: "Daily puzzle · BluDoku" };

export default function DailyPage() {
  return (
    <main className="page">
      <DailyGame />
    </main>
  );
}
