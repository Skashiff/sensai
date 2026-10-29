import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
const mocks = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@google/genai", () => ({ GoogleGenAI: class { constructor() { this.models = { generateContent: mocks.generate }; } } }));
import { generateContent } from "@/lib/ai";
import { quizSchema } from "@/lib/ai-schemas";
import { questions } from "./fixtures";

beforeEach(() => { vi.stubEnv("GEMINI_API_KEY", "unit-test-only"); vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it("uses a configurable supported model and structured output", async () => {
  vi.stubEnv("GEMINI_MODEL", "test-model");
  mocks.generate.mockResolvedValue({ text: JSON.stringify({ questions }) });
  expect(await generateContent("Generate questions", quizSchema)).toEqual({ questions });
  expect(mocks.generate).toHaveBeenCalledWith(expect.objectContaining({ model: "test-model", config: expect.objectContaining({ responseMimeType: "application/json", responseJsonSchema: expect.any(Object) }) }));
});
it("rejects invalid AI data even when it is valid JSON", async () => {
  mocks.generate.mockResolvedValue({ text: JSON.stringify({ questions: [{ ...questions[0], correctAnswer: "not an option" }] }) });
  await expect(generateContent("Generate questions", quizSchema)).rejects.toThrow("invalid response");
});
it("rejects empty text and malformed JSON", async () => {
  mocks.generate.mockResolvedValueOnce({ text: " " }).mockResolvedValueOnce({ text: "not JSON" });
  await expect(generateContent("Prompt")).rejects.toThrow("empty response");
  await expect(generateContent("Prompt", z.object({ value: z.string() }))).rejects.toThrow("invalid response");
});
it("returns a useful error without exposing upstream request details", async () => {
  mocks.generate.mockRejectedValue(new Error("internal secret and profile details"));
  await expect(generateContent("private profile")).rejects.toThrow("AI generation failed");
});
