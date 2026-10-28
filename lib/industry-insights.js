import "server-only";
import { db } from "@/lib/prisma";
import { generateContent } from "@/lib/ai";
import { reserveAIRequest } from "@/lib/ai-quota";
import { insightsSchema } from "@/lib/ai-schemas";

export async function generateIndustryInsights(industry) {
  return generateContent(`Provide illustrative career insights for the ${industry} industry.
Use annual US-market salaries in USD, not thousands. Supply at least five roles, skills and trends.
Estimate growth as a percentage. These are AI-generated estimates, not verified live market statistics.
Return the requested JSON structure.`, insightsSchema);
}

export async function ensureIndustryInsights(industry, userId) {
  const cached = await db.industryInsight.findUnique({ where: { industry } });
  if (cached) return cached;
  await reserveAIRequest(userId);
  // Never hold a database transaction open while waiting for the model.
  const insights = await generateIndustryInsights(industry);
  return db.industryInsight.upsert({
    where: { industry },
    create: { industry, ...insights, nextUpdate: new Date(Date.now() + 7 * 86400000) },
    update: {},
  });
}
