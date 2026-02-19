import Link from "next/link";
import { BookOpen, Home, Settings } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-60 border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
          <BookOpen size={20} className="text-brand-600" />
          <span className="text-lg font-bold text-brand-600">QuizLive</span>
        </div>
        <nav className="p-4 space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            管理メニュー
          </p>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Settings size={16} />
            ダッシュボード
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <BookOpen size={16} />
            カテゴリー管理
          </Link>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Home size={16} />
              トップへ戻る
            </Link>
          </div>
        </nav>
      </div>

      {/* Main */}
      <div className="pl-60">
        <main className="mx-auto max-w-5xl px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
