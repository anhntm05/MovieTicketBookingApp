import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeMovie, normalizeScreen, resolveMediaUrl, unwrapApiData } from '../../api/transformers';
import { Movie, Screen } from '../../types/models';
import { AdminCinemaStackParamList } from '../../types/navigation';

const { width } = Dimensions.get('window');

type CinemaDetailPayload = {
  cinema: {
    _id?: string;
    id?: string;
    name?: string;
    location?: string;
    address?: string;
  };
  screens: unknown[];
};

const toRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' ? (value as Record<string, any>) : {};

const getId = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  const record = toRecord(value);
  return String(record._id || record.id || '');
};

const getHallTech = (screen?: Screen) => {
  const projectionType = String(screen?.projectionType || '');
  const audioSystem = String(screen?.audioSystem || '');
  const normalizedProjection = projectionType.toUpperCase();
  const normalizedName = String(screen?.name || '').toUpperCase();

  if (normalizedProjection.includes('IMAX') || normalizedName.includes('IMAX')) {
    return {
      tech: projectionType || 'IMAX Laser',
      audio: audioSystem || 'Dolby Atmos',
      icon: 'layers-outline' as const,
      price: 150000,
    };
  }

  if (normalizedProjection.includes('DOLBY') || normalizedName.includes('PREMIUM') || normalizedName.includes('VIP')) {
    return {
      tech: projectionType || 'Dolby Vision',
      audio: audioSystem || 'Dolby Atmos',
      icon: 'projector' as const,
      price: 120000,
    };
  }

  return {
    tech: projectionType || 'Standard 4K',
    audio: audioSystem || '7.1 Surround',
    icon: 'monitor' as const,
    price: 90000,
  };
};

const formatMovieDuration = (minutes?: number) => {
  const duration = Number(minutes || 0);
  if (!duration) return 'TBD';
  const hours = Math.floor(duration / 60);
  const remainder = duration % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

const formatLongDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const buildDateOptions = () => {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(start);
    value.setDate(start.getDate() + index);
    return {
      key: value.toISOString().slice(0, 10),
      label: formatDateLabel(value),
      day: value.getDate(),
      weekday: value.toLocaleDateString('en-US', { weekday: 'narrow' }),
      value,
    };
  });
};

const addMinutes = (date: Date, minutes: number) => {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
};

const parseTime = (time: string) => {
  const [hours, minutes] = time.split(':').map((value) => Number(value));
  return { hours, minutes };
};

const createShowtimeDate = (dateKey: string, time: string) => {
  const base = new Date(`${dateKey}T00:00:00`);
  const { hours, minutes } = parseTime(time);
  base.setHours(hours, minutes, 0, 0);
  return base;
};

const defaultTimeSlots = ['14:00', '17:30', '20:00', '22:45'];

type Props = NativeStackScreenProps<AdminCinemaStackParamList, 'AdminShowtimeCreate'>;

export const AdminShowtimeCreateScreen: React.FC<Props> = ({ route, navigation }) => {
  const queryClient = useQueryClient();
  const { cinemaId } = route.params;
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [selectedDateKey, setSelectedDateKey] = useState(buildDateOptions()[2]?.key || buildDateOptions()[0].key);
  const [timeSlots, setTimeSlots] = useState(defaultTimeSlots);
  const [autoRelease, setAutoRelease] = useState(true);

  const dateOptions = useMemo(() => buildDateOptions(), []);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-showtime-create', cinemaId],
    queryFn: async () => {
      const [cinemaResponse, moviesResponse] = await Promise.all([
        apiClient.get(`/cinemas/${cinemaId}`),
        apiClient.get('/movies', {
          params: {
            status: 'published',
            limit: 100,
          },
        }),
      ]);

      const cinemaPayload = unwrapApiData<CinemaDetailPayload>(cinemaResponse);
      const cinema = toRecord(cinemaPayload.cinema);
      const screens = (cinemaPayload.screens || []).map(normalizeScreen).filter((screen) => screen.status !== 'MAINTENANCE');
      const movies = unwrapApiData<unknown[]>(moviesResponse).map(normalizeMovie);

      return {
        cinema: {
          id: getId(cinema),
          name: String(cinema.name || ''),
          location: String(cinema.location || ''),
        },
        screens,
        movies,
      };
    },
  });

  React.useEffect(() => {
    if (!selectedMovieId && data?.movies?.length) {
      setSelectedMovieId(data.movies[0].id);
    }
  }, [data?.movies, selectedMovieId]);

  React.useEffect(() => {
    if (!selectedScreenId && data?.screens?.length) {
      setSelectedScreenId(data.screens[0].id);
    }
  }, [data?.screens, selectedScreenId]);

  const selectedMovie = data?.movies.find((movie) => movie.id === selectedMovieId);
  const selectedScreen = data?.screens.find((screen) => screen.id === selectedScreenId);
  const selectedDate = dateOptions.find((date) => date.key === selectedDateKey)?.value || dateOptions[0].value;
  const selectedHallMeta = getHallTech(selectedScreen);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMovie || !selectedScreen) {
        throw new Error('Select a movie and hall before publishing showtimes.');
      }

      const price = selectedHallMeta.price;
      const durationMinutes = Number(selectedMovie.duration || 120);

      const results = await Promise.allSettled(
        timeSlots.map(async (time) => {
          const startTime = createShowtimeDate(selectedDateKey, time);
          const endTime = addMinutes(startTime, durationMinutes);

          return apiClient.post('/showtimes', {
            movie: selectedMovie.id,
            screen: selectedScreen.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            price,
            status: 'scheduled',
          });
        })
      );

      const failed = results.filter((result) => result.status === 'rejected') as PromiseRejectedResult[];
      const succeeded = results.filter((result) => result.status === 'fulfilled').length;

      if (failed.length) {
        const firstError: any = failed[0].reason;
        const message =
          firstError?.response?.data?.message ||
          firstError?.message ||
          'One or more showtimes could not be created.';

        throw new Error(
          succeeded
            ? `${succeeded} showtime(s) created, but ${failed.length} failed. ${message}`
            : message
        );
      }

      return succeeded;
    },
    onSuccess: async (createdCount) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-cinema-detail', cinemaId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-showtime-create', cinemaId] }),
      ]);

      Alert.alert(
        'Showtimes Added',
        `${createdCount} showtime${createdCount === 1 ? '' : 's'} scheduled for ${selectedMovie?.title}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Unable to add showtimes', error.message || 'Please try again.');
    },
  });

  const handleAddSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1] || '10:00';
    const base = createShowtimeDate(selectedDateKey, lastSlot);
    const increment = (selectedMovie?.duration || 120) + 30;
    const next = addMinutes(base, increment);
    const nextLabel = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;

    if (timeSlots.includes(nextLabel)) {
      Alert.alert('Slot already added', 'That time slot is already in the list.');
      return;
    }

    setTimeSlots((current) => [...current, nextLabel]);
  };

  const handleRemoveSlot = (time: string) => {
    if (timeSlots.length === 1) {
      Alert.alert('At least one slot required', 'Keep one time slot selected before publishing.');
      return;
    }

    setTimeSlots((current) => current.filter((item) => item !== time));
  };

  if (isLoading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f90680" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#f90680"
          colors={['#f90680']}
          progressBackgroundColor="#1a141e"
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>CINEMA OPS</Text>
          <Text style={styles.headerTitle}>Add Showtimes</Text>
        </View>
        <View style={styles.profileCircle}>
          <View style={styles.statusDot} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Select Movie</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => refetch()}>
          <Text style={styles.actionText}>LIVE INVENTORY</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.movieList}>
        {data.movies.map((movie) => (
          <TouchableOpacity
            key={movie.id}
            onPress={() => setSelectedMovieId(movie.id)}
            style={[styles.movieCard, selectedMovieId === movie.id && styles.activeMovieCard]}
            activeOpacity={0.88}
          >
            <Image source={{ uri: movie.posterUrl || resolveMediaUrl(movie.posterUrl) }} style={styles.moviePoster} />
            {selectedMovieId === movie.id ? (
              <View style={styles.checkBadge}>
                <MaterialCommunityIcons name="check" size={12} color="#fff" />
              </View>
            ) : null}
            <View style={styles.movieOverlay}>
              <Text style={styles.movieName}>{movie.title.toUpperCase()}</Text>
              <Text style={styles.movieMeta}>
                {formatMovieDuration(movie.duration)} • {(movie.genre?.[0] || 'General').toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Select Hall</Text>
      <View style={styles.hallList}>
        {data.screens.map((screen) => {
          const hallMeta = getHallTech(screen);
          return (
            <TouchableOpacity
              key={screen.id}
              onPress={() => setSelectedScreenId(screen.id)}
              style={[styles.hallCard, selectedScreenId === screen.id && styles.activeHallCard]}
              activeOpacity={0.88}
            >
              <View style={[styles.hallIcon, { backgroundColor: selectedScreenId === screen.id ? '#f9068020' : '#1a141e' }]}>
                <MaterialCommunityIcons
                  name={hallMeta.icon}
                  size={24}
                  color={selectedScreenId === screen.id ? '#f90680' : '#666'}
                />
              </View>
              <View style={styles.hallInfo}>
                <Text style={styles.hallName}>{screen.name.toUpperCase()}</Text>
                <Text style={styles.hallMeta}>
                  {`${screen.totalSeats || 0} SEATS`} • {hallMeta.tech.toUpperCase()} • {hallMeta.audio.toUpperCase()}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={selectedScreenId === screen.id ? 'radiobox-marked' : 'radiobox-blank'}
                size={24}
                color={selectedScreenId === screen.id ? '#03DAC6' : '#333'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Select Date</Text>
      <View style={styles.datePickerCard}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthName}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
          </Text>
          <View style={styles.monthNav}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#666" />
          </View>
        </View>
        <View style={styles.calendarRow}>
          {dateOptions.map((item) => (
            <Text key={`${item.key}-label`} style={styles.dayLabel}>
              {item.weekday}
            </Text>
          ))}
        </View>
        <View style={styles.calendarRow}>
          {dateOptions.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setSelectedDateKey(item.key)}
              style={[styles.dayCell, selectedDateKey === item.key && styles.activeDayCell]}
              activeOpacity={0.88}
            >
              <Text style={[styles.dayText, selectedDateKey === item.key && styles.activeDayText]}>{item.day}</Text>
              {selectedDateKey === item.key ? <View style={styles.activeDayDot} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Time Slots</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={handleAddSlot}>
          <Text style={styles.actionText}>+ ADD CUSTOM</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.timeGrid}>
        {timeSlots.map((time, index) => (
          <View key={time} style={styles.timeCard}>
            <TouchableOpacity
              style={styles.removeTimeButton}
              activeOpacity={0.85}
              onPress={() => handleRemoveSlot(time)}
            >
              <MaterialCommunityIcons name="close" size={16} color="#aaa" />
            </TouchableOpacity>
            <Text style={styles.timeValue}>{time}</Text>
            <Text style={styles.timeLabel}>{index === 0 ? 'MATINEE' : index === 1 ? 'PEAK TIME' : 'NIGHT'}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.addTimeCard} activeOpacity={0.88} onPress={handleAddSlot}>
          <MaterialCommunityIcons name="timer-outline" size={24} color="#f90680" />
          <Text style={styles.addTimeText}>QUICK ADD</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsCard}>
        <View style={styles.settingsInfo}>
          <View style={styles.settingsIcon}>
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="#f90680" />
          </View>
          <View style={styles.settingsText}>
            <Text style={styles.settingTitle}>Auto-Release Seats</Text>
            <Text style={styles.settingDesc}>Unlock bookings 15 mins before screening.</Text>
          </View>
        </View>
        <Switch
          value={autoRelease}
          onValueChange={setAutoRelease}
          trackColor={{ false: '#333', true: '#f9068050' }}
          thumbColor={autoRelease ? '#f90680' : '#666'}
        />
      </View>

      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information" size={20} color="#f90680" />
        <Text style={styles.infoBannerText}>
          You are publishing <Text style={styles.infoHighlight}>{timeSlots.length} showtimes</Text> for{' '}
          <Text style={styles.infoHighlight}>{selectedMovie?.title.toUpperCase() || 'A MOVIE'}</Text> in{' '}
          <Text style={styles.infoHighlight}>{selectedScreen?.name.toUpperCase() || 'A HALL'}</Text> on{' '}
          {formatLongDate(selectedDate)}.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.publishButton, createMutation.isPending && styles.publishButtonDisabled]}
        activeOpacity={0.88}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !selectedMovie || !selectedScreen || !timeSlots.length}
      >
        <LinearGradient colors={['#f90680', '#c20464']} style={styles.publishGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={styles.btnContent}>
            <View style={styles.btnIcon}>
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
              )}
            </View>
            <Text style={styles.btnText}>{createMutation.isPending ? 'ADDING SHOWTIMES...' : 'ADD SHOWTIMES'}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0a12' },
  loadingContainer: { flex: 1, backgroundColor: '#0f0a12', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20 },
  backButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#1a141e', justifyContent: 'center', alignItems: 'center' },
  headerLabel: { color: '#f90680', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  profileCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD700', borderWidth: 2, borderColor: '#1a141e' },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#03DAC6', borderWidth: 2, borderColor: '#0f0a12' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  actionText: { color: '#03DAC6', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  movieList: { marginBottom: 20 },
  movieCard: { width: 160, height: 240, borderRadius: 20, overflow: 'hidden', marginRight: 15, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#1a141e' },
  activeMovieCard: { borderColor: '#f90680' },
  moviePoster: { width: '100%', height: '100%', opacity: 0.6, backgroundColor: '#130e16' },
  checkBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#f90680', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  movieOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: 'rgba(0,0,0,0.4)' },
  movieName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  movieMeta: { color: '#f90680', fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  hallList: { marginBottom: 25 },
  hallCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a141e', borderRadius: 20, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#251d2a' },
  activeHallCard: { borderColor: '#f9068050', backgroundColor: '#f9068005' },
  hallIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  hallInfo: { flex: 1 },
  hallName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hallMeta: { color: '#666', fontSize: 12, marginTop: 2 },
  datePickerCard: { backgroundColor: '#1a141e', borderRadius: 25, padding: 20, marginBottom: 25 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthName: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  monthNav: { flexDirection: 'row', gap: 15 },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayLabel: { color: '#666', fontSize: 12, width: 35, textAlign: 'center' },
  dayCell: { width: 35, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  activeDayCell: { backgroundColor: '#f90680', shadowColor: '#f90680', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  dayText: { color: '#fff', fontSize: 14 },
  activeDayText: { fontWeight: 'bold' },
  activeDayDot: { position: 'absolute', bottom: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  timeCard: {
    width: (width - 64) / 2,
    backgroundColor: '#1a141e',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#251d2a',
    position: 'relative',
  },
  removeTimeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#120d15',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timeValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  timeLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  addTimeCard: { width: (width - 64) / 2, borderStyle: 'dashed', borderWidth: 2, borderColor: '#251d2a', borderRadius: 15, justifyContent: 'center', alignItems: 'center', minHeight: 82 },
  addTimeText: { color: '#f90680', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  settingsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a141e', borderRadius: 20, padding: 20, marginBottom: 20 },
  settingsInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingsIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f9068010', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingsText: { flex: 1 },
  settingTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  settingDesc: { color: '#666', fontSize: 11, marginTop: 2 },
  infoBanner: { flexDirection: 'row', backgroundColor: '#f9068010', padding: 15, borderRadius: 15, borderLeftWidth: 4, borderLeftColor: '#f90680', marginBottom: 30 },
  infoBannerText: { color: '#aaa', fontSize: 12, flex: 1, marginLeft: 12, lineHeight: 18 },
  infoHighlight: { fontWeight: 'bold', color: '#fff' },
  publishButton: { height: 60, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#f90680', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, marginBottom: 12 },
  publishButtonDisabled: { opacity: 0.7 },
  publishGradient: { flex: 1, justifyContent: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});

export default AdminShowtimeCreateScreen;
