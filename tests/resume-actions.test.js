import { beforeEach, expect, it, vi } from "vitest";
import { resume } from "./fixtures";
const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), upsert: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/prisma", () => ({ db: { resume: { upsert: mocks.upsert } } }));
vi.mock("@/lib/ai", () => ({ generateContent: vi.fn() }));
vi.mock("@/lib/ai-quota", () => ({ reserveAIRequest: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveResume } from "@/actions/resume";
beforeEach(() => { vi.resetAllMocks(); mocks.requireUser.mockResolvedValue({ id: "user-1" }); });
it("uses the session owner and stores structured resume data", async () => {
  await saveResume({ content: "# Resume", formData: resume, userId: "other-user" });
  const query = mocks.upsert.mock.calls[0][0];
  expect(query.where.userId).toBe("user-1");
  expect(query.create.userId).toBe("user-1");
  expect(query.update.formData).toEqual(resume);
});
it("rejects invalid/oversized resume content before writing", async () => {
  await expect(saveResume({ content: " " })).rejects.toThrow();
  await expect(saveResume({ content: "x".repeat(100001) })).rejects.toThrow();
  expect(mocks.upsert).not.toHaveBeenCalled();
});
it("allows legacy Markdown without a form payload", async () => {
  await expect(saveResume({ content: "# Legacy resume", formData: null })).resolves.toBeUndefined();
  expect(mocks.upsert).toHaveBeenCalled();
});
