-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "quizAttemptId" TEXT;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "formData" JSONB;

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questions" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("userId","windowStart")
);

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "QuizAttempt_expiresAt_idx" ON "QuizAttempt"("expiresAt");

-- CreateIndex
CREATE INDEX "AiUsage_windowStart_idx" ON "AiUsage"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_quizAttemptId_key" ON "Assessment"("quizAttemptId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_quizAttemptId_fkey" FOREIGN KEY ("quizAttemptId") REFERENCES "QuizAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

