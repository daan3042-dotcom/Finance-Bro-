import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';

import { useAuth } from '../../lib/auth-context';
import { modules } from '../../lib/modules';

export default function ModulesOverviewScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: 'Finance Bro' }} />
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Finance Bro</Text>
          <Text style={styles.subtitle}>Kies een module om te starten.</Text>
        </View>
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Uitloggen</Text>
        </Pressable>
      </View>
      {session?.user.email && (
        <Text style={styles.sessionEmail}>Ingelogd als {session.user.email}</Text>
      )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
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
  },
  signOutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E2E6F0',
  },
  signOutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C4257',
  },
  sessionEmail: {
    fontSize: 12,
    color: '#6B7190',
    marginTop: 12,
    marginBottom: 12,
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
