"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

interface JoinFormProps {
  sessionId: string;
}

export function JoinForm({ sessionId }: JoinFormProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("お名前を入力してください");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: participant, error: dbError } = await supabase
      .from("participants")
      .insert({ session_id: sessionId, name: name.trim() })
      .select()
      .single();

    if (dbError || !participant) {
      setError("参加登録に失敗しました。もう一度お試しください。");
      setLoading(false);
      return;
    }

    // participant_id をセッションストレージに保存
    sessionStorage.setItem(`participant_${sessionId}`, participant.id);
    sessionStorage.setItem(`participant_name_${sessionId}`, participant.name);

    // ホストと他の参加者に参加を通知
    await supabase.channel(`session:${sessionId}`).send({
      type: "broadcast",
      event: "participant_join",
      payload: { participant_id: participant.id, name: participant.name },
    });

    router.push(`/sessions/${sessionId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="お名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例: 山田 太郎"
        error={error}
        autoFocus
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        <User size={18} />
        クイズに参加する
      </Button>
    </form>
  );
}
