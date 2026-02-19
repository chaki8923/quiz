import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { JoinForm } from "@/components/session/JoinForm";
import { BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JoinSessionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, categories(name, description)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  if (session.status === "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">
            このセッションは終了しました
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">QuizLive</h1>
          <p className="mt-1 text-gray-500">
            {(session as unknown as { categories: { name: string } }).categories?.name}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            クイズに参加する
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            お名前を入力してクイズを開始してください
          </p>
          <JoinForm sessionId={id} />
        </div>
      </div>
    </div>
  );
}
