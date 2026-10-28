import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.string().url().max(1000).refine((value) => /^https?:\/\//i.test(value), "Use an http or https URL")]).optional();
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Select a valid month");

export const onboardingSchema = z.object({
  industry: z.string().min(1, "Please select an industry"),
  subIndustry: z.string().min(1, "Please select a specialization"),
  bio: z.string().trim().max(500).optional(),
  experience: z.string().trim().min(1, "Enter your years of experience").transform(Number).pipe(z.number().int().min(0).max(50)),
  skills: z.string().max(4000).default("").transform((value) => value.split(",").map((skill) => skill.trim()).filter(Boolean)).pipe(z.array(z.string().max(80)).max(50)),
});

export const contactSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(254),
  mobile: z.string().trim().max(40).optional(),
  linkedin: optionalUrl,
  twitter: optionalUrl,
});

export const entrySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  organization: z.string().trim().min(1, "Organization is required").max(200),
  startDate: month,
  endDate: z.union([z.literal(""), month]).optional(),
  description: z.string().trim().min(1, "Description is required").max(10000),
  current: z.boolean().default(false),
}).refine((data) => data.current || Boolean(data.endDate), {
  message: "End date is required unless this is your current position", path: ["endDate"],
}).refine((data) => data.current || !data.endDate || data.endDate >= data.startDate, {
  message: "End date cannot be before the start date", path: ["endDate"],
});

export const resumeSchema = z.object({
  contactInfo: contactSchema,
  summary: z.string().trim().min(1, "Professional summary is required").max(10000),
  skills: z.string().trim().min(1, "Skills are required").max(10000),
  experience: z.array(entrySchema).max(50),
  education: z.array(entrySchema).max(50),
  projects: z.array(entrySchema).max(50),
});

export const coverLetterSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  jobTitle: z.string().trim().min(1, "Job title is required").max(200),
  jobDescription: z.string().trim().min(1, "Job description is required").max(20000),
});
