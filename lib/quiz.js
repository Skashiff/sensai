import { quizSchema } from "@/lib/ai-schemas";

export function gradeQuiz(storedQuestions, answers) {
  const { questions } = quizSchema.parse({ questions: storedQuestions });
  if (!Array.isArray(answers) || answers.length !== questions.length) throw new Error("Answer every question before submitting");
  const results = questions.map((q, index) => {
    if (!q.options.includes(answers[index])) throw new Error("Select a valid answer for every question");
    return {
      question: q.question, answer: q.correctAnswer, userAnswer: answers[index],
      isCorrect: q.correctAnswer === answers[index], explanation: q.explanation,
    };
  });
  return {
    questions: results,
    quizScore: results.filter((q) => q.isCorrect).length / questions.length * 100,
    improvementTip: results.find((q) => !q.isCorrect)?.explanation || null,
  };
}
