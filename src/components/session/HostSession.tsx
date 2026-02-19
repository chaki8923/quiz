"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Session, QuizWithChoices, Choice, RealtimeAnswer, RealtimeSessionUpdate } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CHOICE_LABELS } from "@/lib/utils";
import {
  Users,
  Play,
  ChevronRight,
  CheckCircle,
  Trophy,
  Share2,
  Copy,
  BookOpen,
} from "lucide-react";

interface HostSessionProps {
  session: Session;
  quizzes: QuizWithChoices[];
  categoryName: string;
}

type AnswerMap = Record<string, { participantName: string; choiceId: string }[]>;

export function HostSession({ session, quizzes, categoryName }: HostSessionProps) {
  const supabase = createClient();
  const sessionId = session.id;

  const [currentIndex, setCurrentIndex] = useState(session.current_quiz_index);
  const [sessionStatus, setSessionStatus] = useState(session.status);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const currentQuiz: QuizWithChoices | undefined = quizzes[currentIndex];
  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sessions/${sessionId}/join`
    : "";

  const fetchParticipants = useCallback(async () => {
    const { data } = await supabase
      .from("participants")
      .select("id, name")
      .eq("session_id", sessionId);
    if (data) setParticipants(data);
  }, [supabase, sessionId]);

  const fetchAnswers = useCallback(async (quizId: string) => {
    const { data } = await supabase
      .from("answers")
      .select("participant_id, choice_id, participants(name)")
      .eq("session_id", sessionId)
      .eq("quiz_id", quizId);

    if (data) {
      const map: AnswerMap = {};
      data.forEach((a) => {
        if (!map[a.choice_id]) map[a.choice_id] = [];
        map[a.choice_id].push({
          participantName: (a as unknown as { participants: { name: string } }).participants?.name ?? "",
          choiceId: a.choice_id,
        });
      });
      setAnswers(map);
    }
  }, [supabase, sessionId]);

  useEffect(() => {
    fetchParticipants();
    if (currentQuiz) fetchAnswers(currentQuiz.id);
  }, [fetchParticipants, fetchAnswers, currentQuiz]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on("broadcast", { event: "answer" }, ({ payload }: { payload: RealtimeAnswer }) => {
        setAnswers((prev) => {
          const updated = { ...prev };
          if (!updated[payload.choice_id]) updated[payload.choice_id] = [];
          const existing = updated[payload.choice_id].find(
            (a) => a.participantName === payload.participant_name
          );
          if (!existing) {
            updated[payload.choice_id] = [
              ...updated[payload.choice_id],
              { participantName: payload.participant_name, choiceId: payload.choice_id },
            ];
          }
          return updated;
        });
      })
      .on("broadcast", { event: "participant_join" }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase, fetchParticipants]);

  const broadcastSessionUpdate = async (update: RealtimeSessionUpdate) => {
    await supabase.channel(`session:${sessionId}`).send({
      type: "broadcast",
      event: "session_update",
      payload: update satisfies RealtimeSessionUpdate,
    });
  };

  const handleStart = async () => {
    setLoading(true);
    await supabase
      .from("sessions")
      .update({ status: "in_progress", current_quiz_index: 0 })
      .eq("id", sessionId);

    await broadcastSessionUpdate({ status: "in_progress", current_quiz_index: 0 });
    setSessionStatus("in_progress");
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
    setLoading(false);
  };

  const handleNextQuestion = async () => {
    const nextIndex = currentIndex + 1;
    setLoading(true);

    if (nextIndex >= quizzes.length) {
      await supabase
        .from("sessions")
        .update({ status: "completed" })
        .eq("id", sessionId);
      await broadcastSessionUpdate({ status: "completed", current_quiz_index: currentIndex });
      setSessionStatus("completed");
    } else {
      await supabase
        .from("sessions")
        .update({ current_quiz_index: nextIndex })
        .eq("id", sessionId);
      await broadcastSessionUpdate({ status: "in_progress", current_quiz_index: nextIndex });
      setCurrentIndex(nextIndex);
      setAnswers({});
      setShowResult(false);
    }
    setLoading(false);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalAnswers = Object.values(answers).flat().length;

  // ===== 待機画面 =====
  if (sessionStatus === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
        <div className="mx-auto max-w-2xl pt-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
              <BookOpen size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ホスト画面</h1>
            <p className="mt-1 text-gray-500">{categoryName}</p>
          </div>

          {/* 参加URLの共有 */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Share2 size={18} className="text-brand-600" />
              <h2 className="font-semibold text-gray-900">参加URLを共有</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinUrl}
                readOnly
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              />
              <Button onClick={handleCopyUrl} variant="secondary" size="sm">
                <Copy size={14} />
                {copied ? "コピー済み" : "コピー"}
              </Button>
            </div>
          </div>

          {/* 参加者一覧 */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <h2 className="font-semibold text-gray-900">
                  参加者 ({participants.length} 人)
                </h2>
              </div>
            </div>
            {participants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <Badge key={p.id} variant="info">
                    <Users size={10} className="mr-1" />
                    {p.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                参加者が来るのを待っています...
              </p>
            )}
          </div>

          <Button
            onClick={handleStart}
            loading={loading}
            disabled={participants.length === 0}
            size="lg"
            className="w-full"
          >
            <Play size={20} />
            クイズを開始する ({quizzes.length} 問)
          </Button>
          {participants.length === 0 && (
            <p className="mt-2 text-center text-sm text-gray-400">
              参加者が1人以上必要です
            </p>
          )}
        </div>
      </div>
    );
  }

  // ===== 終了画面 =====
  if (sessionStatus === "completed") {
    return <ResultScreen sessionId={sessionId} quizzes={quizzes} participants={participants} categoryName={categoryName} />;
  }

  if (!currentQuiz) return null;

  const sortedChoices = [...(currentQuiz.choices ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  // ===== クイズ進行画面 =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-brand-900 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <BookOpen size={16} />
            {categoryName}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70">
              問題 {currentIndex + 1} / {quizzes.length}
            </span>
            <div className="flex items-center gap-1 text-sm text-white/70">
              <Users size={14} />
              {totalAnswers}/{participants.length} 回答
            </div>
          </div>
        </div>
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-brand-400 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}
          />
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* 問題 */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-300">
            Q{currentIndex + 1}
          </p>
          <p className="text-2xl font-bold leading-relaxed">{currentQuiz.question}</p>
        </div>

        {/* 選択肢とリアルタイム回答状況 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {sortedChoices.map((choice: Choice, ci: number) => {
            const choiceAnswers = answers[choice.id] ?? [];
            const percentage =
              participants.length > 0
                ? Math.round((choiceAnswers.length / participants.length) * 100)
                : 0;

            return (
              <div
                key={choice.id}
                className={`relative overflow-hidden rounded-xl border p-4 ${
                  showResult && choice.is_correct
                    ? "border-green-400 bg-green-500/20"
                    : "border-white/20 bg-white/10"
                }`}
              >
                {/* バー */}
                <div
                  className={`absolute inset-0 transition-all duration-700 ${
                    showResult && choice.is_correct
                      ? "bg-green-500/30"
                      : "bg-brand-500/20"
                  }`}
                  style={{ width: `${percentage}%`, maxWidth: "100%" }}
                />

                <div className="relative flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      showResult && choice.is_correct
                        ? "bg-green-500 text-white"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {CHOICE_LABELS[ci]}
                  </span>
                  <span className="flex-1 font-medium">{choice.text}</span>
                  <span className="text-lg font-bold text-white/90">
                    {percentage}%
                  </span>
                  {showResult && choice.is_correct && (
                    <CheckCircle size={20} className="text-green-400" />
                  )}
                </div>

                {/* 回答者名 */}
                {choiceAnswers.length > 0 && (
                  <div className="relative mt-2 ml-11 flex flex-wrap gap-1">
                    {choiceAnswers.map((a, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white/20 px-2 py-0.5 text-xs"
                      >
                        {a.participantName}
                      </span>
                    ))}
                  </div>
                )}

                {/* 補足説明 */}
                {showResult && choice.is_correct && choice.explanation && (
                  <div className="relative mt-2 ml-11 rounded-lg bg-green-500/20 px-3 py-2 text-sm text-green-200">
                    💡 {choice.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 操作ボタン */}
        <div className="flex gap-3">
          {!showResult ? (
            <Button
              onClick={() => setShowResult(true)}
              size="lg"
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900"
            >
              <CheckCircle size={20} />
              正解を表示する
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              loading={loading}
              size="lg"
              className="flex-1"
            >
              {currentIndex + 1 >= quizzes.length ? (
                <>
                  <Trophy size={20} />
                  結果を表示する
                </>
              ) : (
                <>
                  次の問題へ
                  <ChevronRight size={20} />
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

// ===== 結果画面 =====
function ResultScreen({
  sessionId,
  quizzes,
  participants,
  categoryName,
}: {
  sessionId: string;
  quizzes: QuizWithChoices[];
  participants: { id: string; name: string }[];
  categoryName: string;
}) {
  const supabase = createClient();
  const [scores, setScores] = useState<{ name: string; correct: number; total: number }[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const { data: answers } = await supabase
        .from("answers")
        .select("participant_id, choice_id, choices(is_correct), participants(name)")
        .eq("session_id", sessionId);

      if (!answers) return;

      const scoreMap: Record<string, { name: string; correct: number; total: number }> = {};
      participants.forEach((p) => {
        scoreMap[p.id] = { name: p.name, correct: 0, total: quizzes.length };
      });

      answers.forEach((a) => {
        const isCorrect = (a as unknown as { choices: { is_correct: boolean } }).choices?.is_correct;
        if (isCorrect && scoreMap[a.participant_id]) {
          scoreMap[a.participant_id].correct++;
        }
      });

      const sorted = Object.values(scoreMap).sort((a, b) => b.correct - a.correct);
      setScores(sorted);
    };

    fetchScores();
  }, [supabase, sessionId, participants, quizzes.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 p-4">
      <div className="mx-auto max-w-2xl pt-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500 shadow-lg">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">クイズ終了!</h1>
          <p className="mt-1 text-gray-500">{categoryName}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">最終スコア</h2>
          <div className="space-y-3">
            {scores.map((s, i) => (
              <div
                key={s.name}
                className={`flex items-center gap-4 rounded-xl p-3 ${
                  i === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0
                      ? "bg-yellow-400 text-white"
                      : i === 1
                      ? "bg-gray-400 text-white"
                      : i === 2
                      ? "bg-amber-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 font-medium text-gray-900">{s.name}</span>
                <span className="text-lg font-bold text-gray-900">
                  {s.correct}
                  <span className="text-sm font-normal text-gray-500">
                    /{s.total}問
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
