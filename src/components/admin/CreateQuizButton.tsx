"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CHOICE_LABELS } from "@/lib/utils";

interface ChoiceInput {
  text: string;
  is_correct: boolean;
  explanation: string;
}

const defaultChoices = (): ChoiceInput[] =>
  CHOICE_LABELS.map(() => ({ text: "", is_correct: false, explanation: "" }));

interface CreateQuizButtonProps {
  categoryId: string;
  quizCount: number;
}

export function CreateQuizButton({ categoryId, quizCount }: CreateQuizButtonProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<ChoiceInput[]>(defaultChoices());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const updateChoice = (index: number, field: keyof ChoiceInput, value: string | boolean) => {
    setChoices((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      )
    );
  };

  const setCorrect = (index: number) => {
    setChoices((prev) =>
      prev.map((c, i) => ({ ...c, is_correct: i === index }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("問題文を入力してください");
      return;
    }
    if (choices.some((c) => !c.text.trim())) {
      setError("すべての選択肢を入力してください");
      return;
    }
    if (!choices.some((c) => c.is_correct)) {
      setError("正解の選択肢を1つ選択してください");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        category_id: categoryId,
        question: question.trim(),
        order_index: quizCount,
      })
      .select()
      .single();

    if (quizError || !quiz) {
      setError("クイズの作成に失敗しました");
      setLoading(false);
      return;
    }

    const { error: choicesError } = await supabase.from("choices").insert(
      choices.map((c, i) => ({
        quiz_id: quiz.id,
        text: c.text.trim(),
        is_correct: c.is_correct,
        explanation: c.explanation.trim() || null,
        order_index: i,
      }))
    );

    if (choicesError) {
      setError("選択肢の保存に失敗しました");
      await supabase.from("quizzes").delete().eq("id", quiz.id);
      setLoading(false);
      return;
    }

    setOpen(false);
    setQuestion("");
    setChoices(defaultChoices());
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        クイズを追加
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新しいクイズを作成"
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Textarea
            label="問題文"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="問題文を入力してください"
            rows={3}
          />

          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">
              選択肢（正解を1つ選択してください）
            </p>
            <div className="space-y-3">
              {choices.map((choice, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-3 transition-colors ${
                    choice.is_correct
                      ? "border-green-400 bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setCorrect(index)}
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        choice.is_correct
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {CHOICE_LABELS[index]}
                    </button>
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) =>
                        updateChoice(index, "text", e.target.value)
                      }
                      placeholder={`選択肢 ${CHOICE_LABELS[index]}`}
                      className="flex-1 rounded-md border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                    />
                    {choice.is_correct && (
                      <span className="text-xs font-medium text-green-600">正解</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={choice.explanation}
                    onChange={(e) =>
                      updateChoice(index, "explanation", e.target.value)
                    }
                    placeholder="補足説明（任意）"
                    className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" loading={loading}>
              作成する
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
