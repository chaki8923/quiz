import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { CategoryCard } from "@/components/home/CategoryCard";
import { Category } from "@/types";
import { BookOpen, Trophy } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, quizzes(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <Trophy size={32} className="text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-gray-900">
            QuizLive
          </h1>
          <p className="text-lg text-gray-600">
            複数人でリアルタイムにクイズに挑戦しよう
          </p>
        </div>

        {/* カテゴリー一覧 */}
        <section>
          <div className="mb-6 flex items-center gap-2">
            <BookOpen size={20} className="text-brand-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              クイズカテゴリー
            </h2>
          </div>

          {categories && categories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category as Category}
                  quizCount={
                    (category as unknown as { quizzes: [{ count: number }] })
                      .quizzes?.[0]?.count ?? 0
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
              <BookOpen size={40} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">
                まだカテゴリーがありません
              </p>
              <p className="mt-1 text-sm text-gray-400">
                管理画面からカテゴリーとクイズを追加してください
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
