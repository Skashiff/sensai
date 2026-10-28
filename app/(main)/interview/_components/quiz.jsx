"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult } from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const { loading: generatingQuiz, fn: generateQuizFn, data: quizData } = useFetch(generateQuiz);
  const { loading: savingResult, fn: saveQuizResultFn, data: resultData, setData: setResultData } = useFetch(saveQuizResult);

  const startNewQuiz = async () => {
    try {
      const quiz = await generateQuizFn();
      setCurrentQuestion(0);
      setAnswers(new Array(quiz.questions.length).fill(null));
      setResultData(null);
    } catch (error) {
      toast.error(error.message || "Unable to generate quiz questions");
    }
  };
  const handleAnswer = (answer) => setAnswers((previous) => previous.map((value, index) => index === currentQuestion ? answer : value));
  const handleNext = async () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((index) => index + 1);
      return;
    }
    try {
      await saveQuizResultFn({ attemptId: quizData.attemptId, answers });
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  if (generatingQuiz) return <BarLoader className="mt-4" width="100%" color="gray" />;
  if (resultData) return <div className="mx-2"><QuizResult result={resultData} onStartNew={startNewQuiz} /></div>;
  if (!quizData) return (
    <Card className="mx-2">
      <CardHeader><CardTitle>Ready to test your knowledge?</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Answer 10 questions tailored to your industry and skills. Your results and explanations appear after submission. Complete the quiz within one hour.</p></CardContent>
      <CardFooter><Button onClick={startNewQuiz} className="w-full">Start Quiz</Button></CardFooter>
    </Card>
  );
  const question = quizData.questions[currentQuestion];
  return (
    <Card className="mx-2">
      <CardHeader><CardTitle>Question {currentQuestion + 1} of {quizData.questions.length}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question.question}</p>
        <RadioGroup onValueChange={handleAnswer} value={answers[currentQuestion] || ""} className="space-y-2" aria-label="Answer options" disabled={savingResult}>
          {question.options.map((option, index) => <div key={index} className="flex items-center space-x-2"><RadioGroupItem value={option} id={`option-${index}`} /><Label htmlFor={`option-${index}`}>{option}</Label></div>)}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-end"><Button onClick={handleNext} disabled={!answers[currentQuestion] || savingResult}>
        {savingResult ? "Saving..." : currentQuestion < quizData.questions.length - 1 ? "Next Question" : "Finish Quiz"}
      </Button></CardFooter>
    </Card>
  );
}
