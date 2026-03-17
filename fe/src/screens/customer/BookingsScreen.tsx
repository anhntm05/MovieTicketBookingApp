import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Booking } from '../../types/models';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';

export const BookingsScreen = () => {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, refetch, isRefetching } = useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/bookings/me');
      return data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiClient.put(`/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Could not cancel booking');
    },
  });

  const handleCancelClick = (bookingId: string) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, cancel it', style: 'destructive', onPress: () => cancelMutation.mutate(bookingId) },
    ]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'CONFIRMED': return theme.colors.success;
      case 'PENDING_PAYMENT': return theme.colors.warning;
      case 'CANCELLED': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingId}>ID: {item.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status.replace('_', ' ')}
        </Text>
      </View>

      {item.showtime?.movie && (
        <Text style={styles.movieTitle}>{item.showtime.movie.title}</Text>
      )}

      {item.showtime && (
        <>
          <Text style={styles.detailText}>
            Showtime: {formatDate(item.showtime.startTime)}
          </Text>
          <Text style={styles.detailText}>
            Total Amount: ${item.totalAmount.toFixed(2)}
          </Text>
        </>
      )}

      <Text style={styles.createdAt}>
        Booked on {formatDate(item.createdAt)}
      </Text>

      {/* Render Cancel button if confirmed or pending */}
      {(item.status === 'CONFIRMED' || item.status === 'PENDING_PAYMENT') && (
        <Button
          title="Cancel Booking"
          variant="danger"
          style={styles.cancelButton}
          onPress={() => handleCancelClick(item.id)}
          isLoading={cancelMutation.isPending && cancelMutation.variables === item.id}
        />
      )}
    </View>
  );

  if (isLoading && !isRefetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>You haven't booked any movies yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  bookingId: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
  status: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: 'bold',
  },
  movieTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    marginBottom: 4,
  },
  createdAt: {
    color: theme.colors.border,
    fontSize: theme.typography.sizes.xs,
    marginTop: theme.spacing.sm,
  },
  cancelButton: {
    marginTop: theme.spacing.md,
    height: 36,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
