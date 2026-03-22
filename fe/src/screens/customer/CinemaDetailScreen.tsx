import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeCinema, normalizeMovie, normalizeScreen, normalizeShowtime, unwrapApiData } from '../../api/transformers';
import { Cinema, Movie, Screen, Showtime } from '../../types/models';
import { CustomerStackParamList } from '../../types/navigation';
import { CustomerLayout } from '../../components/CustomerLayout';

type Props = NativeStackScreenProps<CustomerStackParamList, 'CinemaDetail'>;

const ACCENT = '#f90680';
const BACKGROUND = '#0f0a12';
const SURFACE = '#1a141e';
const SURFACE_BORDER = '#251d2a';
const MUTED = '#666';
const MUTED_LIGHT = '#aaa';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=1200',
];

const MAP_PREVIEW =
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200';
const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800';

const formatHallType = (screen: Screen) => {
  if (screen.projectionType) {
    return screen.projectionType.toUpperCase();
  }

  if (screen.audioSystem) {
    return screen.audioSystem.toUpperCase();
  }

  return 'STANDARD HALL';
};

const formatHallDesc = (screen: Screen) => {
  if (screen.audioSystem) {
    return screen.audioSystem.toUpperCase();
  }

  if (screen.totalSeats) {
    return `${screen.totalSeats} SEATS`;
  }

  return 'MOVIE EXPERIENCE';
};

const getHallIcon = (screen: Screen) => {
  const projection = screen.projectionType?.toLowerCase() || '';
  const audio = screen.audioSystem?.toLowerCase() || '';

  if (projection.includes('imax')) return 'layers-outline';
  if (audio.includes('atmos')) return 'surround-sound';
  if (audio.includes('vip')) return 'seat-recline-extra';
  return 'projector';
};

const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

export const CinemaDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cinemaId } = route.params;
  const { width } = useWindowDimensions();

  const { data: cinemaDetail, isLoading: isLoadingCinema, isRefetching, refetch } = useQuery<{
    cinema: Cinema;
    screens: Screen[];
  }>({
    queryKey: ['cinema-detail', cinemaId],
    queryFn: async () => {
      const data = unwrapApiData<{ cinema: unknown; screens: unknown[] }>(await apiClient.get(`/cinemas/${cinemaId}`));

      return {
        cinema: normalizeCinema(data.cinema),
        screens: (data.screens || []).map(normalizeScreen),
      };
    },
  });

  const { data: showtimes = [], isLoading: isLoadingShowtimes } = useQuery<Showtime[]>({
    queryKey: ['cinema-showtimes', cinemaId],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get(`/showtimes?cinema=${cinemaId}&status=scheduled&limit=100`));
      return data.map(normalizeShowtime);
    },
  });

  const currentMovies = useMemo(() => {
    const uniqueMovies = new Map<string, { movie: Movie; badge: string }>();

    showtimes.forEach((showtime) => {
      if (!showtime.movie) return;

      const badge =
        showtime.screen?.projectionType ||
        showtime.screen?.name ||
        showtime.movie.genre?.[0] ||
        'Now Showing';

      if (!uniqueMovies.has(showtime.movie.id)) {
        uniqueMovies.set(showtime.movie.id, {
          movie: showtime.movie,
          badge,
        });
      }
    });

    return Array.from(uniqueMovies.values());
  }, [showtimes]);

  const heroImage = HERO_IMAGES[Number(cinemaId.charCodeAt(cinemaId.length - 1) || 0) % HERO_IMAGES.length];
  const cinema = cinemaDetail?.cinema;
  const halls = cinemaDetail?.screens || [];
  const addressLine = [cinema?.address, cinema?.location].filter(Boolean).join('. ');
  const movieCardWidth = (width - 55) / 2;

  const handleShare = async () => {
    if (!cinema) {
      return;
    }

    await Share.share({
      message: `${cinema.name}\n${[cinema.location, cinema.address].filter(Boolean).join('\n')}`,
    });
  };

  if ((isLoadingCinema || isLoadingShowtimes) && !cinemaDetail) {
    return (
      <CustomerLayout activeTabOverride="Cinemas">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading cinema details...</Text>
        </View>
      </CustomerLayout>
    );
  }

  if (!cinema) {
    return (
      <CustomerLayout activeTabOverride="Cinemas">
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Cinema details are unavailable.</Text>
          <TouchableOpacity style={styles.retryButton} activeOpacity={0.85} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout activeTabOverride="Cinemas">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cinema Detail</Text>
        <TouchableOpacity style={styles.shareButton} activeOpacity={0.85} onPress={handleShare}>
          <MaterialCommunityIcons name="share-variant" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(15, 10, 18, 1)']} style={styles.heroGradient} />
          <View style={styles.heroInfo}>
            <Text style={styles.cinemaName}>{cinema.name}</Text>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={ACCENT} />
              <Text style={styles.locationText}>{cinema.location || 'Cinema location'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Find Us</Text>
          <Text style={styles.description}>
            {addressLine || 'Address information is currently unavailable for this cinema.'}
          </Text>
          <View style={styles.mapMock}>
            <Image source={{ uri: MAP_PREVIEW }} style={styles.mapImage} />
            <View style={styles.mapOverlay}>
              <View style={styles.mapMarker} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Halls</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hallScroll}>
            {halls.length > 0 ? (
              halls.map((hall) => (
                <View key={hall.id} style={styles.hallCard}>
                  <View style={styles.hallIconContainer}>
                    <MaterialCommunityIcons name={getHallIcon(hall) as any} size={24} color={ACCENT} />
                  </View>
                  <Text style={styles.hallName}>{hall.name}</Text>
                  <Text style={styles.hallDesc}>{formatHallType(hall)}</Text>
                  <Text style={styles.hallMeta}>{formatHallDesc(hall)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyHallCard}>
                <Text style={styles.emptyHallText}>No hall information available</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Currently Showing</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CinemaSchedule', { cinemaId: cinema.id })}
            >
              <Text style={styles.seeAllText}>VIEW FULL SCHEDULE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.movieGrid}>
            {currentMovies.length > 0 ? (
              currentMovies.map(({ movie, badge }) => (
                <TouchableOpacity
                  key={movie.id}
                  style={[styles.movieItem, { width: movieCardWidth }]}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
                >
                  <Image source={{ uri: movie.posterUrl || FALLBACK_POSTER }} style={styles.moviePoster} />
                  <View style={styles.movieBadge}>
                    <Text style={styles.movieBadgeText}>{badge.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.movieTitle} numberOfLines={1}>
                    {movie.title}
                  </Text>
                  <Text style={styles.movieMeta} numberOfLines={1}>
                    {(movie.genre?.[0] || 'Movie')} • {formatDuration(movie.duration)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyMovieState}>
                <Text style={styles.emptyMovieText}>No scheduled movies are available for this cinema yet.</Text>
              </View>
            )}
          </View>

          {isRefetching ? <ActivityIndicator style={styles.inlineLoader} color={ACCENT} /> : null}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </CustomerLayout>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
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
  heroContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  heroInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  cinemaName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    color: ACCENT,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: {
    color: MUTED_LIGHT,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  mapMock: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ACCENT,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hallScroll: {
    flexDirection: 'row',
  },
  hallCard: {
    backgroundColor: SURFACE,
    width: 150,
    borderRadius: 20,
    padding: 20,
    marginRight: 15,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  hallIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 6, 128, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  hallName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hallDesc: {
    color: ACCENT,
    fontSize: 10,
    marginTop: 6,
    fontWeight: 'bold',
  },
  hallMeta: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
    fontWeight: 'bold',
  },
  emptyHallCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  emptyHallText: {
    color: MUTED_LIGHT,
  },
  seeAllText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  movieItem: {
    marginBottom: 20,
  },
  moviePoster: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    opacity: 0.86,
    backgroundColor: SURFACE,
  },
  movieBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  movieBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  movieMeta: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  emptyMovieState: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    padding: 18,
  },
  emptyMovieText: {
    color: MUTED_LIGHT,
    lineHeight: 20,
  },
  inlineLoader: {
    marginTop: 6,
  },
  bottomSpacer: {
    height: 100,
  },
});
