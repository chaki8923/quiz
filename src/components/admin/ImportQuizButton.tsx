"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface ImportChoice {
  text: string;
  is_correct: boolean;
  explanation?: string;
}

interface ImportQuiz {
  question: string;
  choices: ImportChoice[];
}

interface ParseResult {
  quizzes: ImportQuiz[];
  errors: string[];
}

interface ImportQuizButtonProps {
  categoryId: string;
  quizCount: number;
}

function validateAndParse(raw: string): ParseResult {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { quizzes: [], errors: ["JSONの形式が正しくありません。構文エラーを確認してください。"] };
  }

  if (!Array.isArray(parsed)) {
    return { quizzes: [], errors: ["JSONはクイズの配列（[ ... ]）である必要があります。"] };
  }

  if (parsed.length === 0) {
    return { quizzes: [], errors: ["クイズが1件も含まれていません。"] };
  }

  const quizzes: ImportQuiz[] = [];

  parsed.forEach((item: unknown, qi: number) => {
    const prefix = `クイズ${qi + 1}`;
    if (typeof item !== "object" || item === null) {
      errors.push(`${prefix}: オブジェクトである必要があります`);
      return;
    }
    const q = item as Record<string, unknown>;

    if (typeof q.question !== "string" || !q.question.trim()) {
      errors.push(`${prefix}: "question"（問題文）が必要です`);
      return;
    }
    if (!Array.isArray(q.choices)) {
      errors.push(`${prefix}: "choices"（選択肢の配列）が必要です`);
      return;
    }
    if (q.choices.length < 2 || q.choices.length > 4) {
      errors.push(`${prefix}: 選択肢は2〜4件必要です（現在: ${q.choices.length}件）`);
      return;
    }

    const choices: ImportChoice[] = [];
    let correctCount = 0;
    let choiceError = false;

    (q.choices as unknown[]).forEach((c: unknown, ci: number) => {
      const cl = `${prefix} 選択肢${ci + 1}`;
      if (typeof c !== "object" || c === null) {
        errors.push(`${cl}: オブジェクトである必要があります`);
        choiceError = true;
        return;
      }
      const ch = c as Record<string, unknown>;
      if (typeof ch.text !== "string" || !ch.text.trim()) {
        errors.push(`${cl}: "text"（選択肢テキスト）が必要です`);
        choiceError = true;
        return;
      }
      if (typeof ch.is_correct !== "boolean") {
        errors.push(`${cl}: "is_correct"はtrue/falseである必要があります`);
        choiceError = true;
        return;
      }
      if (ch.is_correct) correctCount++;
      choices.push({
        text: (ch.text as string).trim(),
        is_correct: ch.is_correct as boolean,
        explanation: typeof ch.explanation === "string" ? ch.explanation.trim() : undefined,
      });
    });

    if (choiceError) return;

    if (correctCount === 0) {
      errors.push(`${prefix}: 正解（is_correct: true）の選択肢が必要です`);
      return;
    }
    if (correctCount > 1) {
      errors.push(`${prefix}: 正解は1つのみにしてください（現在: ${correctCount}件）`);
      return;
    }

    quizzes.push({ question: q.question.trim(), choices });
  });

  return { quizzes, errors };
}

const CHOICE_LABELS = ["A", "B", "C", "D"];

export function ImportQuizButton({ categoryId, quizCount }: ImportQuizButtonProps) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const router = useRouter();

  const handleJsonChange = useCallback((value: string) => {
    setJson(value);
    setImportError("");
    setImportedCount(null);
    if (value.trim()) {
      setParseResult(validateAndParse(value));
    } else {
      setParseResult(null);
    }
  }, []);

  const handleImport = async () => {
    if (!parseResult || parseResult.quizzes.length === 0 || parseResult.errors.length > 0) return;

    setLoading(true);
    setImportError("");
    const supabase = createClient();

    let count = 0;
    for (let i = 0; i < parseResult.quizzes.length; i++) {
      const q = parseResult.quizzes[i];

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          category_id: categoryId,
          question: q.question,
          order_index: quizCount + count,
        })
        .select()
        .single();

      if (quizError || !quiz) {
        setImportError(`クイズ${i + 1}「${q.question.slice(0, 20)}…」の保存に失敗しました`);
        setLoading(false);
        return;
      }

      const { error: choiceError } = await supabase.from("choices").insert(
        q.choices.map((c, ci) => ({
          quiz_id: quiz.id,
          text: c.text,
          is_correct: c.is_correct,
          explanation: c.explanation || null,
          order_index: ci,
        }))
      );

      if (choiceError) {
        setImportError(`クイズ${i + 1}の選択肢の保存に失敗しました`);
        await supabase.from("quizzes").delete().eq("id", quiz.id);
        setLoading(false);
        return;
      }

      count++;
    }

    setImportedCount(count);
    setLoading(false);
    router.refresh();
  };

  const handleClose = () => {
    setOpen(false);
    setJson("");
    setParseResult(null);
    setImportError("");
    setImportedCount(null);
    setExpandedIndex(null);
  };

  const isValid = parseResult && parseResult.quizzes.length > 0 && parseResult.errors.length === 0;

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Upload size={16} />
        JSONでインポート
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title="クイズをJSONでインポート"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {importedCount !== null ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle size={48} className="text-green-500" />
              <p className="text-lg font-semibold text-gray-900">
                {importedCount}件のクイズをインポートしました
              </p>
              <Button onClick={handleClose}>閉じる</Button>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  JSONを貼り付け
                </label>
                <textarea
                  value={json}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  placeholder={`[\n  {\n    "question": "問題文",\n    "choices": [\n      { "text": "選択肢A", "is_correct": false },\n      { "text": "選択肢B", "is_correct": true, "explanation": "正解の理由" },\n      { "text": "選択肢C", "is_correct": false },\n      { "text": "選択肢D", "is_correct": false }\n    ]\n  }\n]`}
                  rows={10}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 font-mono text-xs text-gray-800 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                  spellCheck={false}
                />
              </div>

              {parseResult && (
                <div className="rounded-lg border overflow-hidden">
                  {parseResult.errors.length > 0 ? (
                    <div className="bg-red-50 border-red-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-red-700">
                          {parseResult.errors.length}件のエラーがあります
                        </span>
                      </div>
                      <ul className="space-y-1 pl-6 list-disc">
                        {parseResult.errors.map((e, i) => (
                          <li key={i} className="text-xs text-red-600">{e}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 bg-green-50 px-3 py-2 border-b border-green-200">
                        <CheckCircle size={16} className="text-green-500" />
                        <span className="text-sm font-medium text-green-700">
                          {parseResult.quizzes.length}件のクイズをインポートできます
                        </span>
                      </div>
                      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                        {parseResult.quizzes.map((q, qi) => (
                          <div key={qi} className="bg-white">
                            <button
                              type="button"
                              onClick={() => setExpandedIndex(expandedIndex === qi ? null : qi)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                            >
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                                {qi + 1}
                              </span>
                              <span className="flex-1 text-sm text-gray-800 truncate">
                                {q.question}
                              </span>
                              {expandedIndex === qi ? (
                                <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                              )}
                            </button>
                            {expandedIndex === qi && (
                              <div className="px-3 pb-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                {q.choices.map((c, ci) => (
                                  <div
                                    key={ci}
                                    className={`rounded-md border px-2.5 py-2 text-xs ${
                                      c.is_correct
                                        ? "border-green-300 bg-green-50 text-green-800"
                                        : "border-gray-200 bg-gray-50 text-gray-600"
                                    }`}
                                  >
                                    <span className="font-bold mr-1">{CHOICE_LABELS[ci]}.</span>
                                    {c.text}
                                    {c.explanation && (
                                      <p className="mt-1 text-gray-400 truncate">💡 {c.explanation}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importError && (
                <p className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {importError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={handleClose}>
                  キャンセル
                </Button>
                <Button
                  onClick={handleImport}
                  loading={loading}
                  disabled={!isValid}
                >
                  <Upload size={16} />
                  {isValid ? `${parseResult.quizzes.length}件をインポート` : "インポート"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
