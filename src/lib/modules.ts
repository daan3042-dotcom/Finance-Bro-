import aandelenModuleData from '../../data/modules/aandelen.json';
import energieModuleData from '../../data/modules/energie.json';
import gedragModuleData from '../../data/modules/gedrag.json';
import geopolitiekModuleData from '../../data/modules/geopolitiek.json';
import grondstoffenModuleData from '../../data/modules/grondstoffen.json';
import macroModuleData from '../../data/modules/macro.json';
import marktModuleData from '../../data/modules/markt.json';
import metalenModuleData from '../../data/modules/metalen.json';
import risicoModuleData from '../../data/modules/risico.json';
import technischeAnalyseModuleData from '../../data/modules/technische_analyse.json';
import technologieModuleData from '../../data/modules/technologie.json';
import { getModuleLessonProgress, type ModuleProgressState } from './moduleProgress';
import type { ModuleData, ModuleLesson, ModuleTrack } from './types';

export const modules: ModuleData[] = [
  macroModuleData as ModuleData,
  marktModuleData as ModuleData,
  aandelenModuleData as ModuleData,
  gedragModuleData as ModuleData,
  risicoModuleData as ModuleData,
  technologieModuleData as ModuleData,
  geopolitiekModuleData as ModuleData,
  energieModuleData as ModuleData,
  grondstoffenModuleData as ModuleData,
  metalenModuleData as ModuleData,
  technischeAnalyseModuleData as ModuleData,
];

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
