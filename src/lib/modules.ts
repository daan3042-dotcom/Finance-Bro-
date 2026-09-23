import macroModuleData from '../../data/modules/macro.json';
import { getModuleLessonProgress, type ModuleProgressState } from './moduleProgress';
import type { ModuleData, ModuleLesson, ModuleTrack } from './types';

export const modules: ModuleData[] = [macroModuleData as ModuleData];

// Vaste tracks-volgorde voor de canonieke lesvolgorde (los van de
// `tracks`-array in de module-JSON, die alleen voor UI-weergave is).
const CANONICAL_TRACK_ORDER: ModuleTrack[] = ['beginner', 'gevorderd', 'expert'];

export type CanonicalLessonRef = {
  track: ModuleTrack;
  lesson: ModuleLesson;
  /** Positie in de volledige, over alle tracks heen doorlopende lesvolgorde. */
  index: number;
};

/**
 * Alle lessen van een module in canonieke volgorde: eerst beginner, dan
 * gevorderd, dan expert, en binnen elke track op `lesson.order`. Dit is de
 * volgorde waarin een gebruiker de module normaal doorloopt, en is de basis
 * voor de diagnosetoets-plaatsing (welke lessen liggen "voor" het
 * voorgestelde startpunt).
 */
export function getCanonicalLessonSequence(moduleId: string): CanonicalLessonRef[] {
  const module = getModule(moduleId);
  if (!module) return [];

  const sequence: CanonicalLessonRef[] = [];
  for (const track of CANONICAL_TRACK_ORDER) {
    const lessons = [...(module.lessons[track] ?? [])].sort((a, b) => a.order - b.order);
    for (const lesson of lessons) {
      sequence.push({ track, lesson, index: sequence.length });
    }
  }
  return sequence;
}

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

/**
 * Een track is pas speelbaar zodra de eerste les daadwerkelijk inhoud heeft
 * (uitleg + vragen). Een track met alleen lesskeletten (id/title/order,
 * nog geen explanation/questions) telt als "binnenkort beschikbaar".
 */
export function isTrackAvailable(moduleId: string, track: ModuleTrack): boolean {
  const lessons = getTrackLessons(moduleId, track);
  const firstLesson = lessons[0];
  return Boolean(firstLesson && firstLesson.explanation && firstLesson.questions.length > 0);
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
