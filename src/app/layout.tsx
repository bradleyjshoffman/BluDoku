import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import "./scenes.css";
import "./features.css";
import { AppProvider } from "@/components/AppProvider";

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
      <body className={fredoka.className}>
        {/* Clips effects that fly past the screen edge, so phones never zoom out to fit them. */}
        <div className="app">
          <AppProvider>{children}</AppProvider>
        </div>
      </body>
    </html>
  );
}
