/**
 * Trims leading/trailing silence from the 16-bit mono WAV clips in public/sounds.
 *   node scripts/trim-sounds.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "public/sounds";
const THRESHOLD = 600; // out of 32767
const PAD = 0.03; // seconds kept around the sound

for (const name of readdirSync(dir).filter((f) => f.endsWith(".wav"))) {
  const buf = readFileSync(join(dir, name));
  // Walk the RIFF chunks to find "fmt " and "data".
  let pos = 12;
  let fmt = null;
  let data = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === "fmt ") fmt = { rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22), channels: buf.readUInt16LE(pos + 10) };
    if (id === "data") data = buf.subarray(pos + 8, pos + 8 + size);
    pos += 8 + size + (size % 2);
  }
  if (!fmt || !data || fmt.bits !== 16 || fmt.channels !== 1) throw new Error(`${name}: unexpected format`);
  const samples = new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
  let first = samples.findIndex((s) => Math.abs(s) > THRESHOLD);
  let last = samples.length - 1;
  while (last > 0 && Math.abs(samples[last]) <= THRESHOLD) last--;
  const pad = Math.round(PAD * fmt.rate);
  first = Math.max(0, first - pad);
  last = Math.min(samples.length - 1, last + pad);
  const trimmed = samples.slice(first, last + 1);

  const out = Buffer.alloc(44 + trimmed.length * 2);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + trimmed.length * 2, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(fmt.rate, 24);
  out.writeUInt32LE(fmt.rate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(trimmed.length * 2, 40);
  Buffer.from(trimmed.buffer).copy(out, 44);
  writeFileSync(join(dir, name), out);
  console.log(`${name}: ${(samples.length / fmt.rate).toFixed(2)}s -> ${(trimmed.length / fmt.rate).toFixed(2)}s`);
}
