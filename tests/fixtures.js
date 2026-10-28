export const questions = Array.from({ length: 10 }, (_, index) => ({
  question: `Question ${index + 1}?`, options: ["A", "B", "C", "D"], correctAnswer: "A", explanation: `Review concept ${index + 1}.`,
}));
export const resume = {
  contactInfo: { email: "candidate@example.com", mobile: "", linkedin: "", twitter: "" },
  summary: "A data analyst with reporting experience.", skills: "SQL, Python", experience: [], education: [], projects: [],
};
