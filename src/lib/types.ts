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
  /**
   * Bloom-taxonomie-geïnspireerd denkniveau (1-7), apart van difficulty_prior.
   * Zie format_rules.cognitive_level_rubriek in data/modules/macro.json.
   * Gebruikt om de diagnosetoets bij trackplaatsing te spreiden over
   * denkniveaus in plaats van alleen contentzwaarte.
   */
  cognitive_level: number;
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
