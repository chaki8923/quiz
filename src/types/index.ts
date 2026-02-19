export type Category = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Quiz = {
  id: string;
  category_id: string;
  question: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  choices?: Choice[];
};

export type Choice = {
  id: string;
  quiz_id: string;
  text: string;
  is_correct: boolean;
  explanation: string | null;
  order_index: number;
};

export type Session = {
  id: string;
  category_id: string;
  status: "waiting" | "in_progress" | "completed";
  current_quiz_index: number;
  created_at: string;
  updated_at: string;
  category?: Category;
};

export type Participant = {
  id: string;
  session_id: string;
  name: string;
  created_at: string;
};

export type Answer = {
  id: string;
  participant_id: string;
  quiz_id: string;
  choice_id: string;
  session_id: string;
  created_at: string;
  participant?: Participant;
  choice?: Choice;
};


export type QuizWithChoices = Quiz & {
  choices: Choice[];
};

export type CategoryWithQuizzes = Category & {
  quizzes: QuizWithChoices[];
};
