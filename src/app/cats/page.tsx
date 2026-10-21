import type { Metadata } from "next";
import { CatCafe } from "@/components/CatCafe";

export const metadata: Metadata = { title: "Cat Café · BluDoku" };

export default function CatsPage() {
  return (
    <main className="page">
      <CatCafe />
    </main>
  );
}
