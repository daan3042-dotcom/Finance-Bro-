import questionsData from '../../data/questions.json';
import type { Question } from './types';

const questionsByConcept = questionsData.questions_by_concept as Record<string, Question[]>;

// Aantal vragen dat één les-sessie voor een concept aanbiedt.
export const QUESTIONS_PER_LESSON = 5;

export function getQuestionPool(conceptId: string): Question[] {
  return questionsByConcept[conceptId] ?? [];
}

/**
 * Kiest de volgende vraag-index uit de pool, zonder een vraag te herhalen
 * totdat de hele pool gezien is. Zodra de pool op is, begint de cyclus
 * opnieuw. `excludeIndex` voorkomt dat dezelfde vraag twee keer direct
 * achter elkaar verschijnt op het moment dat de cyclus net is gereset.
 */
export function pickNextQuestionIndex(
  seenQuestionIndices: number[],
  poolSize: number,
  excludeIndex: number | null
): { index: number; seenAfter: number[] } {
  let seen = seenQuestionIndices.filter((index) => index < poolSize);
  let available = Array.from({ length: poolSize }, (_, index) => index).filter(
    (index) => !seen.includes(index)
  );

  if (available.length === 0) {
    seen = [];
    available = Array.from({ length: poolSize }, (_, index) => index);
  }

  if (available.length > 1 && excludeIndex !== null) {
    available = available.filter((index) => index !== excludeIndex);
  }

  const index = available[Math.floor(Math.random() * available.length)];
  return { index, seenAfter: [...seen, index] };
}
