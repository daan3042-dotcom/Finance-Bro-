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
  format: string;
  question: string;
  options: QuestionOption[];
  correct_option_id: string;
  explanation: string;
};
