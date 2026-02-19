import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { HostSession } from "@/components/session/HostSession";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HostPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*, choices(*)")
    .eq("category_id", session.category_id)
    .order("order_index", { ascending: true });

  return (
    <HostSession
      session={session}
      quizzes={quizzes ?? []}
      categoryName={
        (session as unknown as { categories: { name: string } }).categories?.name ?? ""
      }
    />
  );
}
