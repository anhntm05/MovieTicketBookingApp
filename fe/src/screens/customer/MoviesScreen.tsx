import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { normalizeMovie, unwrapApiData } from '../../api/transformers';
import { Movie } from '../../types/models';
import { useAuthStore } from '../../store/authStore';

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

const formatGenreLabel = (genre: string) =>
  genre
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export const MoviesScreen = () => {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());

  const { data: genreSourceMovies = [] } = useQuery<Movie[]>({
    queryKey: ['movies', 'genres'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/movies?status=published&limit=100'));
      return data.map(normalizeMovie);
    },
  });

  const { data: movies = [], isLoading, isFetching, isError, refetch, isRefetching } = useQuery<Movie[]>({
    queryKey: ['movies', 'browse', activeGenre, deferredSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'published',
        limit: '100',
      });

      if (activeGenre !== 'All') {
        params.set('genre', activeGenre);
      }

      if (deferredSearchQuery) {
        params.set('title', deferredSearchQuery);
      }

      const data = unwrapApiData<unknown[]>(await apiClient.get(`/movies?${params.toString()}`));
      return data.map(normalizeMovie);
    },
    placeholderData: (previousData) => previousData,
  });

  const genreOptions = useMemo(() => {
    const uniqueGenres = new Map<string, { value: string; label: string }>();

    genreSourceMovies.forEach((movie) => {
      movie.genre?.forEach((genre) => {
        const normalizedGenre = genre.trim();
        const genreKey = normalizedGenre.toLowerCase();

        if (normalizedGenre && !uniqueGenres.has(genreKey)) {
          uniqueGenres.set(genreKey, {
            value: normalizedGenre,
            label: formatGenreLabel(normalizedGenre),
          });
        }
      });
    });

    return [
      { value: 'All', label: 'All' },
      ...Array.from(uniqueGenres.values()).sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [genreSourceMovies]);

  const cardWidth = (width - 60) / 2;

  if (isLoading && !movies.length) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={ACCENT} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="movie-filter" size={22} color={ACCENT} />
            </View>
            <View>
              <Text style={styles.brandLabel}>Movie Library</Text>
              <Text style={styles.headerTitle}>Browse Movies</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Profile')}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <MaterialCommunityIcons name="account-circle-outline" size={26} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={MUTED} style={styles.searchIcon} />
            <TextInput
              placeholder="Search for titles..."
              placeholderTextColor={MUTED}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isFetching ? <ActivityIndicator size="small" color={ACCENT} /> : null}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
          {genreOptions.map((genre) => {
            const isActive = activeGenre === genre.value;

            return (
              <TouchableOpacity
                key={genre.value}
                onPress={() => setActiveGenre(genre.value)}
                style={[styles.genreTab, isActive && styles.activeGenreTab]}
                activeOpacity={0.85}
              >
                <Text style={[styles.genreText, isActive && styles.activeGenreText]}>{genre.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.summaryRow}>
          <Text style={styles.pageTitle}>All Movies</Text>
          <Text style={styles.countText}>{movies.length} results</Text>
        </View>

        {isError ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Could not load movies</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryButton} activeOpacity={0.85}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : movies.length > 0 ? (
          <View style={styles.movieGrid}>
            {movies.map((movie) => (
              <TouchableOpacity
                key={movie.id}
                style={[styles.card, { width: cardWidth }]}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
              >
                <View style={styles.posterContainer}>
                  <Image source={{ uri: movie.posterUrl || FALLBACK_POSTER }} style={styles.poster} />
                  <View style={styles.ratingBadge}>
                    <MaterialCommunityIcons name="star" size={12} color={ACCENT} />
                    <Text style={styles.ratingText}>{(movie.rating ?? 0).toFixed(1)}</Text>
                  </View>
                </View>

                <Text style={styles.movieTitle} numberOfLines={1}>
                  {movie.title}
                </Text>
                <Text style={styles.movieMeta} numberOfLines={1}>
                  {(movie.genre?.slice(0, 2).join(' • ') || 'Movie')} • {formatDuration(movie.duration)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.messageCard}>
            <MaterialCommunityIcons name="movie-search-outline" size={34} color={ACCENT} />
            <Text style={styles.messageTitle}>No movies match this filter</Text>
            <Text style={styles.messageText}>Try another genre or adjust your search.</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: SURFACE,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandLabel: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchSection: {
    marginTop: 12,
    marginBottom: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingHorizontal: 16,
    minHeight: 58,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  genreScroll: {
    marginBottom: 22,
  },
  genreTab: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeGenreTab: {
    backgroundColor: 'rgba(249, 6, 128, 0.12)',
    borderColor: ACCENT,
  },
  genreText: {
    color: MUTED,
    fontWeight: '700',
    fontSize: 13,
  },
  activeGenreText: {
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 18,
  },
  pageTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  countText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    marginBottom: 24,
  },
  posterContainer: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: SURFACE,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  movieMeta: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  messageCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  messageTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  messageText: {
    color: MUTED_LIGHT,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 6, 128, 0.12)',
  },
  retryText: {
    color: ACCENT,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 100,
  },
});
