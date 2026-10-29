import { expect, it } from "vitest";
import { onboardingSchema, entrySchema } from "@/app/lib/schema";
import { resumeToMarkdown } from "@/lib/resume-markdown";
import { resume } from "./fixtures";
it("rejects a missing specialization and fractional/invalid experience", () => {
  expect(onboardingSchema.safeParse({ industry: "tech", subIndustry: "", experience: "0", skills: "" }).success).toBe(false);
  expect(onboardingSchema.safeParse({ industry: "tech", subIndustry: "Software", experience: "1abc", skills: "" }).success).toBe(false);
  expect(onboardingSchema.safeParse({ industry: "tech", subIndustry: "Software", experience: "0", skills: "" }).data.skills).toEqual([]);
});
it("preserves raw month values and rejects reversed dates", () => {
  const entry = { title: "Analyst", organization: "Company", startDate: "2026-01", endDate: "2026-06", description: "Built reports", current: false };
  expect(entrySchema.parse(entry).startDate).toBe("2026-01");
  expect(entrySchema.safeParse({ ...entry, endDate: "2025-12" }).success).toBe(false);
  const markdown = resumeToMarkdown({ ...resume, experience: [entry] }, "Candidate");
  expect(markdown).toContain("Jan 2026 - Jun 2026");
});
