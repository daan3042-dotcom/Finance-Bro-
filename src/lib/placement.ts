import { getCanonicalLessonSequence, getModule, type CanonicalLessonRef } from './modules';
import {
  loadModuleProgress,
  saveModuleProgress,
  withLessonPlaced,
  type ModuleProgressState,
} from './moduleProgress';
import { getConceptProgress, loadProgress, saveProgress, type ProgressState } from './progress';
import type { ModuleQuestion, ModuleTrack } from './types';

// ============================================================
// Zelf-rapportage (stap 1): bepaalt alleen waar de diagnosetoets qua
// denkniveau start te steken, nooit de uiteindelijke plaatsing zelf.
// ============================================================

export type SelfReportLevel = 'geen_ervaring' | 'enige_kennis' | 'veel_ervaring';

export const SELF_REPORT_OPTIONS: {
  value: SelfReportLevel;
  label: string;
  description: string;
}[] = [
  {
    value: 'geen_ervaring',
    label: 'Geen ervaring',
    description: 'Ik begin helemaal opnieuw met dit onderwerp.',
  },
  {
    value: 'enige_kennis',
    label: 'Enige kennis',
    description: 'Ik ken al wat basisbegrippen, maar niet alles.',
  },
  {
    value: 'veel_ervaring',
    label: 'Veel ervaring',
    description: 'Ik weet hier al veel van en wil niet bij het begin beginnen.',
  },
];

// ============================================================
// Diagnosetoets: vraagselectie
// ============================================================

export type DiagnosticQuestionRef = {
  track: ModuleTrack;
  lessonId: string;
  question: ModuleQuestion;
};

export const DIAGNOSTIC_QUESTION_COUNT = 12;

// Welke cognitive_level-niveaus (1-7) de diagnosetoets target, per
// zelf-gerapporteerd niveau. Elke lijst raakt alle 7 niveaus aan (zodat we
// altijd ook boven/onder de eigen inschatting toetsen), met meer gewicht
// rond het zelf-gerapporteerde startpunt.
const LEVEL_PLAN: Record<SelfReportLevel, number[]> = {
  geen_ervaring: [1, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 7],
  enige_kennis: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
  veel_ervaring: [1, 2, 3, 4, 5, 5, 6, 6, 6, 7, 7, 7],
};

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getAllModuleQuestions(moduleId: string): DiagnosticQuestionRef[] {
  const sequence = getCanonicalLessonSequence(moduleId);
  const refs: DiagnosticQuestionRef[] = [];
  for (const { track, lesson } of sequence) {
    for (const question of lesson.questions) {
      refs.push({ track, lessonId: lesson.id, question });
    }
  }
  return refs;
}

function pickCandidate(
  byLevel: Map<number, DiagnosticQuestionRef[]>,
  targetLevel: number,
  usedIds: Set<string>,
  usedConcepts: Set<string>,
  requireFreshConcept: boolean
): DiagnosticQuestionRef | null {
  for (let distance = 0; distance <= 6; distance += 1) {
    const levels = distance === 0 ? [targetLevel] : [targetLevel - distance, targetLevel + distance];
    for (const level of levels) {
      const bucket = byLevel.get(level);
      if (!bucket) continue;
      const match = bucket.find((ref) => {
        if (usedIds.has(ref.question.id)) return false;
        if (!requireFreshConcept) return true;
        return ref.question.concepts.some((c) => !usedConcepts.has(c));
      });
      if (match) return match;
    }
  }
  return null;
}

/**
 * Selecteert een diagnosetoets uit de bestaande vraagbank van de module,
 * gespreid over cognitive_level 1-7 en gewogen naar het zelf-gerapporteerde
 * niveau uit stap 1. Trekt vragen uit alle tracks (beginner/gevorderd/
 * expert) door elkaar, niet alleen uit de track die bij het niveau hoort.
 */
export function pickDiagnosticQuestions(
  moduleId: string,
  selfReport: SelfReportLevel
): DiagnosticQuestionRef[] {
  const byLevel = new Map<number, DiagnosticQuestionRef[]>();
  for (const ref of getAllModuleQuestions(moduleId)) {
    const level = ref.question.cognitive_level;
    const bucket = byLevel.get(level);
    if (bucket) bucket.push(ref);
    else byLevel.set(level, [ref]);
  }
  for (const [level, bucket] of byLevel) byLevel.set(level, shuffled(bucket));

  const usedIds = new Set<string>();
  const usedConcepts = new Set<string>();
  const picked: DiagnosticQuestionRef[] = [];

  for (const targetLevel of LEVEL_PLAN[selfReport]) {
    const ref =
      pickCandidate(byLevel, targetLevel, usedIds, usedConcepts, true) ??
      pickCandidate(byLevel, targetLevel, usedIds, usedConcepts, false);
    if (!ref) continue;
    picked.push(ref);
    usedIds.add(ref.question.id);
    for (const c of ref.question.concepts) usedConcepts.add(c);
  }
  return picked;
}

// ============================================================
// Plaatsingslogica: score per concept, niet alleen een totaalscore
// ============================================================

export type DiagnosticAnswer = {
  question: DiagnosticQuestionRef;
  selectedOptionId: string;
  isCorrect: boolean;
};

export type PlacementConceptResult = {
  conceptId: string;
  correctCount: number;
  incorrectCount: number;
  /** Strikt: alleen "beheerst" als elke geteste vraag over dit concept goed was. */
  mastered: boolean;
};

export type PlacementResult = {
  recommendedTrack: ModuleTrack;
  recommendedLessonId: string;
  recommendedLessonIndex: number;
  conceptResults: PlacementConceptResult[];
  scoreByTrack: Record<ModuleTrack, { correct: number; total: number }>;
};

/** Eerste (canonieke) lesindex waar elk concept-label voor het eerst voorkomt. */
function buildConceptHomeIndex(sequence: CanonicalLessonRef[]): Map<string, number> {
  const homeIndex = new Map<string, number>();
  for (const { lesson, index } of sequence) {
    for (const question of lesson.questions) {
      for (const conceptId of question.concepts) {
        if (!homeIndex.has(conceptId)) homeIndex.set(conceptId, index);
      }
    }
  }
  return homeIndex;
}

const TRACK_SEQUENCE: ModuleTrack[] = ['beginner', 'gevorderd', 'expert'];

/**
 * Plaatsing gebeurt op trackniveau, niet op lesniveau: een diagnosetoets van
 * 10-15 vragen dekt onmogelijk elk concept van elke afzonderlijke les (~2-3
 * nieuwe concepten per les, verspreid over 16 lessen). Trackniveau (3
 * grovere eenheden) is de resolutie waarop een korte toets betrouwbaar
 * uitspraken kan doen.
 *
 * Een track telt als "al beheerst" als er bewijs is (minstens één vraag ÚIT
 * die track, over een concept dat in die track voor het eerst wordt
 * geïntroduceerd) en geen van die vragen fout is beantwoord. Het bewijs moet
 * zowel uit de juiste track komen als een eigen concept van die track
 * toetsen — anders zou bijvoorbeeld een lastige expert-vraag die het
 * concept "BBP" hergebruikt (voor het eerst geïntroduceerd in beginner) de
 * beginner-track ten onrechte kunnen laten afkeuren. Bij twijfel (geen
 * bewijs, of een fout antwoord) wordt die track het startpunt — nooit
 * verder springen dan aantoonbaar beheerst.
 */
function computeRecommendedTrack(moduleId: string, answers: DiagnosticAnswer[]): ModuleTrack {
  const sequence = getCanonicalLessonSequence(moduleId);
  const homeIndex = buildConceptHomeIndex(sequence);

  const trackByConcept = new Map<string, ModuleTrack>();
  for (const [conceptId, lessonIndex] of homeIndex) {
    trackByConcept.set(conceptId, sequence[lessonIndex].track);
  }

  for (const track of TRACK_SEQUENCE) {
    const relevantAnswers = answers.filter(
      (a) =>
        a.question.track === track &&
        a.question.question.concepts.some((c) => trackByConcept.get(c) === track)
    );
    const hasEvidence = relevantAnswers.length > 0;
    const hasGap = relevantAnswers.some((a) => !a.isCorrect);
    const trackMastered = hasEvidence && !hasGap;
    if (!trackMastered) return track;
  }
  return TRACK_SEQUENCE[TRACK_SEQUENCE.length - 1];
}

function computeRecommendedLesson(moduleId: string, answers: DiagnosticAnswer[]): CanonicalLessonRef {
  const track = computeRecommendedTrack(moduleId, answers);
  const sequence = getCanonicalLessonSequence(moduleId);
  const firstOfTrack = sequence.find((ref) => ref.track === track);
  return firstOfTrack ?? sequence[0];
}

const EMPTY_TRACK_SCORE = () => ({ correct: 0, total: 0 });

/**
 * Bepaalt de plaatsing op basis van de score per concept (niet alleen een
 * totaalscore): een track wordt pas als "al beheerst" gezien als alle in de
 * diagnosetoets geteste concepten van die track goed zijn beantwoord. Bij
 * twijfel (geen van de concepten van een track getest, of één daarvan fout)
 * wordt die track het voorgestelde startpunt — nooit verder springen dan
 * aantoonbaar beheerst.
 */
export function computePlacement(moduleId: string, answers: DiagnosticAnswer[]): PlacementResult {
  const conceptTally = new Map<string, { correct: number; incorrect: number }>();
  const scoreByTrack: Record<ModuleTrack, { correct: number; total: number }> = {
    beginner: EMPTY_TRACK_SCORE(),
    gevorderd: EMPTY_TRACK_SCORE(),
    expert: EMPTY_TRACK_SCORE(),
  };

  for (const answer of answers) {
    const trackScore = scoreByTrack[answer.question.track];
    trackScore.total += 1;
    if (answer.isCorrect) trackScore.correct += 1;

    for (const conceptId of answer.question.question.concepts) {
      const tally = conceptTally.get(conceptId) ?? { correct: 0, incorrect: 0 };
      if (answer.isCorrect) tally.correct += 1;
      else tally.incorrect += 1;
      conceptTally.set(conceptId, tally);
    }
  }

  const conceptResults: PlacementConceptResult[] = Array.from(conceptTally.entries()).map(
    ([conceptId, tally]) => ({
      conceptId,
      correctCount: tally.correct,
      incorrectCount: tally.incorrect,
      mastered: tally.incorrect === 0,
    })
  );

  const recommended = computeRecommendedLesson(moduleId, answers);

  return {
    recommendedTrack: recommended.track,
    recommendedLessonId: recommended.lesson.id,
    recommendedLessonIndex: recommended.index,
    conceptResults,
    scoreByTrack,
  };
}

// ============================================================
// Toepassen: wegschrijven in de bestaande progress-tabellen
// ============================================================

/**
 * Markeert alle lessen vóór de (eventueel door de gebruiker overruled)
 * gekozen les als voltooid-via-plaatsing in lesson_progress, en schrijft de
 * per-concept diagnostiek-tellingen naar concept_progress. Nooit een aparte
 * tabel: dit hergebruikt precies de tabellen die de rest van de app ook
 * gebruikt om voortgang te bepalen.
 */
export async function applyPlacement(
  moduleId: string,
  chosenTrack: ModuleTrack,
  chosenLessonId: string,
  result: PlacementResult
): Promise<void> {
  const sequence = getCanonicalLessonSequence(moduleId);
  const chosenIndex = sequence.findIndex(
    (ref) => ref.track === chosenTrack && ref.lesson.id === chosenLessonId
  );
  const boundary = chosenIndex === -1 ? sequence.length : chosenIndex;

  let moduleProgress: ModuleProgressState = await loadModuleProgress();
  for (const ref of sequence) {
    if (ref.index >= boundary) break;
    moduleProgress = withLessonPlaced(moduleProgress, moduleId, ref.track, ref.lesson.id);
  }
  await saveModuleProgress(moduleProgress);

  let progress: ProgressState = await loadProgress();
  for (const conceptResult of result.conceptResults) {
    const current = getConceptProgress(progress, conceptResult.conceptId);
    progress = {
      ...progress,
      concepts: {
        ...progress.concepts,
        [conceptResult.conceptId]: {
          ...current,
          correctCount: current.correctCount + conceptResult.correctCount,
          incorrectCount: current.incorrectCount + conceptResult.incorrectCount,
          consecutiveCorrect: conceptResult.mastered
            ? current.consecutiveCorrect + conceptResult.correctCount
            : 0,
          completed: current.completed || conceptResult.mastered,
        },
      },
    };
  }
  await saveProgress(progress);
}

/** Heeft deze gebruiker al ergens in deze module voortgang? Zo ja, geen onboarding meer tonen. */
export function hasAnyModuleProgress(moduleProgress: ModuleProgressState, moduleId: string): boolean {
  const prefix = `${moduleId}:`;
  return Object.keys(moduleProgress.lessons).some((key) => key.startsWith(prefix));
}

export function getModuleName(moduleId: string): string {
  return getModule(moduleId)?.name ?? moduleId;
}
