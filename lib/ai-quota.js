import "server-only";
import { db } from "@/lib/prisma";

export const AI_REQUESTS_PER_HOUR = 20;

// An atomic database increment works across application instances.
export async function reserveAIRequest(userId) {
  const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000);
  const usage = await db.aiUsage.upsert({
    where: { userId_windowStart: { userId, windowStart } },
    create: { userId, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (usage.count > AI_REQUESTS_PER_HOUR) {
    throw new Error("You have reached the hourly AI limit. Please try again next hour.");
  }
}
