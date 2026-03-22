import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeCinema, normalizeShowtime, unwrapApiData } from '../../api/transformers';
import { Cinema, Showtime } from '../../types/models';
import { CustomerStackParamList } from '../../types/navigation';
import { CustomerLayout } from '../../components/CustomerLayout';

type Props = NativeStackScreenProps<CustomerStackParamList, 'CinemaSchedule'>;

const ACCENT = '#f90680';
const BACKGROUND = '#0f0a12';
const SURFACE = '#1a141e';
const SURFACE_BORDER = '#251d2a';
const MUTED = '#666';
const MUTED_LIGHT = '#aaa';
const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800';

const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

const formatDateKey = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const formatDateChip = (key: string) => {
  const date = new Date(`${key}T00:00:00`);

  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: date.getDate(),
  };
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const CinemaScheduleScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cinemaId } = route.params;
  const [selectedDateKey, setSelectedDateKey] = useState('');

  const { data: cinemaDetail, isLoading: isLoadingCinema, refetch: refetchCinema } = useQuery<{
    cinema: Cinema;
  }>({
    queryKey: ['cinema-schedule-detail', cinemaId],
    queryFn: async () => {
      const data = unwrapApiData<{ cinema: unknown }>(await apiClient.get(`/cinemas/${cinemaId}`));

      return {
        cinema: normalizeCinema(data.cinema),
      };
    },
  });

  const { data: showtimes = [], isLoading: isLoadingShowtimes, refetch: refetchShowtimes } = useQuery<Showtime[]>({
    queryKey: ['cinema-schedule-showtimes', cinemaId],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(
        await apiClient.get(`/showtimes?cinema=${cinemaId}&status=scheduled&limit=100`)
      );
      return data.map(normalizeShowtime);
    },
  });

  const availableDates = useMemo(() => {
    const uniqueKeys = Array.from(
      new Set(showtimes.map((showtime) => formatDateKey(showtime.startTime)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return uniqueKeys.map((key) => ({
      key,
      ...formatDateChip(key),
    }));
  }, [showtimes]);

  useEffect(() => {
    if (!selectedDateKey && availableDates.length > 0) {
      setSelectedDateKey(availableDates[0].key);
    }
  }, [availableDates, selectedDateKey]);

  const selectedDate = selectedDateKey || availableDates[0]?.key || '';

  const groupedSchedules = useMemo(() => {
    const grouped = new Map<
      string,
      {
        id: string;
        title: string;
        genre: string;
        poster: string;
        rating: number;
        slots: Array<{ id: string; label: string }>;
      }
    >();

    showtimes
      .filter((showtime) => formatDateKey(showtime.startTime) === selectedDate)
      .forEach((showtime) => {
        if (!showtime.movie) {
          return;
        }

        const genreLabel = `${showtime.movie.genre?.[0] || 'Movie'} • ${formatDuration(showtime.movie.duration)}`;

        if (!grouped.has(showtime.movie.id)) {
          grouped.set(showtime.movie.id, {
            id: showtime.movie.id,
            title: showtime.movie.title,
            genre: genreLabel,
            poster: showtime.movie.posterUrl || FALLBACK_POSTER,
            rating: Number(showtime.movie.rating || 0),
            slots: [],
          });
        }

        grouped.get(showtime.movie.id)?.slots.push({
          id: showtime.id,
          label: formatTime(showtime.startTime),
        });
      });

    return Array.from(grouped.values());
  }, [selectedDate, showtimes]);

  if ((isLoadingCinema || isLoadingShowtimes) && !cinemaDetail) {
    return (
      <CustomerLayout activeTabOverride="Cinemas">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </CustomerLayout>
    );
  }

  if (!cinemaDetail?.cinema) {
    return (
      <CustomerLayout activeTabOverride="Cinemas">
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Schedule is unavailable for this cinema.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.85}
            onPress={() => {
              refetchCinema();
              refetchShowtimes();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout activeTabOverride="Cinemas">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Full Schedule</Text>
            <Text style={styles.headerSubtitle}>{cinemaDetail.cinema.name}</Text>
          </View>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.85} onPress={() => refetchShowtimes()}>
            <MaterialCommunityIcons name="tune-variant" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.datePickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
              {availableDates.map((item) => {
                const active = selectedDate === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setSelectedDateKey(item.key)}
                    style={[styles.dateItem, active && styles.dateItemActive]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dateDay, active && styles.dateTextActive]}>{item.day}</Text>
                    <Text style={[styles.dateNumber, active && styles.dateTextActive]}>{item.date}</Text>
                    {active ? <View style={styles.activeDot} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.scheduleList}>
            <Text style={styles.sectionTitle}>Showing {selectedDate ? 'Today' : 'Soon'}</Text>

            {groupedSchedules.length > 0 ? (
              groupedSchedules.map((item) => (
                <View key={item.id} style={styles.movieCard}>
                  <View style={styles.movieInfo}>
                    <Image source={{ uri: item.poster }} style={styles.poster} />
                    <View style={styles.movieMeta}>
                      <Text style={styles.movieTitle}>{item.title}</Text>
                      <Text style={styles.movieGenre}>{item.genre}</Text>
                      <View style={styles.ratingRow}>
                        <MaterialCommunityIcons name="star" size={14} color={ACCENT} />
                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.showtimeContainer}>
                    <Text style={styles.showtimeLabel}>SHOWTIMES</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
                      {item.slots.map((slot) => (
                        <TouchableOpacity
                          key={slot.id}
                          style={styles.timeSlot}
                          activeOpacity={0.85}
                          onPress={() => navigation.navigate('SeatSelection', { showtimeId: slot.id })}
                        >
                          <Text style={styles.timeText}>{slot.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No showtimes are scheduled for the selected date.</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </CustomerLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
  },
  loadingText: {
    color: MUTED_LIGHT,
    marginTop: 12,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 6, 128, 0.12)',
  },
  retryText: {
    color: ACCENT,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  datePickerContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  dateScroll: {
    paddingHorizontal: 15,
  },
  dateItem: {
    width: 60,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  dateItemActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dateDay: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  dateNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dateTextActive: {
    color: '#fff',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginTop: 6,
  },
  scheduleList: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  movieCard: {
    backgroundColor: SURFACE,
    borderRadius: 25,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  movieInfo: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  poster: {
    width: 70,
    height: 100,
    borderRadius: 15,
  },
  movieMeta: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  movieGenre: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  showtimeContainer: {
    marginTop: 5,
  },
  showtimeLabel: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  timeScroll: {
    paddingRight: 20,
  },
  timeSlot: {
    backgroundColor: BACKGROUND,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotActive: {
    backgroundColor: 'rgba(249, 6, 128, 0.12)',
    borderColor: ACCENT,
  },
  timeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeTextActive: {
    color: ACCENT,
  },
  emptyState: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    padding: 18,
  },
  emptyText: {
    color: MUTED_LIGHT,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
});
