import { execSync } from "node:child_process";
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

execSync("npx prisma generate", { stdio: "inherit" });
