import { z } from "zod";
import { industries } from "@/data/industries";
import { resumeSchema } from "@/app/lib/schema";

const industryIds = new Set(industries.flatMap(({ id, subIndustries }) =>
  subIndustries.map((name) => `${id}-${name.toLowerCase().replace(/ /g, "-")}`)
));
export const industrySchema = z.string().max(200).refine((id) => industryIds.has(id), "Select a valid industry and specialization");
export const profileSchema = z.object({
  industry: industrySchema,
  experience: z.number().int().min(0).max(50),
  bio: z.string().trim().max(500).optional().default(""),
  skills: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
});
export const resumeSaveSchema = z.object({
  content: z.string().trim().min(1, "Your resume is empty").max(100000),
  formData: resumeSchema.nullable().optional(),
});
export const improvementSchema = z.object({
  current: z.string().trim().min(1).max(10000),
  type: z.enum(["experience", "education", "project"]),
});
export const idSchema = z.string().min(1).max(100);
export const quizSubmissionSchema = z.object({
  attemptId: idSchema,
  answers: z.array(z.string().min(1).max(2000)).length(10),
}).strict();

// Do not expose database/validator internals as an action error.
export function parseInput(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0]?.message || "Invalid input");
  return result.data;
}
