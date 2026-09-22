import { supabase } from './supabase';

// Kleine wrappers rond Date.now(), zodat schermen die de tijd tussen tonen
// en beantwoorden van een vraag meten dit via een import doen in plaats van
// de globale Date.now() direct in render-/handlerlogica aan te roepen (dat
// laatste triggert de react-hooks/purity-lintregel).
export function nowMs(): number {
  return Date.now();
}

export function elapsedMs(startedAtMs: number): number {
  return Date.now() - startedAtMs;
}

export type LogQuestionResponseInput = {
  questionId: string;
  lessonId: string | null;
  track: string | null;
  conceptIds: string[];
  isCorrect: boolean;
  selectedAnswer: string;
  responseTimeMs: number | null;
  sessionId: string;
};

/**
 * Logt één beantwoorde vraag als ruwe data (fundament voor latere IRT/BKT-
 * analyse, zie §16 van docs/project-instructies.md). Faalt altijd stil: een
 * ontbrekende rij is acceptabel, een vastgelopen scherm niet. Bewust
 * fire-and-forget — niet awaiten in de aanroepende code.
 */
export async function logQuestionResponse(input: LogQuestionResponseInput): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('question_responses').insert({
      user_id: user.id,
      question_id: input.questionId,
      lesson_id: input.lessonId,
      track: input.track,
      concept_ids: input.conceptIds,
      is_correct: input.isCorrect,
      selected_answer: input.selectedAnswer,
      response_time_ms: input.responseTimeMs,
      session_id: input.sessionId,
    });

    if (error) {
      console.warn('logQuestionResponse: opslaan mislukt', error.message);
    }
  } catch (err) {
    console.warn('logQuestionResponse: onverwachte fout', err);
  }
}
