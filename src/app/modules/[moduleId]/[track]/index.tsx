import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { getModule, getLessonStatus, getTrackLessons, TRACK_LABELS, type LessonStatus } from '../../../../lib/modules';
import {
  createEmptyModuleProgress,
  loadModuleProgress,
  type ModuleProgressState,
} from '../../../../lib/moduleProgress';
import type { ModuleTrack } from '../../../../lib/types';

const STATUS_LABEL: Record<LessonStatus, string> = {
  completed: 'Voltooid',
  unlocked: 'Vrijgespeeld',
  locked: 'Vergrendeld',
};

function firstOf<T extends string>(value: T | T[] | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function TrackLessonsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ moduleId: string; track: string }>();
  const moduleId = firstOf(params.moduleId);
  const track = firstOf(params.track) as ModuleTrack | undefined;

  const [progress, setProgress] = useState<ModuleProgressState>(createEmptyModuleProgress());
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadModuleProgress().then((loaded) => {
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

  const module = moduleId ? getModule(moduleId) : undefined;
  const lessons = moduleId && track ? getTrackLessons(moduleId, track) : [];

  if (!moduleId || !track || !module || lessons.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Track' }} />
        <Text style={styles.notFound}>Deze track is nog niet beschikbaar.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: TRACK_LABELS[track] }} />
        <Text style={styles.notFound}>Voortgang laden…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: `${module.name} · ${TRACK_LABELS[track]}` }} />
      <Text style={styles.title}>{module.name}</Text>
      <Text style={styles.subtitle}>{TRACK_LABELS[track]}-track</Text>

      {lessons.map((lesson, index) => {
        const status = getLessonStatus(moduleId, track, index, progress);
        const isLocked = status === 'locked';

        return (
          <Pressable
            key={lesson.id}
            disabled={isLocked}
            style={[
              styles.lessonRow,
              status === 'completed' && styles.lessonRowCompleted,
              isLocked && styles.lessonRowLocked,
            ]}
            onPress={() =>
              router.push({
                pathname: '/modules/[moduleId]/[track]/[lessonId]',
                params: { moduleId, track, lessonId: lesson.id },
              })
            }
          >
            <View style={styles.lessonRowText}>
              <Text style={styles.lessonOrder}>Les {lesson.order}</Text>
              <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
                {lesson.title}
              </Text>
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
    </ScrollView>
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
  lessonRow: {
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
  lessonRowCompleted: {
    borderColor: '#34A853',
    backgroundColor: '#E6F6EC',
  },
  lessonRowLocked: {
    opacity: 0.55,
  },
  lessonRowText: {
    flex: 1,
  },
  lessonOrder: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B4FD9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
  },
  lessonTitleLocked: {
    color: '#6B7190',
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
