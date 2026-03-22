export type QuestionType = 'fill_in_blank' | 'multiple_choice';

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  text: string;
  options?: string[]; // For multiple choice
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questions: Question[];
}

export interface ListeningTest {
  id: string;
  title: string;
  audio_url_1?: string;
  audio_url_2?: string;
  audio_url_3?: string;
  content: {
    sections: Section[];
  };
  correct_answers: Record<string, string>;
}
