import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';

import { LoadErrorState } from '../../../../../components/LoadErrorState';
import { SaveWarningBanner } from '../../../../../components/SaveWarningBanner';
import { useAuth } from '../../../../../lib/auth-context';
import { getLesson, getModule, TRACK_LABELS } from '../../../../../lib/modules';
import {
  createEmptyModuleProgress,
  loadModuleProgress,
  saveModuleProgress,
  withLessonAnswer,
  withLessonCompleted,
  withLessonQuestionSeen,
  type ModuleProgressState,
} from '../../../../../lib/moduleProgress';
import { toUserMessage } from '../../../../../lib/networkError';
import {
  elapsedMs,
  getAttemptCounts,
  logQuestionResponse,
  nowMs,
} from '../../../../../lib/questionResponses';
import { seededShuffle } from '../../../../../lib/shuffle';
import type { ModuleTrack } from '../../../../../lib/types';
import { useAutoHideFlag } from '../../../../../lib/useAutoHideFlag';

function firstOf<T extends string>(value: T | T[] | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type Phase = 'explanation' | 'questions' | 'finished';

export default function ModuleLessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ moduleId: string; track: string; lessonId: string }>();
  const moduleId = firstOf(params.moduleId);
  const track = firstOf(params.track) as ModuleTrack | undefined;
  const lessonId = firstOf(params.lessonId);

  const module = moduleId ? getModule(moduleId) : undefined;
  const lesson = moduleId && track && lessonId ? getLesson(moduleId, track, lessonId) : undefined;

  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [progress, setProgress] = useState<ModuleProgressState>(createEmptyModuleProgress());
  const [phase, setPhase] = useState<Phase>('explanation');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Aantal eerdere keren dat elke vraag van deze les al is beantwoord, per
  // vraag-id — bepaalt de attemptNumber voor de geseede optie-shuffle (zie
  // handleStart en lib/shuffle.ts). Eén keer opgehaald bij de start van de
  // les, want binnen één doorloop komt elke vraag van een module-les maar
  // één keer voor.
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [saveWarningVisible, showSaveWarning] = useAutoHideFlag(4000);
  const questionStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let isActive = true;
    (async () => {
      setIsLoading(true);
      setLoadErrorMessage(null);
      try {
        const loaded = await loadModuleProgress();
        if (!isActive) return;
        setProgress(loaded);
        setIsLoading(false);
      } catch (error) {
        if (!isActive) return;
        setLoadErrorMessage(toUserMessage(error));
        setIsLoading(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (phase === 'questions') {
      questionStartedAtRef.current = nowMs();
    }
  }, [phase, currentIndex]);

  if (!moduleId || !track || !lessonId || !module || !lesson) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Les' }} />
        <View style={styles.completeContent}>
          <Text style={styles.completeTitle}>Les niet gevonden</Text>
          <Pressable style={styles.restartButton} onPress={() => router.back()}>
            <Text style={styles.restartButtonText}>Terug naar lessen</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: lesson.title }} />
        <View style={styles.completeContent}>
          <Text style={styles.loadingText}>Voortgang laden…</Text>
        </View>
      </View>
    );
  }

  if (loadErrorMessage) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: lesson.title }} />
        <LoadErrorState
          message={loadErrorMessage}
          onRetry={() => setReloadToken((token) => token + 1)}
        />
      </View>
    );
  }

  // Optie 2 (C6): opslaan gebeurt op de achtergrond en blokkeert nooit de
  // les. Lukt het niet, dan verschijnt alleen een kort bannertje — de
  // lokale voortgang (`updated`) is al bijgewerkt, dus een latere geslaagde
  // save haalt dit gewoon weer in.
  const persistProgress = (state: ModuleProgressState) => {
    saveModuleProgress(state).catch(() => showSaveWarning());
  };

  // Haalt eerst de attemptCounts op (hoe vaak is elke vraag hiervoor al
  // beantwoord) vóórdat de eerste vraag getoond wordt, zodat de opties
  // meteen in hun definitieve, geseede volgorde verschijnen — anders zouden
  // ze na het laden kunnen "herschudden" onder de vingers van de
  // gebruiker. Mislukt het ophalen (bijv. offline), dan valt
  // getAttemptCounts terug op een lege map en dus op attemptNumber 1.
  const handleStart = async () => {
    const questionIds = lesson.questions.map((q) => q.id);
    const counts = await getAttemptCounts(questionIds);
    setAttemptCounts(counts);

    const updated = withLessonQuestionSeen(progress, moduleId, track, lessonId, 0);
    setProgress(updated);
    setSessionId(Crypto.randomUUID());
    setPhase('questions');
    persistProgress(updated);
  };

  const handleRestart = () => {
    setPhase('explanation');
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setCorrectCount(0);
    setSessionId(null);
  };

  if (phase === 'explanation') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: lesson.title }} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {module.name} · {TRACK_LABELS[track]} · Les {lesson.order}
            </Text>
          </View>
          <Text style={styles.question}>{lesson.title}</Text>
          <Text style={styles.explanationText}>{lesson.explanation}</Text>
          <Pressable style={styles.nextButton} onPress={handleStart}>
            <Text style={styles.nextButtonText}>Start de vragen</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const totalQuestions = lesson.questions.length;

  if (phase === 'finished') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: lesson.title }} />
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>Les voltooid!</Text>
          <Text style={styles.completeSubtitle}>
            Je had {correctCount} van de {totalQuestions} vragen goed over {lesson.title}.
          </Text>
          <Pressable style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartButtonText}>Nog een keer</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Terug naar lessen</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const question = lesson.questions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasAnswered = selectedOptionId !== null;
  const isCorrect = selectedOptionId === question.correct_option_id;

  // Attemptnummer = hoe vaak deze specifieke vraag hiervoor al is
  // beantwoord, plus 1 voor deze keer. Zonder ingelogde gebruiker (zou
  // hier niet moeten voorkomen, dit scherm zit achter de auth-guard) tonen
  // we de opties in hun opgeslagen volgorde als veilige terugval.
  const shuffledOptions = userId
    ? seededShuffle(question.options, {
        userId,
        questionId: question.id,
        attemptNumber: (attemptCounts[question.id] ?? 0) + 1,
      })
    : question.options;

  const handleNext = () => {
    const justCorrect = selectedOptionId === question.correct_option_id;
    setCorrectCount((count) => count + (justCorrect ? 1 : 0));

    if (sessionId && selectedOptionId) {
      logQuestionResponse({
        questionId: question.id,
        lessonId: lesson.id,
        track,
        conceptIds: question.concepts,
        isCorrect: justCorrect,
        selectedAnswer: selectedOptionId,
        responseTimeMs:
          questionStartedAtRef.current !== null ? elapsedMs(questionStartedAtRef.current) : null,
        sessionId,
      });
    }

    let updated = withLessonAnswer(progress, moduleId, track, lessonId, justCorrect);

    if (isLastQuestion) {
      updated = withLessonCompleted(updated, moduleId, track, lessonId);
      setProgress(updated);
      setPhase('finished');
      persistProgress(updated);
      return;
    }

    const nextIndex = currentIndex + 1;
    updated = withLessonQuestionSeen(updated, moduleId, track, lessonId, nextIndex);
    setProgress(updated);
    setCurrentIndex(nextIndex);
    setSelectedOptionId(null);
    persistProgress(updated);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: lesson.title }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SaveWarningBanner visible={saveWarningVisible} />
        <Text style={styles.progressLabel}>
          Vraag {currentIndex + 1} van {totalQuestions}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${((currentIndex + 1) / totalQuestions) * 100}%` }]}
          />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {module.name} · {TRACK_LABELS[track]} · Les {lesson.order}
          </Text>
        </View>

        <Text style={styles.question}>{question.question}</Text>
        {question.disclaimer ? (
          <Text style={styles.disclaimer}>⚠️ {question.disclaimer}</Text>
        ) : null}

        <View style={styles.options}>
          {shuffledOptions.map((option) => {
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
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3C4257',
    marginBottom: 28,
  },
  disclaimer: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#946200',
    marginBottom: 16,
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
