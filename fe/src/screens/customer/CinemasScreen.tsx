import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { normalizeCinema, unwrapApiData } from '../../api/transformers';
import { Cinema } from '../../types/models';
import { theme } from '../../constants/theme';

export const CinemasScreen = () => {
  const { data: cinemas, isLoading, isRefetching, refetch } = useQuery<Cinema[]>({
    queryKey: ['cinemas'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/cinemas?status=active'));
      return data.map(normalizeCinema);
    },
  });

  const renderCinema = ({ item }: { item: Cinema }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.location}>{item.location}</Text>
    </View>
  );

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <Text style={styles.headerTitle}>Our Cinemas</Text>
      <FlatList
        style={styles.list}
        data={cinemas}
        keyExtractor={(item) => item.id}
        renderItem={renderCinema}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No cinemas found.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  location: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
