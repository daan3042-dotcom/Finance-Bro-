import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { getConceptsByTier, getConceptStatus, getMissingPrerequisiteNames } from '../lib/concepts';
import { createEmptyProgress, getConceptProgress, loadProgress, type ProgressState } from '../lib/progress';
import type { Concept } from '../lib/types';

const STATUS_LABEL: Record<'completed' | 'unlocked' | 'locked', string> = {
  completed: 'Voltooid',
  unlocked: 'Vrijgespeeld',
  locked: 'Vergrendeld',
};

export default function OverviewScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressState>(createEmptyProgress());
  const [isLoading, setIsLoading] = useState(true);
  const tiers = getConceptsByTier();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadProgress().then((loaded) => {
        if (isActive) {
          setProgress(loaded);
          setIsLoading(false);
        }
      });
      return () => {
        isActive = false;
      };
    }, [])
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Voortgang laden…</Text>
      </View>
    );
  }

  const handlePress = (concept: Concept) => {
    router.push({ pathname: '/lesson/[conceptId]', params: { conceptId: concept.id } });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Finance Bro</Text>
      <Text style={styles.subtitle}>Kies een concept om een les te starten.</Text>

      {tiers.map(({ tier, concepts }) => (
        <View key={tier} style={styles.tierSection}>
          <Text style={styles.tierHeading}>Tier {tier}</Text>

          {concepts.map((concept) => {
            const status = getConceptStatus(concept, progress);
            const conceptProgress = getConceptProgress(progress, concept.id);
            const isLocked = status === 'locked';

            return (
              <Pressable
                key={concept.id}
                disabled={isLocked}
                onPress={() => handlePress(concept)}
                style={[
                  styles.conceptRow,
                  status === 'completed' && styles.conceptRowCompleted,
                  isLocked && styles.conceptRowLocked,
                ]}
              >
                <View style={styles.conceptRowText}>
                  <Text style={[styles.conceptName, isLocked && styles.conceptNameLocked]}>
                    {concept.name}
                  </Text>
                  {isLocked ? (
                    <Text style={styles.conceptMeta}>
                      Vereist: {getMissingPrerequisiteNames(concept, progress).join(', ')}
                    </Text>
                  ) : (
                    <Text style={styles.conceptMeta}>
                      {conceptProgress.correctCount} goed · {conceptProgress.incorrectCount} fout
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.statusBadge,
                    status === 'completed' && styles.statusBadgeCompleted,
                    isLocked && styles.statusBadgeLocked,
                  ]}
                >
                  {STATUS_LABEL[status]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1F36',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7190',
    marginTop: 4,
    marginBottom: 24,
  },
  tierSection: {
    marginBottom: 24,
  },
  tierHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B4FD9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 12,
  },
  conceptRowCompleted: {
    borderColor: '#34A853',
    backgroundColor: '#E6F6EC',
  },
  conceptRowLocked: {
    opacity: 0.55,
  },
  conceptRowText: {
    flex: 1,
  },
  conceptName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
  },
  conceptNameLocked: {
    color: '#6B7190',
  },
  conceptMeta: {
    fontSize: 12,
    color: '#6B7190',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B4FD9',
    backgroundColor: '#E4E9FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  statusBadgeCompleted: {
    color: '#1E7B3B',
    backgroundColor: '#D5F0DE',
  },
  statusBadgeLocked: {
    color: '#6B7190',
    backgroundColor: '#E2E6F0',
  },
});
