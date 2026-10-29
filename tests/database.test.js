// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { questions, resume } from "./fixtures";

const databaseSuite = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;
databaseSuite("PostgreSQL persistence and constraints", () => {
  let db;
  let user;
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error("Use a disposable DATABASE_URL for integration tests");
    const url = new URL(process.env.DATABASE_URL);
    url.searchParams.set("connection_limit", "1");
    db = new PrismaClient({ datasourceUrl: url.toString() });
    const suffix = randomUUID();
    user = await db.user.create({ data: { clerkUserId: `test-${suffix}`, email: `${suffix}@example.com`, skills: [] } });
  });
  afterAll(async () => {
    if (user) {
      await db.assessment.deleteMany({ where: { userId: user.id } });
      await db.resume.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
    await db?.$disconnect();
  });
  it("keeps legacy Markdown and round-trips structured resume fields", async () => {
    const legacy = await db.resume.create({ data: { userId: user.id, content: "# Legacy resume" } });
    expect(legacy.formData).toBeNull();
    await db.resume.update({ where: { userId: user.id }, data: { content: "# Updated resume", formData: resume } });
    const saved = await db.resume.findUnique({ where: { userId: user.id } });
    expect(saved.formData).toEqual(resume);
    expect(saved.content).toBe("# Updated resume");
  });
  it("enforces one assessment per quiz attempt and persists the relation", async () => {
    const attempt = await db.quizAttempt.create({ data: { userId: user.id, questions, expiresAt: new Date(Date.now() + 60000) } });
    const data = { userId: user.id, quizAttemptId: attempt.id, quizScore: 100, questions: [], category: "Technical" };
    const assessment = await db.assessment.create({ data });
    await expect(db.assessment.create({ data })).rejects.toMatchObject({ code: "P2002" });
    const saved = await db.quizAttempt.findFirst({ where: { id: attempt.id, userId: user.id }, include: { assessment: true } });
    expect(saved.assessment.id).toBe(assessment.id);
    expect(saved.questions).toEqual(questions);
  });
  it("increments hourly AI usage atomically under concurrent requests", async () => {
    const windowStart = new Date("2026-10-28T12:00:00Z");
    const increment = () => db.aiUsage.upsert({
      where: { userId_windowStart: { userId: user.id, windowStart } },
      create: { userId: user.id, windowStart, count: 1 }, update: { count: { increment: 1 } },
    });
    await Promise.all(Array.from({ length: 25 }, increment));
    expect((await db.aiUsage.findUnique({ where: { userId_windowStart: { userId: user.id, windowStart } } })).count).toBe(25);
  });
});
