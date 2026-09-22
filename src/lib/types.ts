export type Concept = {
  id: string;
  name: string;
  tier: number;
  prerequisites: string[];
};

export type QuestionOption = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  format: string;
  question: string;
  options: QuestionOption[];
  correct_option_id: string;
  explanation: string;
};

export type ModuleTrack = 'beginner' | 'gevorderd' | 'expert';

export type ModuleQuestion = Question & {
  concepts: string[];
  difficulty_prior: number;
  disclaimer?: string;
};

export type ModuleLesson = {
  id: string;
  title: string;
  order: number;
  explanation: string;
  questions: ModuleQuestion[];
};

export type ModuleData = {
  id: string;
  name: string;
  order: number;
  tracks: ModuleTrack[];
  lessons: Record<ModuleTrack, ModuleLesson[]>;
};
