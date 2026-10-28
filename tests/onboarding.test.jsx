import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), ensure: vi.fn(), update: vi.fn(), status: vi.fn(), insights: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/prisma", () => ({ db: { user: { update: mocks.update } } }));
vi.mock("@/lib/industry-insights", () => ({ ensureIndustryInsights: mocks.ensure }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/actions/dashboard", () => ({ getIndustryInsights: mocks.insights }));
import { updateUser } from "@/actions/user";
import { industries } from "@/data/industries";

const industry = `${industries[0].id}-${industries[0].subIndustries[0].toLowerCase().replace(/ /g, "-")}`;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "user-1", industry: null });
});
it("redirects a new user before attempting to generate insights", async () => {
  const { default: Dashboard } = await import("@/app/(main)/dashboard/page.jsx");
  await expect(Dashboard()).rejects.toThrow("redirect:/onboarding");
  expect(mocks.insights).not.toHaveBeenCalled();
});
it("does not update the profile when AI generation fails", async () => {
  mocks.ensure.mockRejectedValue(new Error("AI unavailable"));
  await expect(updateUser({ industry, experience: 0, skills: [] })).rejects.toThrow("AI unavailable");
  expect(mocks.update).not.toHaveBeenCalled();
});
it("waits for shared insights before performing the profile update", async () => {
  const calls = [];
  mocks.ensure.mockImplementation(async () => { calls.push("insights"); });
  mocks.update.mockImplementation(async () => { calls.push("profile"); });
  await updateUser({ industry, experience: 0, skills: [] });
  expect(calls).toEqual(["insights", "profile"]);
  expect(mocks.update.mock.calls[0][0].data.skills).toEqual([]);
});
it("rejects invalid industries and experience at the server boundary", async () => {
  await expect(updateUser({ industry: "made-up", experience: -1, skills: [] })).rejects.toThrow();
  expect(mocks.ensure).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});
