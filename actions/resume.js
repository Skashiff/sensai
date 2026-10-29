"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateContent } from "@/lib/ai";
import { reserveAIRequest } from "@/lib/ai-quota";
import { resumeSaveSchema, improvementSchema, parseInput } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function saveResume(input) {
  const user = await requireUser();
  const { content, formData } = parseInput(resumeSaveSchema, input);
  const data = { content, formData: formData ?? Prisma.DbNull };
  const resume = await db.resume.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
  revalidatePath("/resume");
  return resume;
}

export async function getResume() {
  const user = await requireUser();
  return db.resume.findUnique({ where: { userId: user.id } });
}

export async function improveWithAI(input) {
  const user = await requireUser();
  const { current, type } = parseInput(improvementSchema, input);
  await reserveAIRequest(user.id);
  return generateContent(`Improve this ${type} description for a ${user.industry || "career"} professional.
Use action verbs and relevant keywords. Preserve all facts; only use numerical results already supplied.
Do not invent achievements. Return a concise paragraph without a preamble.
Candidate description: ${JSON.stringify(current)}`);
}
