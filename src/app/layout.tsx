import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import "./scenes.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "BluDoku: find the hidden cats",
  description: "A cute logic puzzle: one cat per row, column and color, and no two cats touching. 200 levels plus endless random puzzles.",
  appleWebApp: { capable: true, title: "BluDoku", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fff4ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={fredoka.className}>{children}</body>
    </html>
  );
}
