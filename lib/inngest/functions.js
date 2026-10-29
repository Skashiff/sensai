import { db } from "@/lib/prisma";
import { generateIndustryInsights as generateInsights } from "@/lib/industry-insights";
import { inngest } from "./client";

export const generateIndustryInsights = inngest.createFunction(
  { id: "generate-industry-insights", name: "Generate Industry Insights", concurrency: { limit: 1 } },
  { cron: "0 0 * * 0" },
  async ({ step }) => {
    const industries = await step.run("fetch-industries", () => db.industryInsight.findMany({ select: { industry: true } }));
    for (const { industry } of industries) {
      // Each industry has a distinct checkpoint; retries do not repeat completed updates.
      const insights = await step.run(`generate-${industry}`, () => generateInsights(industry));
      await step.run(`update-${industry}`, () => db.industryInsight.update({
        where: { industry },
        data: { ...insights, lastUpdated: new Date(), nextUpdate: new Date(Date.now() + 7 * 86400000) },
      }));
    }
    await step.run("clean-expired-usage-and-quizzes", async () => {
      await db.aiUsage.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 2 * 86400000) } } });
      await db.quizAttempt.deleteMany({ where: { expiresAt: { lt: new Date() }, assessment: { is: null } } });
    });
    return { updated: industries.length };
  },
);
