import { ListeningTest, Question } from '../types/listening';

const generateQuestions = (start: number, end: number, type: 'fill_in_blank' | 'multiple_choice' = 'fill_in_blank'): Question[] => {
  const questions: Question[] = [];
  for (let i = start; i <= end; i++) {
    questions.push({
      id: `q${i}`,
      number: i,
      type,
      text: type === 'fill_in_blank' ? `Answer for question ${i}: ` : `Question ${i} is about...?`,
      options: type === 'multiple_choice' ? ['A. Option A', 'B. Option B', 'C. Option C'] : undefined
    });
  }
  return questions;
};

const generateAnswers = (start: number, end: number, type: 'fill_in_blank' | 'multiple_choice' = 'fill_in_blank') => {
  const answers: Record<string, string> = {};
  for (let i = start; i <= end; i++) {
    answers[`q${i}`] = type === 'fill_in_blank' ? `answer${i}` : 'A';
  }
  return answers;
};

export const mockListeningTests: ListeningTest[] = [
  {
    id: 'ielts-mock-test-1',
    title: 'IELTS Mock Test 1 (40 Questions)',
    audio_url_1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    audio_url_2: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    audio_url_3: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    content: {
      sections: [
        {
          id: 's1',
          title: 'Section 1: Conversation',
          instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.',
          questions: generateQuestions(1, 13, 'fill_in_blank')
        },
        {
          id: 's2',
          title: 'Section 2: Monologue',
          instruction: 'Choose the correct letter, A, B, or C.',
          questions: generateQuestions(14, 26, 'multiple_choice')
        },
        {
          id: 's3',
          title: 'Section 3: Academic Discussion',
          instruction: 'Complete the summary below. Write NO MORE THAN TWO WORDS for each answer.',
          questions: generateQuestions(27, 40, 'fill_in_blank')
        }
      ]
    },
    correct_answers: {
      ...generateAnswers(1, 13, 'fill_in_blank'),
      ...generateAnswers(14, 26, 'multiple_choice'),
      ...generateAnswers(27, 40, 'fill_in_blank')
    }
  }
];
