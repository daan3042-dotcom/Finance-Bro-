import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import questionsData from './data/example_questions.json';

const tier1Questions = questionsData.anchor_questions.filter((q) => q.tier === 1);

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const question = tier1Questions[currentIndex];
  const isLastQuestion = currentIndex === tier1Questions.length - 1;
  const hasAnswered = selectedOptionId !== null;
  const isCorrect = selectedOptionId === question.correct_option_id;

  const handleNext = () => {
    if (isLastQuestion) {
      setIsFinished(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setSelectedOptionId(null);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.completeContent}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>Les voltooid!</Text>
          <Text style={styles.completeSubtitle}>
            Je hebt alle {tier1Questions.length} tier 1-vragen doorlopen.
          </Text>
          <Pressable style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartButtonText}>Begin opnieuw</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.progressLabel}>
          Vraag {currentIndex + 1} van {tier1Questions.length}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / tier1Questions.length) * 100}%` },
            ]}
          />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{question.concept} · Tier {question.tier}</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
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
});
