import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const {
  loadProjectEnv,
  applyLocalDatabaseEnvOverride,
} = require("../scripts/load-project-env.mjs") as typeof import("../scripts/load-project-env.mjs");
