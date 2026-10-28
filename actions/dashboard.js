"use server";

import { requireUser } from "@/lib/auth";
import { ensureIndustryInsights } from "@/lib/industry-insights";
import { industrySchema, parseInput } from "@/lib/validation";

export async function getIndustryInsights() {
  const user = await requireUser();
  if (!user.industry) throw new Error("Complete your profile before opening industry insights");
  return ensureIndustryInsights(parseInput(industrySchema, user.industry), user.id);
}
