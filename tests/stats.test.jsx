import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import StatsCards from "@/app/(main)/interview/_components/stats-cards.jsx";
it("shows the most recent score even when input is oldest-first", () => {
  render(<StatsCards assessments={[
    { createdAt: "2026-01-01", quizScore: 20, questions: [] },
    { createdAt: "2026-01-03", quizScore: 90, questions: [] },
    { createdAt: "2026-01-02", quizScore: 40, questions: [] },
  ]} />);
  expect(screen.getByText("90.0%")).toBeTruthy();
});
