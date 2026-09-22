import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModuleTrack } from './types';

export type ModuleLessonProgress = {
  completed: boolean;
  seenQuestionIndices: number[];
};

export type ModuleProgressState = {
  lessons: Record<string, ModuleLessonProgress>;
};

// Eigen opslagsleutel: los van financebro:progress:v1 (de concept-graaf-voortgang),
// zodat modules en de concept-graaf elkaars voortgang niet overschrijven.
const STORAGE_KEY = 'financebro:module-progress:v1';

const emptyLessonProgress: ModuleLessonProgress = {
  completed: false,
  seenQuestionIndices: [],
};

function lessonKey(moduleId: string, track: ModuleTrack, lessonId: string): string {
  return `${moduleId}:${track}:${lessonId}`;
}

export function createEmptyModuleProgress(): ModuleProgressState {
  return { lessons: {} };
}

export async function loadModuleProgress(): Promise<ModuleProgressState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyModuleProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.lessons) {
      return createEmptyModuleProgress();
    }
    return parsed as ModuleProgressState;
  } catch {
    return createEmptyModuleProgress();
  }
}

export async function saveModuleProgress(state: ModuleProgressState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getModuleLessonProgress(
  state: ModuleProgressState,
  moduleId: string,
  track: ModuleTrack,
  lessonId: string
): ModuleLessonProgress {
  return state.lessons[lessonKey(moduleId, track, lessonId)] ?? emptyLessonProgress;
}

export function withLessonQuestionSeen(
  state: ModuleProgressState,
  moduleId: string,
  track: ModuleTrack,
  lessonId: string,
  questionIndex: number
): ModuleProgressState {
  const key = lessonKey(moduleId, track, lessonId);
  const current = getModuleLessonProgress(state, moduleId, track, lessonId);
  if (current.seenQuestionIndices.includes(questionIndex)) return state;
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [key]: { ...current, seenQuestionIndices: [...current.seenQuestionIndices, questionIndex] },
    },
  };
}

export function withLessonCompleted(
  state: ModuleProgressState,
  moduleId: string,
  track: ModuleTrack,
  lessonId: string
): ModuleProgressState {
  const key = lessonKey(moduleId, track, lessonId);
  const current = getModuleLessonProgress(state, moduleId, track, lessonId);
  return {
    ...state,
    lessons: { ...state.lessons, [key]: { ...current, completed: true } },
  };
}
