import { beforeEach, describe, expect, it, vi } from "vitest";
import { questions } from "./fixtures";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(), generateContent: vi.fn(), reserveAIRequest: vi.fn(),
  db: { quizAttempt: { create: vi.fn(), findFirst: vi.fn() }, assessment: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() } },
}));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("@/lib/ai", () => ({ generateContent: mocks.generateContent }));
vi.mock("@/lib/ai-quota", () => ({ reserveAIRequest: mocks.reserveAIRequest }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { generateQuiz, saveQuizResult } from "@/actions/interview";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "user-1", industry: "tech-software-development", skills: ["SQL"] });
  mocks.generateContent.mockResolvedValue({ questions });
  mocks.db.quizAttempt.create.mockResolvedValue({ id: "attempt-1" });
  mocks.db.quizAttempt.findFirst.mockResolvedValue({ id: "attempt-1", userId: "user-1", questions, expiresAt: new Date(Date.now() + 60000), assessment: null });
  mocks.db.assessment.create.mockImplementation(async ({ data }) => ({ id: "result-1", ...data }));
});

describe("quiz security and persistence", () => {
  it("rejects unauthenticated requests before calling AI or the database", async () => {
    mocks.requireUser.mockRejectedValue(new Error("Unauthorized"));
    await expect(generateQuiz()).rejects.toThrow("Unauthorized");
    await expect(saveQuizResult({})).rejects.toThrow("Unauthorized");
    expect(mocks.generateContent).not.toHaveBeenCalled();
    expect(mocks.db.quizAttempt.create).not.toHaveBeenCalled();
  });
  it("stores the answer key and returns only public questions", async () => {
    const result = await generateQuiz();
    expect(result).toEqual({ attemptId: "attempt-1", questions: questions.map(({ question, options }) => ({ question, options })) });
    expect(JSON.stringify(result)).not.toContain("correctAnswer");
    expect(JSON.stringify(result)).not.toContain("explanation");
    expect(mocks.db.quizAttempt.create.mock.calls[0][0].data.questions).toEqual(questions);
  });
  it("calculates the score from stored answers", async () => {
    const answers = questions.map((_, index) => index < 7 ? "A" : "B");
    const result = await saveQuizResult({ attemptId: "attempt-1", answers });
    expect(result.quizScore).toBe(70);
    expect(result.questions.filter((q) => q.isCorrect)).toHaveLength(7);
  });
  it("rejects a caller-provided score and answer key", async () => {
    await expect(saveQuizResult({ attemptId: "attempt-1", answers: Array(10).fill("A"), score: 999, questions })).rejects.toThrow();
    expect(mocks.db.assessment.create).not.toHaveBeenCalled();
  });
  it("scopes attempts to their owner", async () => {
    mocks.db.quizAttempt.findFirst.mockResolvedValue(null);
    await expect(saveQuizResult({ attemptId: "another-user-attempt", answers: Array(10).fill("A") })).rejects.toThrow("not found");
    expect(mocks.db.quizAttempt.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "another-user-attempt", userId: "user-1" } }));
    expect(mocks.db.assessment.create).not.toHaveBeenCalled();
  });
  it("rejects expired attempts and invalid answer choices", async () => {
    mocks.db.quizAttempt.findFirst.mockResolvedValueOnce({ questions, expiresAt: new Date(0) });
    await expect(saveQuizResult({ attemptId: "attempt-1", answers: Array(10).fill("A") })).rejects.toThrow("expired");
    await expect(saveQuizResult({ attemptId: "attempt-1", answers: Array(10).fill("E") })).rejects.toThrow("valid answer");
    expect(mocks.db.assessment.create).not.toHaveBeenCalled();
  });
  it("returns an existing result on retry", async () => {
    const saved = { id: "result-1", quizScore: 80 };
    mocks.db.quizAttempt.findFirst.mockResolvedValue({ assessment: saved, expiresAt: new Date(0) });
    expect(await saveQuizResult({ attemptId: "attempt-1", answers: Array(10).fill("A") })).toEqual(saved);
    expect(mocks.db.assessment.create).not.toHaveBeenCalled();
  });
  it("handles simultaneous submissions using the unique attempt constraint", async () => {
    const saved = { id: "result-1", userId: "user-1", quizScore: 100 };
    mocks.db.assessment.create.mockRejectedValue({ code: "P2002" });
    mocks.db.assessment.findUnique.mockResolvedValue(saved);
    expect(await saveQuizResult({ attemptId: "attempt-1", answers: Array(10).fill("A") })).toEqual(saved);
  });
});
