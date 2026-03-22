export interface WritingQuestion {
  id: string;
  title: string;
  task_type: string;
  prompt: string;
  image_url?: string;
  created_at: string;
}

export interface WritingSubmission {
  id: string;
  session_id: string;
  question_id: string;
  essay_text: string;
  task_response_score: number | null;
  coherence_score: number | null;
  lexical_resource_score: number | null;
  grammar_score: number | null;
  total_score: number | null;
  feedback: string | null;
  status?: 'pending' | 'graded';
}
