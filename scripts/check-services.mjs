import { PrismaClient } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";

// Run explicitly with the intended environment, after applying migrations.
// This reads schema metadata and sends one synthetic prompt; it never reads user data.
const db = new PrismaClient();
let stage = "database";
try {
  const [schema] = await db.$queryRawUnsafe(
    "SELECT " +
    "EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Resume' AND column_name = 'formData') AS resume_fields, " +
    "EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Assessment' AND column_name = 'quizAttemptId') AS quiz_relation, " +
    "to_regclass('public.\"QuizAttempt\"') IS NOT NULL AS quiz_attempts, " +
    "to_regclass('public.\"AiUsage\"') IS NOT NULL AS ai_usage"
  );
  if (!Object.values(schema).every(Boolean)) {
    console.error("Database schema is not ready", schema);
    process.exitCode = 1;
  } else {
    console.log("Database schema: ready");
    stage = "gemini";
    if (!process.env.GEMINI_API_KEY) throw new Error("Missing AI configuration");
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 45000 } });
    const result = await ai.models.generateContent({
      model,
      contents: "This is a service readiness check. Return the JSON object {\"ok\":true}.",
      config: {
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseJsonSchema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
      },
    });
    if (JSON.parse(result.text || "null")?.ok !== true) throw new Error("Invalid AI response");
    console.log("Gemini structured response: ready", { model });
  }
} catch (error) {
  // Provider errors can include credentials or URLs; log only diagnostic codes.
  console.error("Service readiness failed", { stage, name: error.name, code: error.code, status: error.status });
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
