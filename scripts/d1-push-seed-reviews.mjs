/**
 * Push synthetic PDP reviews from local prisma/dev.db to production Cloudflare D1.
 *
 * Workflow:
 *   npm run db:d1:pull          # optional but recommended — match live catalog
 *   npm run db:seed-reviews     # writes seed users + reviews into prisma/dev.db
 *   npm run db:seed-reviews:remote
 *
 * Requires: `npx wrangler login` and network access.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const localDb = path.join(root, "prisma", "dev.db");
const sqlOut = path.join(root, ".tmp", "d1-seed-reviews-push.sql");
const SEED_EMAIL_SUFFIX = "@reviews.seed.humpbuck";

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    encoding: "utf-8",
    shell: true,
    cwd: root,
  });
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    if (out) console.error(out);
    process.exit(result.status ?? 1);
  }
  return out;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlDate(value) {
  if (!value) return "NULL";
  const d = value instanceof Date ? value : new Date(value);
  return sqlString(d.toISOString());
}

if (!fs.existsSync(localDb)) {
  console.error("Missing prisma/dev.db — run npm run db:d1:pull or db:migrate first.");
  process.exit(1);
}

const client = createClient({ url: `file:${localDb}` });

const users = (
  await client.execute({
    sql: `SELECT id, name, firstName, lastName, displayName, email, image
          FROM User
          WHERE email LIKE ?`,
    args: [`%${SEED_EMAIL_SUFFIX}`],
  })
).rows;

if (users.length === 0) {
  console.error("No seed reviewers in prisma/dev.db — run npm run db:seed-reviews first.");
  client.close();
  process.exit(1);
}

const userIds = users.map((u) => String(u.id));
const placeholders = userIds.map(() => "?").join(", ");
const reviews = (
  await client.execute({
    sql: `SELECT id, userId, orderId, productSlug, rating, body, imageUrlsJson, status,
                 merchantReply, merchantRepliedAt, createdAt, updatedAt
          FROM ProductReview
          WHERE userId IN (${placeholders})`,
    args: userIds,
  })
).rows;

client.close();

const lines = [
  "-- HUMPBUCK seed reviews push (safe to re-run)",
  `DELETE FROM ProductReview WHERE userId IN (SELECT id FROM User WHERE email LIKE '%${SEED_EMAIL_SUFFIX}');`,
  `DELETE FROM User WHERE email LIKE '%${SEED_EMAIL_SUFFIX}';`,
];

for (const u of users) {
  lines.push(
    `INSERT INTO User (id, name, firstName, lastName, displayName, email, image) VALUES (${[
      sqlString(u.id),
      u.name == null ? "NULL" : sqlString(u.name),
      u.firstName == null ? "NULL" : sqlString(u.firstName),
      u.lastName == null ? "NULL" : sqlString(u.lastName),
      u.displayName == null ? "NULL" : sqlString(u.displayName),
      u.email == null ? "NULL" : sqlString(u.email),
      u.image == null ? "NULL" : sqlString(u.image),
    ].join(", ")});`,
  );
}

for (const r of reviews) {
  lines.push(
    `INSERT INTO ProductReview (id, userId, orderId, productSlug, rating, body, imageUrlsJson, status, merchantReply, merchantRepliedAt, createdAt, updatedAt) VALUES (${[
      sqlString(r.id),
      sqlString(r.userId),
      r.orderId == null ? "NULL" : sqlString(r.orderId),
      sqlString(r.productSlug),
      Number(r.rating),
      sqlString(r.body),
      sqlString(r.imageUrlsJson ?? "[]"),
      sqlString(r.status ?? "approved"),
      r.merchantReply == null ? "NULL" : sqlString(r.merchantReply),
      sqlDate(r.merchantRepliedAt),
      sqlDate(r.createdAt),
      sqlDate(r.updatedAt),
    ].join(", ")});`,
  );
}

fs.mkdirSync(path.dirname(sqlOut), { recursive: true });
fs.writeFileSync(sqlOut, `${lines.join("\n")}\n`);

console.log(
  `Prepared ${users.length} seed user(s) and ${reviews.length} review(s) → ${path.relative(root, sqlOut)}`,
);
console.log("Applying to remote D1…");

run("npx", ["wrangler", "d1", "execute", "humpbuck-site", "--remote", `--file=${sqlOut}`]);

console.log("Done. Seed reviews are live on production D1.");
