import { z } from "zod";

export const questionSchema = z.object({
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(2000)).length(4),
  correctAnswer: z.string().min(1).max(2000),
  explanation: z.string().min(1).max(4000),
}).refine((q) => new Set(q.options).size === 4 && q.options.includes(q.correctAnswer), "Invalid quiz options or correct answer");

export const quizSchema = z.object({ questions: z.array(questionSchema).length(10) });
const salaryRangeSchema = z.object({
  role: z.string().min(1).max(200),
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  median: z.number().nonnegative(),
  location: z.string().min(1).max(200),
}).refine((range) => range.min <= range.median && range.median <= range.max, "Invalid salary range");
const textList = z.array(z.string().min(1).max(1000)).min(5).max(20);
export const insightsSchema = z.object({
  salaryRanges: z.array(salaryRangeSchema).min(5).max(20),
  growthRate: z.number().min(-100).max(100),
  demandLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
  topSkills: textList,
  marketOutlook: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  keyTrends: textList,
  recommendedSkills: textList,
});
