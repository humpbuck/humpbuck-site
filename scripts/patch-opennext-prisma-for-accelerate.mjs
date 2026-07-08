import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OPEN_NEXT_DIR = ".open-next";

const WASM_IMPORT_PATTERN =
  /import\s*\(\s*[^)]*query_compiler_bg\.wasm[^)]*\)/g;

const WASM_PATH_PATTERN = /["'`][^"'`]*query_compiler_bg\.wasm[^"'`]*["'`]/g;

function walkFiles(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      found.push(...walkFiles(path));
    } else {
      found.push(path);
    }
  }
  return found;
}

function patchTextFile(path) {
  if (!/\.(m?js|cjs|json)$/.test(path)) return false;

  const original = readFileSync(path, "utf8");
  if (!original.includes("query_compiler_bg.wasm")) return false;

  let content = original;
  content = content.replace(WASM_IMPORT_PATTERN, "Promise.resolve({})");
  content = content.replace(WASM_PATH_PATTERN, '""');

  if (content === original) return false;
  writeFileSync(path, content, "utf8");
  return true;
}

function patchWasmLoader(path) {
  writeFileSync(
    path,
    [
      "// Patched for Prisma Accelerate on Cloudflare Workers (no local query compiler wasm).",
      "export default Promise.resolve(new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])));",
      "",
    ].join("\n"),
    "utf8",
  );
}

try {
  const allFiles = walkFiles(OPEN_NEXT_DIR);
  let patchedCount = 0;

  for (const file of allFiles) {
    if (file.endsWith("wasm-worker-loader.mjs") || file.endsWith("wasm-edge-light-loader.mjs")) {
      patchWasmLoader(file);
      patchedCount += 1;
      console.log(`patch-opennext-prisma-for-accelerate: patched loader ${file}`);
      continue;
    }

    if (patchTextFile(file)) {
      patchedCount += 1;
      console.log(`patch-opennext-prisma-for-accelerate: patched ${file}`);
    }
  }

  const wasmFiles = allFiles.filter((file) => file.endsWith("_bg.wasm"));
  for (const file of wasmFiles) {
    unlinkSync(file);
    console.log(`patch-opennext-prisma-for-accelerate: removed ${file}`);
  }

  if (patchedCount === 0 && wasmFiles.length === 0) {
    console.log("patch-opennext-prisma-for-accelerate: no Prisma wasm references found under .open-next");
  }
} catch (error) {
  if (error instanceof Error && "code" in error && error.code === "ENOENT") {
    console.log("patch-opennext-prisma-for-accelerate: .open-next not found, skipping");
    process.exit(0);
  }
  throw error;
}
