import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const inputDir = process.env.MAKEFUN_INPUT_DIR ?? here;
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? join(here, "output");

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;

function verifyWrittenFile(writtenPath, sourceBytes) {
  const out = readFileSync(writtenPath);
  if (!out.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("output is not a PNG (bad signature)");
  }
  const width = out.readUInt32BE(16);
  const height = out.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    throw new Error(`output is ${width}x${height}, expected 1024x1024`);
  }
  if (out.length > MAX_BYTES) {
    throw new Error(`output is ${out.length} bytes, over the 1 MiB limit`);
  }
  if (!out.equals(sourceBytes)) {
    throw new Error("output bytes differ from the source image");
  }
  return out.length;
}

const source = join(inputDir, "entry.png");
const image = readFileSync(source);
mkdirSync(outputDir, { recursive: true });
const target = join(outputDir, "entry.png");
writeFileSync(target, image);
const checked = verifyWrittenFile(target, image);
console.log(`wrote entry.png (${checked} bytes) to ${outputDir} — verified PNG 1024x1024, byte-identical`);
