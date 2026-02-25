import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QuizList } from "@/components/admin/QuizList";
import { CreateQuizButton } from "@/components/admin/CreateQuizButton";
import { ImportQuizButton } from "@/components/admin/ImportQuizButton";
import { ChevronLeft, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (!category) notFound();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*, choices(*)")
    .eq("category_id", id)
    .order("order_index", { ascending: true });

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft size={16} />
          カテゴリー一覧へ戻る
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {category.name}
            </h1>
          </div>
          {category.description && (
            <p className="text-sm text-gray-500">{category.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ImportQuizButton categoryId={id} quizCount={quizzes?.length ?? 0} />
          <CreateQuizButton categoryId={id} quizCount={quizzes?.length ?? 0} />
        </div>
      </div>

      {quizzes && quizzes.length > 0 ? (
        <QuizList quizzes={quizzes} categoryId={id} />
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">クイズがありません</p>
          <p className="mt-1 text-sm text-gray-400">
            右上のボタンから最初のクイズを作成してください
          </p>
        </div>
      )}
    </div>
  );
}
