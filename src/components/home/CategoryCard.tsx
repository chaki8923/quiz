"use client";

import { Category } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Play, Hash } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  quizCount: number;
}

export function CategoryCard({ category, quizCount }: CategoryCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartSession = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        category_id: category.id,
        status: "waiting",
        current_quiz_index: 0,
      })
      .select()
      .single();

    if (error || !session) {
      alert("セッションの作成に失敗しました");
      setLoading(false);
      return;
    }

    router.push(`/sessions/${session.id}/host`);
  };

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100">
            <BookOpen size={20} className="text-brand-600" />
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Hash size={12} />
            {quizCount} 問
          </span>
        </div>

        <h3 className="mb-1 text-lg font-semibold text-gray-900 leading-snug">
          {category.name}
        </h3>
        {category.description && (
          <p className="mb-4 flex-1 text-sm text-gray-500 line-clamp-2">
            {category.description}
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 p-4">
        <Button
          onClick={handleStartSession}
          loading={loading}
          disabled={quizCount === 0}
          className="w-full"
          size="sm"
        >
          <Play size={16} />
          セッション開始
        </Button>
        {quizCount === 0 && (
          <p className="mt-1.5 text-center text-xs text-gray-400">
            クイズを追加してください
          </p>
        )}
      </div>
    </Card>
  );
}
