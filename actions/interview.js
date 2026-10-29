"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateContent } from "@/lib/ai";
import { reserveAIRequest } from "@/lib/ai-quota";
import { quizSchema } from "@/lib/ai-schemas";
import { quizSubmissionSchema, parseInput } from "@/lib/validation";
import { gradeQuiz } from "@/lib/quiz";
import { revalidatePath } from "next/cache";

export async function generateQuiz() {
  const user = await requireUser();
  if (!user.industry) throw new Error("Complete your profile before starting a quiz");
  await reserveAIRequest(user.id);
  const { questions } = await generateContent(`Generate 10 technical interview questions for this candidate profile:
${JSON.stringify({ industry: user.industry, skills: user.skills })}
Each question must have four distinct options, one correctAnswer exactly matching an option, and an explanation.`, quizSchema);
  const attempt = await db.quizAttempt.create({
    data: { userId: user.id, questions, expiresAt: new Date(Date.now() + 3600000) },
  });
  // Answers and explanations stay on the server until the quiz is submitted.
  return { attemptId: attempt.id, questions: questions.map(({ question, options }) => ({ question, options })) };
}

export async function saveQuizResult(input) {
  const user = await requireUser();
  const { attemptId, answers } = parseInput(quizSubmissionSchema, input);
  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, userId: user.id }, include: { assessment: true },
  });
  if (!attempt) throw new Error("Quiz attempt not found");
  if (attempt.assessment) return attempt.assessment;
  if (attempt.expiresAt <= new Date()) throw new Error("This quiz has expired. Please start a new quiz.");
  const graded = gradeQuiz(attempt.questions, answers);
  let assessment;
  try {
    assessment = await db.assessment.create({
      data: { userId: user.id, quizAttemptId: attempt.id, category: "Technical", ...graded },
    });
  } catch (error) {
    // A repeated or concurrent submission must return the same saved result.
    if (error.code !== "P2002") throw error;
    assessment = await db.assessment.findUnique({ where: { quizAttemptId: attempt.id } });
    if (!assessment || assessment.userId !== user.id) throw new Error("Unable to save quiz results");
  }
  revalidatePath("/interview");
  return assessment;
}

export async function getAssessments() {
  const user = await requireUser();
  return db.assessment.findMany({ where: { userId: user.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
}
