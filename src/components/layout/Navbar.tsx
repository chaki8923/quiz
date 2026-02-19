import Link from "next/link";
import { BookOpen, Settings } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-brand-600"
        >
          <BookOpen size={24} />
          <span>QuizLive</span>
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Settings size={16} />
          管理画面
        </Link>
      </div>
    </nav>
  );
}
