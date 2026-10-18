import Link from "next/link";
import { CatIcon } from "@/components/CatIcon";
import { ThemeScene } from "@/components/ThemeScene";

export default function NotFound() {
  return (
    <main className="page">
      <div className="home theme-light not-found">
        <ThemeScene chapter="kitten" />
        <CatIcon className="hero-cat" sleepy />
        <h1>This cat wandered off</h1>
        <p>We couldn’t find that page. Maybe it’s napping somewhere.</p>
        <Link href="/" className="btn btn-primary btn-big">
          Back to BluDoku
        </Link>
      </div>
    </main>
  );
}
