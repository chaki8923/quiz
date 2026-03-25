"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Session, QuizWithChoices, Choice } from "@/types";
import { Button } from "@/components/ui/Button";
import { CHOICE_LABELS } from "@/lib/utils";
import { Users, CheckCircle, Clock, BookOpen, Timer } from "lucide-react";

interface QuizSessionProps {
  session: Session;
  quizzes: QuizWithChoices[];
  categoryName: string;
}

type AnswerMap = Record<string, { participantName: string; choiceId: string }[]>;
type Participant = { id: string; name: string };

export function QuizSession({ session, quizzes, categoryName }: QuizSessionProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const sessionId = session.id;

  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(session.current_quiz_index);
  const [sessionStatus, setSessionStatus] = useState(session.status);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connected, setConnected] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // stale closure 対策: refで最新値を保持
  const participantsRef = useRef<Participant[]>([]);
  const currentIndexRef = useRef(currentIndex);
  const participantIdRef = useRef<string | null>(null);

  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { participantIdRef.current = participantId; }, [participantId]);

  const currentQuiz: QuizWithChoices | undefined = quizzes[currentIndex];

  // 参加者情報をセッションストレージから取得
  useEffect(() => {
    const pid = sessionStorage.getItem(`participant_${sessionId}`);
    const pname = sessionStorage.getItem(`participant_name_${sessionId}`);
    if (!pid) {
      router.push(`/sessions/${sessionId}/join`);
      return;
    }
    setParticipantId(pid);
    setParticipantName(pname ?? "");
  }, [sessionId, router]);

  // 参加者一覧を取得
  const fetchParticipants = useCallback(async () => {
    const { data } = await supabase
      .from("participants")
      .select("id, name")
      .eq("session_id", sessionId);
    if (data) setParticipants(data);
  }, [supabase, sessionId]);

  // 指定問題の回答状況を取得
  const fetchAnswers = useCallback(async (quizId: string) => {
    const { data } = await supabase
      .from("answers")
      .select("participant_id, choice_id, participants(name)")
      .eq("session_id", sessionId)
      .eq("quiz_id", quizId);

    if (!data) return;

    const map: AnswerMap = {};
    data.forEach((a) => {
      if (!map[a.choice_id]) map[a.choice_id] = [];
      map[a.choice_id].push({
        participantName: (a as unknown as { participants: { name: string } }).participants?.name ?? "",
        choiceId: a.choice_id,
      });
    });
    setAnswers(map);

    // 自分が既に回答済みか確認
    const pid = participantIdRef.current;
    if (pid) {
      const myAnswer = data.find((a) => a.participant_id === pid);
      if (myAnswer) {
        setSelectedChoiceId(myAnswer.choice_id);
        setSubmitted(true);
      }
    }
  }, [supabase, sessionId]);

  // 初期データ取得
  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    if (currentQuiz) {
      setAnswers({});
      setSelectedChoiceId(null);
      setSubmitted(false);
      setAnswerRevealed(false);
      setTimeLeft(null);
      fetchAnswers(currentQuiz.id);
    }
  }, [currentIndex, currentQuiz, fetchAnswers]);

  // Postgres Changes でリアルタイム更新
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:session:${sessionId}`)
      // 新しい参加者が参加したとき
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "participants", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const p = payload.new as Participant;
          setParticipants((prev) => {
            if (prev.some((x) => x.id === p.id)) return prev;
            return [...prev, { id: p.id, name: p.name }];
          });
        }
      )
      // 回答が送信されたとき
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const a = payload.new as { participant_id: string; choice_id: string; quiz_id: string; session_id: string };
          // 現在表示中の問題の回答のみ処理
          const currentQ = quizzes[currentIndexRef.current];
          if (!currentQ || a.quiz_id !== currentQ.id) return;

          const participant = participantsRef.current.find((p) => p.id === a.participant_id);
          if (!participant) return;

          setAnswers((prev) => {
            const updated = { ...prev };
            if (!updated[a.choice_id]) updated[a.choice_id] = [];
            if (updated[a.choice_id].some((x) => x.participantName === participant.name)) return prev;
            updated[a.choice_id] = [...updated[a.choice_id], { participantName: participant.name, choiceId: a.choice_id }];
            return updated;
          });
        }
      )
      // セッション状態が変わったとき（ホストが次の問題・終了操作）
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const s = payload.new as { status: string; current_quiz_index: number };
          const newStatus = s.status as Session["status"];
          const newIndex = s.current_quiz_index;

          setSessionStatus(newStatus);

          if (newIndex !== currentIndexRef.current) {
            setCurrentIndex(newIndex);
            setAnswers({});
            setSelectedChoiceId(null);
            setSubmitted(false);
            setAnswerRevealed(false);
            setTimeLeft(null);
          }

          if (newStatus === "completed") {
            router.push(`/sessions/${sessionId}/result`);
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        // 接続完了後に最新データを再取得して同期
        if (status === "SUBSCRIBED") {
          fetchParticipants();
          if (quizzes[currentIndexRef.current]) {
            fetchAnswers(quizzes[currentIndexRef.current].id);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase, router, quizzes, fetchParticipants, fetchAnswers]);

  // ホストの「正解を表示する」「問題開始」を Broadcast で受信
  useEffect(() => {
    const channel = supabase
      .channel(`broadcast:session:${sessionId}`)
      .on("broadcast", { event: "question_start" }, (event) => {
        const { timeLimitSeconds } = event.payload as { timeLimitSeconds: number };
        setAnswerRevealed(false);
        setTimeLeft(timeLimitSeconds > 0 ? timeLimitSeconds : null);
      })
      .on("broadcast", { event: "answer_revealed" }, () => {
        setAnswerRevealed(true);
        setTimeLeft(null);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  // 参加者側カウントダウン
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const t = setTimeout(() => setTimeLeft((n) => (n !== null ? n - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted]);

  const handleSubmitAnswer = async () => {
    if (!selectedChoiceId || !participantId || !currentQuiz || submitted) return;
    setSubmitting(true);

    const { error } = await supabase.from("answers").upsert({
      participant_id: participantId,
      quiz_id: currentQuiz.id,
      choice_id: selectedChoiceId,
      session_id: sessionId,
    });

    if (!error) setSubmitted(true);
    setSubmitting(false);
  };

  if (!participantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (sessionStatus === "waiting") {
    return (
      <WaitingScreen
        categoryName={categoryName}
        participants={participants}
        participantName={participantName}
      />
    );
  }

  if (!currentQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">クイズが見つかりません</p>
      </div>
    );
  }

  const totalAnswers = Object.values(answers).flat().length;
  const sortedChoices = [...(currentQuiz.choices ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <BookOpen size={16} className="text-brand-600" />
            {categoryName}
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && !answerRevealed && (
              <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                timeLeft <= 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-brand-100 text-brand-700"
              }`}>
                <Timer size={12} />
                {timeLeft}秒
              </div>
            )}
            <span className="text-xs text-gray-500">
              問題 {currentIndex + 1} / {quizzes.length}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={14} />
              {totalAnswers}/{participants.length}
            </div>
          </div>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}
          />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-500">
          <Users size={14} />
          <span>{participantName} さんとして参加中</span>
        </div>

        {/* 問題 */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">
            Q{currentIndex + 1}
          </p>
          <p className="text-xl font-semibold text-gray-900 leading-relaxed">
            {currentQuiz.question}
          </p>
        </div>

        {/* 選択肢 */}
        <div className="space-y-3 mb-6">
          {sortedChoices.map((choice: Choice, ci: number) => {
            const choiceAnswers = answers[choice.id] ?? [];
            const isSelected = selectedChoiceId === choice.id;
            const isCorrect = choice.is_correct;

            return (
              <button
                key={choice.id}
                onClick={() => !submitted && !answerRevealed && timeLeft !== 0 && setSelectedChoiceId(choice.id)}
                disabled={submitted || answerRevealed || timeLeft === 0}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  submitted || answerRevealed
                    ? isCorrect
                      ? "border-green-400 bg-green-50"
                      : isSelected
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-gray-50 opacity-70"
                    : isSelected
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      submitted || answerRevealed
                        ? isCorrect
                          ? "bg-green-500 text-white"
                          : isSelected
                          ? "bg-red-500 text-white"
                          : "bg-gray-300 text-gray-600"
                        : isSelected
                        ? "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {CHOICE_LABELS[ci]}
                  </span>
                  <span className="flex-1 font-medium text-gray-900">{choice.text}</span>
                  {(submitted || answerRevealed) && isCorrect && (
                    <CheckCircle size={20} className="flex-shrink-0 text-green-500" />
                  )}
                </div>

                {/* 正解表示後のみ回答者名を表示 */}
                {answerRevealed && choiceAnswers.length > 0 && (
                  <div className="mt-2 ml-11 flex flex-wrap gap-1">
                    {choiceAnswers.map((a, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.participantName === participantName
                            ? "bg-brand-200 text-brand-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {a.participantName}
                      </span>
                    ))}
                  </div>
                )}

                {/* 正解の解説 */}
                {(submitted || answerRevealed) && isCorrect && choice.explanation && (
                  <div className="mt-2 ml-11 rounded-lg bg-green-100 px-3 py-2 text-sm text-green-800">
                    💡 {choice.explanation}
                  </div>
                )}
                {/* 不正解の解説（ホストが正解を表示したとき） */}
                {answerRevealed && !isCorrect && choice.explanation && (
                  <div className="mt-2 ml-11 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                    ✗ {choice.explanation}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 回答ボタン */}
        {!submitted && !answerRevealed && timeLeft !== 0 ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={!selectedChoiceId}
            loading={submitting}
            size="lg"
            className="w-full"
          >
            回答を送信する
          </Button>
        ) : !submitted && timeLeft === 0 && !answerRevealed ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-red-700">
              <Timer size={20} />
              <span className="font-medium">時間切れ</span>
            </div>
            <p className="mt-1 text-sm text-red-500">回答の受付が終了しました</p>
          </div>
        ) : answerRevealed ? (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-700">
              <CheckCircle size={20} />
              <span className="font-medium">正解が発表されました</span>
            </div>
            <p className="mt-1 text-sm text-yellow-600">次の問題をお待ちください...</p>
          </div>
        ) : (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-brand-700">
              <CheckCircle size={20} />
              <span className="font-medium">回答済み</span>
            </div>
            <p className="mt-1 text-sm text-brand-600">全員の回答を待っています...</p>
          </div>
        )}

        {/* 回答状況パネル */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              回答状況: {totalAnswers}/{participants.length} 人
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const hasAnswered = Object.values(answers)
                .flat()
                .some((a) => a.participantName === p.name);
              return (
                <span
                  key={p.id}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    hasAnswered
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {hasAnswered ? "✓ " : "… "}
                  {p.name}
                </span>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function WaitingScreen({
  categoryName,
  participants,
  participantName,
}: {
  categoryName: string;
  participants: Participant[];
  participantName: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
          <BookOpen size={32} className="text-white" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{categoryName}</h1>
        <p className="mb-2 text-gray-600">
          <span className="font-medium text-brand-600">{participantName}</span> さん、参加登録完了！
        </p>
        <p className="mb-8 text-sm text-gray-500">ホストがクイズを開始するまでお待ちください...</p>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700">
              参加者 ({participants.length} 人)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                  p.name === participantName
                    ? "bg-brand-100 text-brand-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
