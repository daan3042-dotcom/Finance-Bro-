import { supabase } from './supabase';

export type ConceptProgress = {
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  completed: boolean;
  seenQuestionIndices: number[];
};

export type ProgressState = {
  concepts: Record<string, ConceptProgress>;
};

// Aantal opeenvolgende goede antwoorden waarna een concept als voltooid geldt.
const COMPLETION_STREAK = 3;

const emptyConceptProgress: ConceptProgress = {
  correctCount: 0,
  incorrectCount: 0,
  consecutiveCorrect: 0,
  completed: false,
  seenQuestionIndices: [],
};

type ConceptProgressRow = {
  concept_id: string;
  correct_count: number;
  incorrect_count: number;
  consecutive_correct: number;
  completed: boolean;
  seen_question_indices: number[] | null;
};

export function createEmptyProgress(): ProgressState {
  return { concepts: {} };
}

async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function loadProgress(): Promise<ProgressState> {
  const userId = await getUserId();
  if (!userId) return createEmptyProgress();

  const { data, error } = await supabase
    .from('concept_progress')
    .select('concept_id, correct_count, incorrect_count, consecutive_correct, completed, seen_question_indices')
    .eq('user_id', userId);

  if (error) throw error;

  const concepts: Record<string, ConceptProgress> = {};
  for (const row of (data ?? []) as ConceptProgressRow[]) {
    concepts[row.concept_id] = {
      correctCount: row.correct_count,
      incorrectCount: row.incorrect_count,
      consecutiveCorrect: row.consecutive_correct,
      completed: row.completed,
      seenQuestionIndices: row.seen_question_indices ?? [],
    };
  }
  return { concepts };
}

export async function saveProgress(state: ProgressState): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('Niet ingelogd: kan voortgang niet opslaan.');

  const rows = Object.entries(state.concepts).map(([conceptId, progress]) => ({
    user_id: userId,
    concept_id: conceptId,
    correct_count: progress.correctCount,
    incorrect_count: progress.incorrectCount,
    consecutive_correct: progress.consecutiveCorrect,
    completed: progress.completed,
    seen_question_indices: progress.seenQuestionIndices,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('concept_progress')
    .upsert(rows, { onConflict: 'user_id,concept_id' });

  if (error) throw error;
}

export function getConceptProgress(state: ProgressState, conceptId: string): ConceptProgress {
  return state.concepts[conceptId] ?? emptyConceptProgress;
}

export function withSeenQuestions(
  state: ProgressState,
  conceptId: string,
  seenQuestionIndices: number[]
): ProgressState {
  const current = getConceptProgress(state, conceptId);
  return {
    ...state,
    concepts: {
      ...state.concepts,
      [conceptId]: { ...current, seenQuestionIndices },
    },
  };
}

export function withAnswer(
  state: ProgressState,
  conceptId: string,
  isCorrect: boolean
): ProgressState {
  const current = getConceptProgress(state, conceptId);
  const consecutiveCorrect = isCorrect ? current.consecutiveCorrect + 1 : 0;
  return {
    ...state,
    concepts: {
      ...state.concepts,
      [conceptId]: {
        ...current,
        correctCount: current.correctCount + (isCorrect ? 1 : 0),
        incorrectCount: current.incorrectCount + (isCorrect ? 0 : 1),
        consecutiveCorrect,
        completed: current.completed || consecutiveCorrect >= COMPLETION_STREAK,
      },
    },
  };
}
