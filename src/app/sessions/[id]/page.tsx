import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { QuizSession } from "@/components/session/QuizSession";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  if (session.status === "completed") {
    redirect(`/sessions/${id}/result`);
  }

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*, choices(*)")
    .eq("category_id", session.category_id)
    .order("order_index", { ascending: true });

  return (
    <QuizSession
      session={session}
      quizzes={quizzes ?? []}
      categoryName={
        (session as unknown as { categories: { name: string } }).categories?.name ?? ""
      }
    />
  );
}
