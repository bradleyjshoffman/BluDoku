/**
 * Writes the app icon SVG (Blu on a soft blue tile) to src/app/icon.svg.
 *   npx tsx scripts/make-icon.tsx
 */
import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { CatIcon } from "../src/components/CatIcon";

const cat = renderToStaticMarkup(<CatIcon />)
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>$/, "");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="22" fill="#cfd9ff"/>
<circle cx="50" cy="54" r="40" fill="#e3e9ff"/>
<g transform="translate(13 12) scale(0.74)">${cat}</g>
</svg>
`;
writeFileSync("src/app/icon.svg", svg);
console.log("Wrote src/app/icon.svg");
