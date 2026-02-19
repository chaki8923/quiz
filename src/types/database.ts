export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          choice_id: string
          created_at: string
          id: string
          participant_id: string
          quiz_id: string
          session_id: string
        }
        Insert: {
          choice_id: string
          created_at?: string
          id?: string
          participant_id: string
          quiz_id: string
          session_id: string
        }
        Update: {
          choice_id?: string
          created_at?: string
          id?: string
          participant_id?: string
          quiz_id?: string
          session_id?: string
        }
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
      }
      choices: {
        Row: {
          explanation: string | null
          id: string
          is_correct: boolean
          order_index: number
          quiz_id: string
          text: string
        }
        Insert: {
          explanation?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          quiz_id: string
          text: string
        }
        Update: {
          explanation?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          quiz_id?: string
          text?: string
        }
      }
      participants: {
        Row: {
          created_at: string
          id: string
          name: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          session_id?: string
        }
      }
      quizzes: {
        Row: {
          category_id: string
          created_at: string
          id: string
          order_index: number
          question: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          order_index?: number
          question: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          order_index?: number
          question?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          category_id: string
          created_at: string
          current_quiz_index: number
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          current_quiz_index?: number
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          current_quiz_index?: number
          id?: string
          status?: string
          updated_at?: string
        }
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
  }
}
