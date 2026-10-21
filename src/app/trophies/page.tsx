import type { Metadata } from "next";
import { Trophies } from "@/components/Trophies";

export const metadata: Metadata = { title: "Trophies · BluDoku" };

export default function TrophiesPage() {
  return (
    <main className="page">
      <Trophies />
    </main>
  );
}
