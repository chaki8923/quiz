import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Trophy, Home } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: participants } = await supabase
    .from("participants")
    .select("id, name")
    .eq("session_id", id);

  const { data: answers } = await supabase
    .from("answers")
    .select("participant_id, choices(is_correct)")
    .eq("session_id", id);

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id")
    .eq("category_id", session.category_id);

  const totalQuizzes = quizzes?.length ?? 0;
  const categoryName = (session as unknown as { categories: { name: string } }).categories?.name ?? "";

  const scoreMap: Record<string, { name: string; correct: number }> = {};
  participants?.forEach((p) => {
    scoreMap[p.id] = { name: p.name, correct: 0 };
  });
  answers?.forEach((a) => {
    const isCorrect = (a as unknown as { choices: { is_correct: boolean } }).choices?.is_correct;
    if (isCorrect && scoreMap[a.participant_id]) {
      scoreMap[a.participant_id].correct++;
    }
  });

  const scores = Object.values(scoreMap).sort((a, b) => b.correct - a.correct);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500 shadow-lg">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">クイズ終了!</h1>
          <p className="mt-1 text-gray-500">{categoryName}</p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
                  <span className="text-sm font-normal text-gray-500">/{totalQuizzes}問</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Link href="/">
          <Button variant="secondary" size="lg" className="w-full">
            <Home size={18} />
            トップページへ戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
