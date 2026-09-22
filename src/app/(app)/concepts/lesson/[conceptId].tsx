import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { conceptsById } from '../../../../lib/concepts';
import {
  createEmptyProgress,
  getConceptProgress,
  loadProgress,
  saveProgress,
  withAnswer,
  withSeenQuestions,
  type ProgressState,
} from '../../../../lib/progress';
import { getQuestionPool, pickNextQuestionIndex, QUESTIONS_PER_LESSON } from '../../../../lib/questions';

async function pickAndPersistNext(
  progress: ProgressState,
  conceptId: string,
  poolSize: number,
  excludeIndex: number | null
): Promise<{ index: number; progress: ProgressState }> {
  const conceptProgress = getConceptProgress(progress, conceptId);
  const { index, seenAfter } = pickNextQuestionIndex(
    conceptProgress.seenQuestionIndices,
    poolSize,
    excludeIndex
  );
  const updated = withSeenQuestions(progress, conceptId, seenAfter);
  await saveProgress(updated);
  return { index, progress: updated };
}

export default function LessonScreen() {
  const router = useRouter();
  const { conceptId: rawConceptId } = useLocalSearchParams<{ conceptId: string }>();
  const conceptId = Array.isArray(rawConceptId) ? rawConceptId[0] : rawConceptId;
  const concept = conceptId ? conceptsById[conceptId] : undefined;
  const pool = conceptId ? getQuestionPool(conceptId) : [];

  const [isLoading, setIsLoading] = useState(() => Boolean(conceptId) && pool.length > 0);
  const [progress, setProgress] = useState<ProgressState>(createEmptyProgress());
  const [poolIndex, setPoolIndex] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctInLesson, setCorrectInLesson] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!conceptId || pool.length === 0) {
      return;
    }
    let isActive = true;
    (async () => {
      const loaded = await loadProgress();
      const { index, progress: updated } = await pickAndPersistNext(
        loaded,
        conceptId,
        pool.length,
        null
      );
      if (!isActive) return;
      setProgress(updated);
      setPoolIndex(index);
      setIsLoading(false);
    })();
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId]);

  if (!conceptId || !concept || pool.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Les' }} />
        <View style={styles.completeContent}>
          <Text style={styles.completeTitle}>Les niet gevonden</Text>
          <Pressable style={styles.restartButton} onPress={() => router.back()}>
            <Text style={styles.restartButtonText}>Terug naar overzicht</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isLoading || poolIndex === null) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: concept.name }} />
        <View style={styles.completeContent}>
          <Text style={styles.loadingText}>Vraag laden…</Text>
        </View>
      </View>
    );
  }

  const question = pool[poolIndex];
  const isLastQuestion = answeredCount + 1 >= QUESTIONS_PER_LESSON;
  const hasAnswered = selectedOptionId !== null;
  const isCorrect = selectedOptionId === question.correct_option_id;

  const handleNext = async () => {
    const justCorrect = selectedOptionId === question.correct_option_id;
    const updatedAfterAnswer = withAnswer(progress, conceptId, justCorrect);
    await saveProgress(updatedAfterAnswer);

    const newAnsweredCount = answeredCount + 1;
    const newCorrectInLesson = correctInLesson + (justCorrect ? 1 : 0);

    if (newAnsweredCount >= QUESTIONS_PER_LESSON) {
      setProgress(updatedAfterAnswer);
      setAnsweredCount(newAnsweredCount);
      setCorrectInLesson(newCorrectInLesson);
      setIsFinished(true);
      return;
    }

    const { index, progress: updatedAfterPick } = await pickAndPersistNext(
      updatedAfterAnswer,
      conceptId,
      pool.length,
      poolIndex
    );
    setProgress(updatedAfterPick);
    setPoolIndex(index);
    setSelectedOptionId(null);
    setAnsweredCount(newAnsweredCount);
    setCorrectInLesson(newCorrectInLesson);
  };

  const handleRestart = async () => {
    setIsLoading(true);
    setIsFinished(false);
    setAnsweredCount(0);
    setCorrectInLesson(0);
    setSelectedOptionId(null);

    const loaded = await loadProgress();
    const { index, progress: updated } = await pickAndPersistNext(
      loaded,
      conceptId,
      pool.length,
      poolIndex
    );
    setProgress(updated);
    setPoolIndex(index);
    setIsLoading(false);
  };

  if (isFinished) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: concept.name }} />
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>Les voltooid!</Text>
          <Text style={styles.completeSubtitle}>
            Je had {correctInLesson} van de {QUESTIONS_PER_LESSON} vragen goed over{' '}
            {concept.name}.
          </Text>
          <Pressable style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartButtonText}>Nog een keer</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Terug naar overzicht</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: concept.name }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.progressLabel}>
          Vraag {answeredCount + 1} van {QUESTIONS_PER_LESSON}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((answeredCount + 1) / QUESTIONS_PER_LESSON) * 100}%` },
            ]}
          />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {concept.name} · Tier {concept.tier}
          </Text>
        </View>

        <Text style={styles.question}>{question.question}</Text>

        <View style={styles.options}>
          {question.options.map((option) => {
            const isSelected = option.id === selectedOptionId;
            const isCorrectOption = option.id === question.correct_option_id;

            const optionStateStyle = hasAnswered
              ? isCorrectOption
                ? styles.optionCorrect
                : isSelected
                  ? styles.optionIncorrect
                  : styles.optionDisabled
              : null;

            const optionTextStateStyle = hasAnswered
              ? isCorrectOption
                ? styles.optionTextCorrect
                : isSelected
                  ? styles.optionTextIncorrect
                  : null
              : null;

            return (
              <Pressable
                key={option.id}
                style={[styles.option, optionStateStyle]}
                disabled={hasAnswered}
                onPress={() => setSelectedOptionId(option.id)}
              >
                <Text style={[styles.optionText, optionTextStateStyle]}>{option.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {hasAnswered && (
          <>
            <View
              style={[
                styles.feedback,
                isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
              ]}
            >
              <Text style={styles.feedbackTitle}>
                {isCorrect ? 'Goed gedaan! ✅' : 'Niet helemaal ❌'}
              </Text>
              <Text style={styles.feedbackExplanation}>{question.explanation}</Text>
            </View>

            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {isLastQuestion ? 'Afronden' : 'Volgende vraag'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7190',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7190',
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E6F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3B4FD9',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E4E9FF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeText: {
    color: '#3B4FD9',
    fontSize: 13,
    fontWeight: '600',
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1F36',
    lineHeight: 32,
    marginBottom: 28,
  },
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#1A1F36',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1F36',
  },
  optionCorrect: {
    backgroundColor: '#E6F6EC',
    borderColor: '#34A853',
  },
  optionTextCorrect: {
    color: '#1E7B3B',
    fontWeight: '700',
  },
  optionIncorrect: {
    backgroundColor: '#FCEAEA',
    borderColor: '#E14343',
  },
  optionTextIncorrect: {
    color: '#B92B2B',
    fontWeight: '700',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  feedback: {
    marginTop: 28,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
  },
  feedbackCorrect: {
    backgroundColor: '#E6F6EC',
    borderColor: '#34A853',
  },
  feedbackIncorrect: {
    backgroundColor: '#FCEAEA',
    borderColor: '#E14343',
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 8,
  },
  feedbackExplanation: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3C4257',
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#3B4FD9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  completeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  completeEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 10,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#3C4257',
    textAlign: 'center',
    marginBottom: 28,
  },
  restartButton: {
    backgroundColor: '#3B4FD9',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#3B4FD9',
    fontSize: 15,
    fontWeight: '600',
  },
});
