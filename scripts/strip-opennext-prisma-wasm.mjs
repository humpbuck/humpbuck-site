import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const OPEN_NEXT_DIR = ".open-next";

function findWasmFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      found.push(...findWasmFiles(path));
    } else if (name.endsWith("_bg.wasm")) {
      found.push(path);
    }
  }
  return found;
}

try {
  const wasmFiles = findWasmFiles(OPEN_NEXT_DIR);
  if (wasmFiles.length === 0) {
    console.log("strip-opennext-prisma-wasm: no Prisma wasm files found under .open-next");
    process.exit(0);
  }

  for (const file of wasmFiles) {
    unlinkSync(file);
    console.log(`strip-opennext-prisma-wasm: removed ${file}`);
  }
} catch (error) {
  if (error instanceof Error && "code" in error && error.code === "ENOENT") {
    console.log("strip-opennext-prisma-wasm: .open-next not found, skipping");
    process.exit(0);
  }
  throw error;
}
