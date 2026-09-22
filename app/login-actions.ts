"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { setActiveSession } from "@/lib/session";
import { verifyPassword, hashPassword } from "@/lib/auth";

// Run scrypt even when the slug is unknown so response timing does not
// reveal whether an account exists.
const DUMMY_HASH_PROMISE = hashPassword("timing-equalizer");

export async function loginUser(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { slug } });
  if (user) {
    const ok = await verifyPassword(password, user.passwordHash);
    if (ok) {
      await setActiveSession(slug);
      revalidatePath("/", "layout");
      redirect("/");
    }
  } else {
    await verifyPassword(password, await DUMMY_HASH_PROMISE);
  }
  redirect("/login?error=1");
}
