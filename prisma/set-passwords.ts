import { PrismaClient } from "../lib/generated/prisma/client";
import { makePrisma } from "./client";
import { hashPassword } from "../lib/auth";

const prisma: PrismaClient = makePrisma();

const PASSWORDS: Record<string, string> = {
  lekhana: process.env.PW_LEKHANA ?? "leki",
  akshaya: process.env.PW_AKSHAYA ?? "akki",
  nandhan: process.env.PW_NANDHAN ?? "nandhi",
};

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    const pw = PASSWORDS[u.slug];
    if (!pw) {
      console.log(`  skip ${u.slug} (no password configured)`);
      continue;
    }
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(pw) } });
    console.log(`  ${u.slug}: password set`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
