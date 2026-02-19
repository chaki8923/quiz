"use client";

import { QuizWithChoices } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EditQuizModal } from "./EditQuizModal";
import { DeleteQuizButton } from "./DeleteQuizButton";
import { CHOICE_LABELS } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

interface QuizListProps {
  quizzes: QuizWithChoices[];
  categoryId: string;
}

export function QuizList({ quizzes, categoryId }: QuizListProps) {
  return (
    <div className="space-y-4">
      {quizzes.map((quiz, index) => (
        <Card key={quiz.id}>
          <div className="p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
                  {index + 1}
                </span>
                <p className="font-medium text-gray-900 leading-snug">
                  {quiz.question}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <EditQuizModal quiz={quiz} categoryId={categoryId} />
                <DeleteQuizButton quizId={quiz.id} question={quiz.question} />
              </div>
            </div>

            {quiz.choices && (
              <div className="ml-10 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quiz.choices
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((choice, ci) => (
                    <div
                      key={choice.id}
                      className={`rounded-lg border p-2.5 ${
                        choice.is_correct
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {choice.is_correct ? (
                          <CheckCircle size={14} className="flex-shrink-0 text-green-500" />
                        ) : (
                          <Circle size={14} className="flex-shrink-0 text-gray-400" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            choice.is_correct
                              ? "text-green-700"
                              : "text-gray-500"
                          }`}
                        >
                          {CHOICE_LABELS[ci]}
                        </span>
                        <span className="text-sm text-gray-700 truncate">
                          {choice.text}
                        </span>
                        {choice.is_correct && (
                          <Badge variant="success" className="ml-auto flex-shrink-0">
                            正解
                          </Badge>
                        )}
                      </div>
                      {choice.explanation && (
                        <p className="mt-1.5 ml-5 text-xs text-gray-500">
                          💡 {choice.explanation}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
