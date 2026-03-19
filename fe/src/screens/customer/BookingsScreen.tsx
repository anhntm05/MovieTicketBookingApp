import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { normalizeBooking, unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';
import { Booking } from '../../types/models';

const categories = ['All', 'Upcoming', 'Past'] as const;
type BookingCategory = (typeof categories)[number];

const isCancellable = (status: Booking['status']) =>
  status === 'CONFIRMED' || status === 'PENDING_PAYMENT';

const isUpcomingBooking = (booking: Booking) => {
  if (!booking.showtime?.startTime) {
    return false;
  }

  const showtimeMs = new Date(booking.showtime.startTime).getTime();
  if (Number.isNaN(showtimeMs)) {
    return false;
  }

  return showtimeMs >= Date.now() && booking.status !== 'CANCELLED' && booking.status !== 'EXPIRED';
};

const formatBookingTime = (dateStr?: string) => {
  if (!dateStr) {
    return 'Schedule unavailable';
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return 'Schedule unavailable';
  }

  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatStatusLabel = (status: Booking['status']) => status.replace(/_/g, ' ');

const getStatusColor = (status: Booking['status']) => {
  switch (status) {
    case 'CONFIRMED':
      return '#03DAC6';
    case 'PENDING_PAYMENT':
      return '#F2C94C';
    case 'CANCELLED':
    case 'EXPIRED':
      return '#8c8192';
    default:
      return '#FFFFFF';
  }
};

const getBookingNote = (status: Booking['status']) => {
  switch (status) {
    case 'CANCELLED':
      return 'Booking cancelled';
    case 'EXPIRED':
      return 'Payment expired';
    default:
      return undefined;
  }
};

export const BookingsScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = React.useState<BookingCategory>('All');

  const { data: bookings, isLoading, refetch, isRefetching } = useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/bookings/me'));
      return data.map(normalizeBooking);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => apiClient.put(`/bookings/${bookingId}/cancel`),
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

  const filteredBookings = (bookings ?? []).filter((booking) => {
    if (activeCategory === 'All') {
      return true;
    }

    if (activeCategory === 'Upcoming') {
      return isUpcomingBooking(booking);
    }

    return !isUpcomingBooking(booking);
  });

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        {/* <TouchableOpacity
          style={styles.headerAction}
          activeOpacity={0.8}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }

            navigation.navigate('Home');
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Booking History</Text>
        {/* <View style={styles.headerSpacer} /> */}
      </View>

      <View style={styles.tabContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setActiveCategory(category)}
            style={styles.tab}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.tabText,
                activeCategory === category && styles.activeTabText,
              ]}
            >
              {category}
            </Text>
            {activeCategory === category ? <View style={styles.activeIndicator} /> : null}
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderBooking = ({ item }: { item: Booking }) => {
    const currentStatusColor = getStatusColor(item.status);
    const bookingCode = item.bookingCode || item.id.slice(0, 8).toUpperCase();
    const movie = item.showtime?.movie;
    const cinemaName = item.showtime?.screen?.cinema?.name || 'Cinema unavailable';
    const destination =
      item.showtime?.screen?.cinema?.address ||
      item.showtime?.screen?.cinema?.location ||
      'Destination unavailable';
    const note = getBookingNote(item.status);
    const isCancelling = cancelMutation.isPending && cancelMutation.variables === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('TicketDetail', { bookingId: item.id })}
      >
        {movie?.posterUrl ? (
          <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <MaterialCommunityIcons name="movie-open-outline" size={28} color="#8c8192" />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeading}>
              <Text style={styles.movieTitle} numberOfLines={2}>
                {movie?.title || 'Untitled Movie'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: `${currentStatusColor}20` }]}>
                <Text style={[styles.statusText, { color: currentStatusColor }]}>
                  {formatStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            {isCancellable(item.status) ? (
              <TouchableOpacity
                style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
                onPress={() => handleCancelClick(item.id)}
                activeOpacity={0.85}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#f90680" />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                )}
              </TouchableOpacity>
            ) : note ? (
              <Text style={styles.noteText}>{note}</Text>
            ) : null}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID: </Text>
            <Text style={styles.infoValue}>#{bookingCode}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-blank" size={14} color="#f90680" />
            <Text style={styles.infoValue}> {formatBookingTime(item.showtime?.startTime)}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="movie-open-outline" size={14} color="#f90680" />
            <Text style={styles.infoValue}> {cinemaName}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#f90680" />
            <Text style={styles.infoValue} numberOfLines={2}>
              {' '}
              {destination}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cash-multiple" size={14} color="#f90680" />
            <Text style={styles.infoValue}> ${item.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      <FlatList
        style={styles.list}
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={42}
              color="#f90680"
            />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              There are no bookings in the {activeCategory.toLowerCase()} category yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f0a12',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0a12',
  },
  list: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerAction: {
    width: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    ...theme.typography.pageTitle,
    color: '#fff',
    fontFamily: theme.typography.fontFamilies.bold,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a141e',
  },
  tab: {
    marginRight: 30,
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabText: {
    color: '#f90680',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#f90680',
    borderRadius: 3,
  },
  card: {
    backgroundColor: '#1a141e',
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  poster: {
    width: 90,
    height: 120,
    borderRadius: 15,
    backgroundColor: '#333',
  },
  posterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  cardHeading: {
    flex: 1,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cancelButton: {
    minWidth: 74,
    backgroundColor: '#f9068015',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f9068040',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#f90680',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noteText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    maxWidth: 90,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoLabel: {
    color: '#666',
    fontSize: 12,
  },
  infoValue: {
    color: '#aaa',
    fontSize: 12,
    flexShrink: 1,
  },
  emptyState: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#1a141e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#251d2a',
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    color: '#8c8192',
    textAlign: 'center',
    lineHeight: 20,
  },
});
