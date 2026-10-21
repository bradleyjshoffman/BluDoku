import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LevelGame } from "@/components/LevelGame";
import { chapterIndexOf } from "@/lib/chapters";
import { LEVEL_COUNT } from "@/lib/puzzle/levels";
import { getLevel } from "@/lib/levelData";

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: LEVEL_COUNT }, (_, i) => ({ id: String(i + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Level ${id} · BluDoku` };
}

export default async function LevelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const level = getLevel(Number(id));
  if (!level) notFound();
  return (
    <main className="page">
      <LevelGame
        key={level.id}
        level={level}
        chapter={chapterIndexOf(level.id)}
        nextHref={level.id < LEVEL_COUNT ? `/level/${level.id + 1}/` : undefined}
      />
    </main>
  );
}
