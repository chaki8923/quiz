"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function CreateCategoryButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
    const { error: dbError } = await supabase.from("categories").insert({
      name: name.trim(),
      description: description.trim() || null,
    });

    if (dbError) {
      setError("カテゴリーの作成に失敗しました");
      setLoading(false);
      return;
    }

    setOpen(false);
    setName("");
    setDescription("");
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} />
        カテゴリーを追加
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新しいカテゴリーを作成"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="カテゴリー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ネットワーク基礎"
            error={error}
          />
          <Textarea
            label="説明（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="このカテゴリーの説明を入力してください"
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
              作成する
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
