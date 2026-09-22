import { supabase } from './supabase';
import type { ModuleTrack } from './types';

export type ModuleLessonProgress = {
  completed: boolean;
  correctCount: number;
  incorrectCount: number;
  seenQuestionIndices: number[];
};

export type ModuleProgressState = {
  lessons: Record<string, ModuleLessonProgress>;
};

const emptyLessonProgress: ModuleLessonProgress = {
  completed: false,
  correctCount: 0,
  incorrectCount: 0,
  seenQuestionIndices: [],
};

type LessonProgressRow = {
  module_id: string;
  track: string;
  lesson_id: string;
  completed: boolean;
  correct_count: number;
  incorrect_count: number;
  seen_question_indices: number[] | null;
};

function lessonKey(moduleId: string, track: ModuleTrack, lessonId: string): string {
  return `${moduleId}:${track}:${lessonId}`;
}

export function createEmptyModuleProgress(): ModuleProgressState {
  return { lessons: {} };
}

async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function loadModuleProgress(): Promise<ModuleProgressState> {
  const userId = await getUserId();
  if (!userId) return createEmptyModuleProgress();

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('module_id, track, lesson_id, completed, correct_count, incorrect_count, seen_question_indices')
    .eq('user_id', userId);

  if (error) throw error;

  const lessons: Record<string, ModuleLessonProgress> = {};
  for (const row of (data ?? []) as LessonProgressRow[]) {
    const key = lessonKey(row.module_id, row.track as ModuleTrack, row.lesson_id);
    lessons[key] = {
      completed: row.completed,
      correctCount: row.correct_count,
      incorrectCount: row.incorrect_count,
      seenQuestionIndices: row.seen_question_indices ?? [],
    };
  }
  return { lessons };
}

export async function saveModuleProgress(state: ModuleProgressState): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('Niet ingelogd: kan voortgang niet opslaan.');

  const rows = Object.entries(state.lessons).map(([key, progress]) => {
    const [moduleId, track, lessonId] = key.split(':');
    return {
      user_id: userId,
      module_id: moduleId,
      track,
      lesson_id: lessonId,
      completed: progress.completed,
      correct_count: progress.correctCount,
      incorrect_count: progress.incorrectCount,
      seen_question_indices: progress.seenQuestionIndices,
      updated_at: new Date().toISOString(),
    };
  });

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(rows, { onConflict: 'user_id,module_id,track,lesson_id' });

  if (error) throw error;
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

export function withLessonAnswer(
  state: ModuleProgressState,
  moduleId: string,
  track: ModuleTrack,
  lessonId: string,
  isCorrect: boolean
): ModuleProgressState {
  const key = lessonKey(moduleId, track, lessonId);
  const current = getModuleLessonProgress(state, moduleId, track, lessonId);
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [key]: {
        ...current,
        correctCount: current.correctCount + (isCorrect ? 1 : 0),
        incorrectCount: current.incorrectCount + (isCorrect ? 0 : 1),
      },
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
