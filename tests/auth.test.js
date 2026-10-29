import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), findUnique: vi.fn(), checkUser: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ db: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/checkUser", () => ({ checkUser: mocks.checkUser }));
import { requireUser } from "@/lib/auth";
beforeEach(() => vi.resetAllMocks());
it("rejects a missing session before accessing the database", async () => {
  mocks.auth.mockResolvedValue({ userId: null });
  await expect(requireUser()).rejects.toThrow("Unauthorized");
  expect(mocks.findUnique).not.toHaveBeenCalled();
  expect(mocks.checkUser).not.toHaveBeenCalled();
});
it("finds the database user by the authenticated Clerk id", async () => {
  mocks.auth.mockResolvedValue({ userId: "clerk-1" });
  mocks.findUnique.mockResolvedValue({ id: "db-1" });
  expect(await requireUser()).toEqual({ id: "db-1" });
  expect(mocks.findUnique).toHaveBeenCalledWith({ where: { clerkUserId: "clerk-1" } });
});
it("initializes a first-time user even if the header has not created the profile yet", async () => {
  mocks.auth.mockResolvedValue({ userId: "clerk-1" });
  mocks.findUnique.mockResolvedValue(null);
  mocks.checkUser.mockResolvedValue({ id: "new-user" });
  expect(await requireUser()).toEqual({ id: "new-user" });
});
