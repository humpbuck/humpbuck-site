/**
 * Apply scripts/ar-quality-fixes.json to ar-batch files and rebuild messages/ar.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixes = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/ar-quality-fixes.json"), "utf8")
);

const batches = {};
for (let i = 1; i <= 4; i++) {
  batches[i] = JSON.parse(
    fs.readFileSync(path.join(root, "scripts", `ar-batch${i}.json`), "utf8")
  );
}

let applied = 0;
for (const [p, v] of Object.entries(fixes)) {
  for (let i = 1; i <= 4; i++) {
    if (p in batches[i]) {
      batches[i][p] = v;
      applied++;
      break;
    }
  }
}

for (let i = 1; i <= 4; i++) {
  fs.writeFileSync(
    path.join(root, "scripts", `ar-batch${i}.json`),
    `${JSON.stringify(batches[i], null, 2)}\n`,
    "utf8"
  );
}

execSync("node scripts/build-ar-locale.mjs", { cwd: root, stdio: "inherit" });
console.log("Applied", applied, "quality fixes");
