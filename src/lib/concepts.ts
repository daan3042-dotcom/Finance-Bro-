import conceptsData from '../../data/concepts.json';
import { getConceptProgress, type ProgressState } from './progress';
import type { Concept } from './types';

export const concepts: Concept[] = conceptsData.concepts;

export const conceptsById: Record<string, Concept> = Object.fromEntries(
  concepts.map((concept) => [concept.id, concept])
);

export type ConceptStatus = 'completed' | 'unlocked' | 'locked';

export function getConceptStatus(concept: Concept, progress: ProgressState): ConceptStatus {
  if (getConceptProgress(progress, concept.id).completed) return 'completed';

  const prerequisitesMet = concept.prerequisites.every(
    (prerequisiteId) => getConceptProgress(progress, prerequisiteId).completed
  );
  return prerequisitesMet ? 'unlocked' : 'locked';
}

export function getMissingPrerequisiteNames(concept: Concept, progress: ProgressState): string[] {
  return concept.prerequisites
    .filter((prerequisiteId) => !getConceptProgress(progress, prerequisiteId).completed)
    .map((prerequisiteId) => conceptsById[prerequisiteId]?.name ?? prerequisiteId);
}

export function getConceptsByTier(): { tier: number; concepts: Concept[] }[] {
  const tiers = Array.from(new Set(concepts.map((concept) => concept.tier))).sort(
    (a, b) => a - b
  );
  return tiers.map((tier) => ({
    tier,
    concepts: concepts.filter((concept) => concept.tier === tier),
  }));
}
