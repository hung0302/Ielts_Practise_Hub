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

export interface Passage {
  id: string;
  title: string;
  text: string;
  sections: Section[];
}

export interface ReadingTest {
  id: string;
  title: string;
  content: {
    passages: Passage[];
  };
  correct_answers: Record<string, string>;
}
