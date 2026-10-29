import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  // Header and page renders can run concurrently on the first sign-in.
  const user = await db.user.findUnique({ where: { clerkUserId: userId } }) || await checkUser();
  if (!user) throw new Error("Unable to load your profile. Please sign in again.");
  return user;
}
