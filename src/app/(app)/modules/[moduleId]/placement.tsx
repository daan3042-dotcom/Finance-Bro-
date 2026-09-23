import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';

import { getModule, getTrackLessons, isTrackAvailable, TRACK_LABELS } from '../../../../lib/modules';
import { elapsedMs, logQuestionResponse, nowMs } from '../../../../lib/questionResponses';
import {
  applyPlacement,
  computePlacement,
  pickDiagnosticQuestions,
  SELF_REPORT_OPTIONS,
  type DiagnosticAnswer,
  type DiagnosticQuestionRef,
  type PlacementResult,
  type SelfReportLevel,
} from '../../../../lib/placement';
import type { ModuleTrack } from '../../../../lib/types';

function firstOf<T extends string>(value: T | T[] | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type Phase = 'self-report' | 'diagnostic' | 'result' | 'done';

const ALL_TRACKS: ModuleTrack[] = ['beginner', 'gevorderd', 'expert'];

const TRACK_UITLEG: Record<ModuleTrack, string> = {
  beginner: 'Je begint bij de basis, stap voor stap opgebouwd.',
  gevorderd: 'Je kent de basis al en bouwt meteen verder.',
  expert: 'Je beheerst de basis- en gevorderde stof en start bij de diepste laag.',
};

export default function PlacementScreen() {
  const router = useRouter();
  const { moduleId: rawModuleId } = useLocalSearchParams<{ moduleId: string }>();
  const moduleId = firstOf(rawModuleId);
  const module = moduleId ? getModule(moduleId) : undefined;

  const [phase, setPhase] = useState<Phase>('self-report');
  const [questions, setQuestions] = useState<DiagnosticQuestionRef[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<DiagnosticAnswer[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [chosenTrack, setChosenTrack] = useState<ModuleTrack | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const questionStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase === 'diagnostic') {
      questionStartedAtRef.current = nowMs();
    }
  }, [phase, currentIndex]);

  if (!moduleId || !module) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Diagnosetoets' }} />
        <Text style={styles.notFound}>Module niet gevonden.</Text>
      </View>
    );
  }

  const handleSelfReport = (level: SelfReportLevel) => {
    const picked = pickDiagnosticQuestions(moduleId, level);
    setQuestions(picked);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setAnswers([]);
    setSessionId(Crypto.randomUUID());
    setPhase('diagnostic');
  };

  if (phase === 'self-report') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Stack.Screen options={{ title: `${module.name} · Diagnosetoets` }} />
        <Text style={styles.title}>Hoeveel weet je al van {module.name.toLowerCase()}?</Text>
        <Text style={styles.subtitle}>
          Dit bepaalt alleen waar de korte diagnosetoets start — je definitieve startpunt kies je
          zelf, na de toets.
        </Text>

        {SELF_REPORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={styles.optionCard}
            onPress={() => handleSelfReport(option.value)}
          >
            <Text style={styles.optionCardLabel}>{option.label}</Text>
            <Text style={styles.optionCardDescription}>{option.description}</Text>
          </Pressable>
        ))}

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Liever gewoon bij beginner starten</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'diagnostic') {
    if (questions.length === 0) {
      return (
        <View style={styles.container}>
          <Stack.Screen options={{ title: 'Diagnosetoets' }} />
          <Text style={styles.notFound}>Kon geen diagnosevragen samenstellen.</Text>
        </View>
      );
    }

    const current = questions[currentIndex];
    const totalQuestions = questions.length;
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const hasAnswered = selectedOptionId !== null;
    const isCorrect = selectedOptionId === current.question.correct_option_id;

    const handleNext = () => {
      if (!selectedOptionId || !sessionId) return;
      const justCorrect = selectedOptionId === current.question.correct_option_id;

      logQuestionResponse({
        questionId: current.question.id,
        lessonId: current.lessonId,
        track: current.track,
        conceptIds: current.question.concepts,
        isCorrect: justCorrect,
        selectedAnswer: selectedOptionId,
        responseTimeMs:
          questionStartedAtRef.current !== null ? elapsedMs(questionStartedAtRef.current) : null,
        sessionId,
      });

      const nextAnswers = [
        ...answers,
        { question: current, selectedOptionId, isCorrect: justCorrect },
      ];
      setAnswers(nextAnswers);

      if (isLastQuestion) {
        const placement = computePlacement(moduleId, nextAnswers);
        setResult(placement);
        setChosenTrack(placement.recommendedTrack);
        setPhase('result');
        return;
      }

      setCurrentIndex((index) => index + 1);
      setSelectedOptionId(null);
    };

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Diagnosetoets' }} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.progressLabel}>
            Vraag {currentIndex + 1} van {totalQuestions}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / totalQuestions) * 100}%` },
              ]}
            />
          </View>

          <Text style={styles.question}>{current.question.question}</Text>

          <View style={styles.options}>
            {current.question.options.map((option) => {
              const isSelected = option.id === selectedOptionId;
              const isCorrectOption = option.id === current.question.correct_option_id;

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
                <Text style={styles.feedbackExplanation}>{current.question.explanation}</Text>
              </View>

              <Pressable style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {isLastQuestion ? 'Bekijk je plaatsing' : 'Volgende vraag'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  if (phase === 'result' && result && chosenTrack) {
    const handleConfirm = async () => {
      const lessons = getTrackLessons(moduleId, chosenTrack);
      const chosenLessonId =
        chosenTrack === result.recommendedTrack ? result.recommendedLessonId : lessons[0]?.id;
      if (!chosenLessonId) return;

      setIsSaving(true);
      setSaveError(null);
      try {
        await applyPlacement(moduleId, chosenTrack, chosenLessonId, result);
        setPhase('done');
      } catch {
        setSaveError('Opslaan van je plaatsing is niet gelukt. Controleer je verbinding en probeer opnieuw.');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Stack.Screen options={{ title: 'Jouw plaatsing' }} />
        <Text style={styles.title}>We raden {TRACK_LABELS[result.recommendedTrack]} aan</Text>
        <Text style={styles.subtitle}>
          Op basis van je antwoorden per onderwerp beheers je de stof tot en met dit punt. Je kunt
          dit altijd zelf aanpassen.
        </Text>

        {ALL_TRACKS.filter((track) => isTrackAvailable(moduleId, track)).map((track) => {
          const isRecommended = track === result.recommendedTrack;
          const isSelected = track === chosenTrack;
          return (
            <Pressable
              key={track}
              style={[styles.trackOption, isSelected && styles.trackOptionSelected]}
              onPress={() => setChosenTrack(track)}
            >
              <View style={styles.trackOptionHeader}>
                <Text style={styles.trackOptionLabel}>{TRACK_LABELS[track]}</Text>
                {isRecommended ? (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>Aanbevolen</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.trackOptionDescription}>{TRACK_UITLEG[track]}</Text>
            </Pressable>
          );
        })}

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        <Pressable style={styles.nextButton} onPress={handleConfirm} disabled={isSaving}>
          <Text style={styles.nextButtonText}>
            {isSaving ? 'Bezig met opslaan…' : 'Bevestigen en starten'}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Klaar!' }} />
      <View style={styles.completeContent}>
        <Text style={styles.completeEmoji}>🎯</Text>
        <Text style={styles.completeTitle}>Je bent geplaatst!</Text>
        <Text style={styles.completeSubtitle}>
          Je begint bij {chosenTrack ? TRACK_LABELS[chosenTrack] : ''}. Veel succes!
        </Text>
        <Pressable
          style={styles.restartButton}
          onPress={() =>
            router.replace({ pathname: '/modules/[moduleId]', params: { moduleId } })
          }
        >
          <Text style={styles.restartButtonText}>Naar de lessen</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  notFound: {
    fontSize: 15,
    color: '#6B7190',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F4F6FB',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1F36',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7190',
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  optionCardLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 4,
  },
  optionCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7190',
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#3B4FD9',
    fontSize: 15,
    fontWeight: '600',
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
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1F36',
    lineHeight: 30,
    marginBottom: 20,
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
  trackOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  trackOptionSelected: {
    borderColor: '#3B4FD9',
    backgroundColor: '#E4E9FF',
  },
  trackOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trackOptionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1F36',
  },
  trackOptionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7190',
  },
  recommendedBadge: {
    backgroundColor: '#3B4FD9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recommendedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#B92B2B',
    fontSize: 14,
    marginBottom: 12,
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
});
