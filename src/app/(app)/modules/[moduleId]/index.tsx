import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { getModule, isTrackAvailable, TRACK_LABELS } from '../../../../lib/modules';
import type { ModuleTrack } from '../../../../lib/types';

const TRACKS: ModuleTrack[] = ['beginner', 'gevorderd', 'expert'];

export default function ModuleTracksScreen() {
  const router = useRouter();
  const { moduleId: rawModuleId } = useLocalSearchParams<{ moduleId: string }>();
  const moduleId = Array.isArray(rawModuleId) ? rawModuleId[0] : rawModuleId;
  const module = moduleId ? getModule(moduleId) : undefined;

  if (!moduleId || !module) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Module' }} />
        <Text style={styles.notFound}>Module niet gevonden.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: module.name }} />
      <Text style={styles.title}>{module.name}</Text>
      <Text style={styles.subtitle}>Kies een track om te starten.</Text>

      {TRACKS.map((track) => {
        const available = isTrackAvailable(moduleId, track);
        return (
          <Pressable
            key={track}
            disabled={!available}
            style={[styles.trackRow, !available && styles.trackRowDisabled]}
            onPress={() =>
              router.push({
                pathname: '/modules/[moduleId]/[track]',
                params: { moduleId, track },
              })
            }
          >
            <Text style={[styles.trackName, !available && styles.trackNameDisabled]}>
              {TRACK_LABELS[track]}
            </Text>
            <Text style={[styles.trackMeta, !available && styles.trackMetaDisabled]}>
              {available ? 'Start →' : 'Binnenkort beschikbaar'}
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
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 12,
  },
  trackRowDisabled: {
    opacity: 0.55,
  },
  trackName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
  },
  trackNameDisabled: {
    color: '#6B7190',
  },
  trackMeta: {
    fontSize: 13,
    color: '#3B4FD9',
    fontWeight: '600',
  },
  trackMetaDisabled: {
    color: '#6B7190',
  },
});
