"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteQuizButtonProps {
  quizId: string;
  question: string;
}

export function DeleteQuizButton({ quizId, question }: DeleteQuizButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("quizzes").delete().eq("id", quizId);
    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="text-red-500 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={14} />
        削除
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="クイズを削除">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
            <AlertTriangle size={20} className="flex-shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">この操作は取り消せません</p>
              <p className="mt-1 text-sm text-red-600 line-clamp-2">
                「{question}」を削除します。
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={loading}>
              削除する
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
