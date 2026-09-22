import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";
import { loadEnv, makePrisma } from "./client";

const IGNORE = /already exists/i;

function toIdempotent(sql: string): string {
  return sql
    .replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "')
    .replace(/CREATE (UNIQUE )?INDEX "/g, "CREATE $1INDEX IF NOT EXISTS \"");
}

function stripComments(stmt: string): string {
  return stmt
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .trim();
}

async function main() {
  loadEnv();
  const raw = execSync("npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script", {
    encoding: "utf8",
  });
  const sql = toIdempotent(raw);

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are not set");
  const client = createClient({ url, authToken });

  const statements = sql
    .split(";")
    .map(stripComments)
    .filter(Boolean);
  let applied = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      applied++;
    } catch (e) {
      if (IGNORE.test(String(e))) {
        skipped++;
        continue;
      }
      throw e;
    }
  }
  console.log(`Schema applied: ${applied} statements, ${skipped} already present.`);

  const check = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("Tables:", check.rows.map((r) => r.name).join(", "));

  client.close();
  const prisma = makePrisma();
  const users = await prisma.user.findMany({ select: { slug: true } });
  console.log(`Connectivity OK via Prisma. Users: ${users.length === 0 ? "(none yet)" : users.map((u) => u.slug).join(", ")}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
