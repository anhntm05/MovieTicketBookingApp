import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';

type DashboardSummary = {
  users?: { total?: number };
  bookings?: { total?: number };
  payments?: { totalRevenue?: number };
  movies?: number;
};

export const DashboardScreen = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const dashboard = unwrapApiData<DashboardSummary>(await apiClient.get('/admin/dashboard'));

      return {
        totalRevenue: dashboard.payments?.totalRevenue || 0,
        totalBookings: dashboard.bookings?.total || 0,
        totalUsers: dashboard.users?.total || 0,
        activeMovies: dashboard.movies || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>${stats?.totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Bookings</Text>
          <Text style={styles.statValue}>{stats?.totalBookings}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Users</Text>
          <Text style={styles.statValue}>{stats?.totalUsers}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Movies</Text>
          <Text style={styles.statValue}>{stats?.activeMovies}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.placeholderText}>No recent activity to display.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xl + 20,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.sm,
  },
  statCard: {
    width: '45%',
    backgroundColor: theme.colors.surface,
    margin: '2.5%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  section: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    marginTop: theme.spacing.md,
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
