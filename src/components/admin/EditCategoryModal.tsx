"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Category } from "@/types";

interface EditCategoryModalProps {
  category: Category;
}

export function EditCategoryModal({ category }: EditCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("カテゴリー名を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("categories")
      .update({
        name: name.trim(),
        description: description.trim() || null,
      })
      .eq("id", category.id);

    if (dbError) {
      setError("更新に失敗しました");
      setLoading(false);
      return;
    }

    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil size={14} />
        編集
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="カテゴリーを編集"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="カテゴリー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
          <Textarea
            label="説明（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" loading={loading}>
              保存する
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
