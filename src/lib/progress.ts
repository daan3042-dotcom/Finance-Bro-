import AsyncStorage from '@react-native-async-storage/async-storage';

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

const STORAGE_KEY = 'financebro:progress:v1';

// Aantal opeenvolgende goede antwoorden waarna een concept als voltooid geldt.
const COMPLETION_STREAK = 3;

const emptyConceptProgress: ConceptProgress = {
  correctCount: 0,
  incorrectCount: 0,
  consecutiveCorrect: 0,
  completed: false,
  seenQuestionIndices: [],
};

export function createEmptyProgress(): ProgressState {
  return { concepts: {} };
}

export async function loadProgress(): Promise<ProgressState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.concepts) {
      return createEmptyProgress();
    }
    return parsed as ProgressState;
  } catch {
    return createEmptyProgress();
  }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
