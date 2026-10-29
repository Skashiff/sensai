import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/lib/prisma", () => ({ db: { user: { findUnique: mocks.findUnique, upsert: mocks.upsert } } }));
import { checkUser } from "@/lib/checkUser";
beforeEach(() => vi.resetAllMocks());
it("upserts first-time profiles using the primary email instead of array order", async () => {
  mocks.currentUser.mockResolvedValue({ id: "clerk-1", firstName: "Candidate", lastName: null, primaryEmailAddressId: "primary", emailAddresses: [
    { id: "secondary", emailAddress: "secondary@example.com" }, { id: "primary", emailAddress: "primary@example.com" },
  ] });
  mocks.findUnique.mockResolvedValue(null);
  await checkUser();
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
    where: { clerkUserId: "clerk-1" }, create: expect.objectContaining({ email: "primary@example.com", name: "Candidate", skills: [] }),
  }));
});
