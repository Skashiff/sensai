"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ensureIndustryInsights } from "@/lib/industry-insights";
import { profileSchema, parseInput } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function updateUser(input) {
  const user = await requireUser();
  const data = parseInput(profileSchema, input);
  // Shared insights are generated/cached before the atomic profile update.
  await ensureIndustryInsights(data.industry, user.id);
  await db.user.update({ where: { id: user.id }, data });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getUserOnboardingStatus() {
  const user = await requireUser();
  return { isOnboarded: Boolean(user.industry) };
}
