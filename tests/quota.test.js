import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ upsert: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ db: { aiUsage: { upsert: mocks.upsert } } }));
import { reserveAIRequest } from "@/lib/ai-quota";
beforeEach(() => mocks.upsert.mockReset());
it("allows the last request in a window and rejects the next", async () => {
  mocks.upsert.mockResolvedValueOnce({ count: 20 }).mockResolvedValueOnce({ count: 21 });
  await expect(reserveAIRequest("user-1")).resolves.toBeUndefined();
  await expect(reserveAIRequest("user-1")).rejects.toThrow("hourly AI limit");
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
    where: { userId_windowStart: { userId: "user-1", windowStart: expect.any(Date) } }, update: { count: { increment: 1 } },
  }));
});
