import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';

import { modules } from '../lib/modules';

export default function ModulesOverviewScreen() {
  const router = useRouter();
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: 'Finance Bro' }} />
      <Text style={styles.title}>Finance Bro</Text>
      <Text style={styles.subtitle}>Kies een module om te starten.</Text>

      {sortedModules.map((module) => (
        <Pressable
          key={module.id}
          style={styles.moduleRow}
          onPress={() => router.push({ pathname: '/modules/[moduleId]', params: { moduleId: module.id } })}
        >
          <Text style={styles.moduleName}>{module.name}</Text>
          <Text style={styles.moduleMeta}>Bekijk tracks →</Text>
        </Pressable>
      ))}

      <Link href="/concepts" asChild>
        <Pressable style={styles.conceptsLink}>
          <Text style={styles.conceptsLinkText}>Los oefenen per concept →</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  moduleRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E6F0',
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 12,
  },
  moduleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F36',
  },
  moduleMeta: {
    fontSize: 13,
    color: '#3B4FD9',
    fontWeight: '600',
    marginTop: 4,
  },
  conceptsLink: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 10,
  },
  conceptsLinkText: {
    fontSize: 14,
    color: '#6B7190',
    fontWeight: '600',
  },
});
