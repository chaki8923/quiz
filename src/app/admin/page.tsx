import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, Hash, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: categoryCount }, { count: quizCount }, { count: sessionCount }] =
    await Promise.all([
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("quizzes").select("*", { count: "exact", head: true }),
      supabase.from("sessions").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "カテゴリー数", value: categoryCount ?? 0, icon: BookOpen, color: "text-brand-600 bg-brand-50" },
    { label: "クイズ数", value: quizCount ?? 0, icon: Hash, color: "text-purple-600 bg-purple-50" },
    { label: "セッション数", value: sessionCount ?? 0, icon: ArrowRight, color: "text-green-600 bg-green-50" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">管理ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-500">
          クイズとカテゴリーを管理します
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className={`mb-3 inline-flex rounded-lg p-2.5 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">クイック操作</h2>
        <div className="flex gap-3">
          <Link href="/admin/categories">
            <Button>
              <BookOpen size={16} />
              カテゴリーを管理する
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">
              <ArrowRight size={16} />
              トップページへ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
