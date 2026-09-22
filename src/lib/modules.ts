import macroModuleData from '../../data/modules/macro.json';
import { getModuleLessonProgress, type ModuleProgressState } from './moduleProgress';
import type { ModuleData, ModuleLesson, ModuleTrack } from './types';

export const modules: ModuleData[] = [macroModuleData as ModuleData];

export const modulesById: Record<string, ModuleData> = Object.fromEntries(
  modules.map((module) => [module.id, module])
);

export const TRACK_LABELS: Record<ModuleTrack, string> = {
  beginner: 'Beginner',
  gevorderd: 'Gevorderd',
  expert: 'Expert',
};

export function getModule(moduleId: string): ModuleData | undefined {
  return modulesById[moduleId];
}

export function getTrackLessons(moduleId: string, track: ModuleTrack): ModuleLesson[] {
  return getModule(moduleId)?.lessons[track] ?? [];
}

export function isTrackAvailable(moduleId: string, track: ModuleTrack): boolean {
  return getTrackLessons(moduleId, track).length > 0;
}

export function getLesson(
  moduleId: string,
  track: ModuleTrack,
  lessonId: string
): ModuleLesson | undefined {
  return getTrackLessons(moduleId, track).find((lesson) => lesson.id === lessonId);
}

export type LessonStatus = 'completed' | 'unlocked' | 'locked';

/**
 * Lessen binnen een track ontgrendelen sequentieel: les 1 staat altijd open,
 * elke volgende les pas zodra de vorige is voltooid.
 */
export function getLessonStatus(
  moduleId: string,
  track: ModuleTrack,
  lessonIndex: number,
  progress: ModuleProgressState
): LessonStatus {
  const lessons = getTrackLessons(moduleId, track);
  const lesson = lessons[lessonIndex];
  if (!lesson) return 'locked';

  if (getModuleLessonProgress(progress, moduleId, track, lesson.id).completed) {
    return 'completed';
  }
  if (lessonIndex === 0) return 'unlocked';

  const previousLesson = lessons[lessonIndex - 1];
  const previousCompleted = getModuleLessonProgress(
    progress,
    moduleId,
    track,
    previousLesson.id
  ).completed;
  return previousCompleted ? 'unlocked' : 'locked';
}
