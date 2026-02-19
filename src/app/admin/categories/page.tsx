import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CategoryList } from "@/components/admin/CategoryList";
import { CreateCategoryButton } from "@/components/admin/CreateCategoryButton";
import { BookOpen } from "lucide-react";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, quizzes(count)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">カテゴリー管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            クイズの大カテゴリーを管理します
          </p>
        </div>
        <CreateCategoryButton />
      </div>

      {categories && categories.length > 0 ? (
        <CategoryList
          categories={categories.map((c) => ({
            ...c,
            quizCount: (c as unknown as { quizzes: [{ count: number }] }).quizzes?.[0]?.count ?? 0,
          }))}
        />
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-16 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">カテゴリーがありません</p>
          <p className="mt-1 text-sm text-gray-400">
            右上のボタンから最初のカテゴリーを作成してください
          </p>
        </div>
      )}
    </div>
  );
}
