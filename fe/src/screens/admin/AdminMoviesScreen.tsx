import React, { useDeferredValue, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeMovie, resolveMediaUrl, unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';
import { AdminMovieStackParamList } from '../../types/navigation';

const sortOptions = ['Recent', 'Revenue', 'A-Z'] as const;

type SortOption = (typeof sortOptions)[number];

type AdminMovieCatalogItem = {
  movieId: string;
  title: string;
  genre: string[];
  duration: number;
  revenue: number;
  bookings: number;
  showtimes: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  posterUrl: string;
  releaseDate?: string;
  createdAt?: string;
};

type AdminMovieCatalogResult = {
  movies: AdminMovieCatalogItem[];
  warning?: string;
};

type FinanceMoviePoint = {
  label: string;
  revenue: number;
  transactions: number;
};

const toRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' ? (value as Record<string, any>) : {};

const getId = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  const record = toRecord(value);
  return String(record.movieId || record._id || record.id || '');
};

const normalizeMovieCatalogItem = (raw: unknown): AdminMovieCatalogItem => {
  const movie = toRecord(raw);
  const rawStatus = String(movie.status || 'draft').toUpperCase();
  const status = (['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(rawStatus) ? rawStatus : 'DRAFT') as AdminMovieCatalogItem['status'];

  return {
    movieId: getId(movie),
    title: String(movie.title || ''),
    genre: Array.isArray(movie.genre) ? movie.genre.map(String) : [],
    duration: Number(movie.duration || 0),
    revenue: Number(movie.revenue || 0),
    bookings: Number(movie.bookings || 0),
    showtimes: Number(movie.showtimes || 0),
    status,
    posterUrl: resolveMediaUrl(String(movie.posterUrl || movie.poster || '')),
    releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString() : undefined,
    createdAt: movie.createdAt ? new Date(movie.createdAt).toISOString() : undefined,
  };
};

const normalizeFallbackMovie = (raw: unknown): AdminMovieCatalogItem => {
  const movie = normalizeMovie(raw);

  return {
    movieId: movie.id,
    title: movie.title,
    genre: movie.genre || [],
    duration: movie.duration,
    revenue: 0,
    bookings: 0,
    showtimes: 0,
    status: movie.status,
    posterUrl: movie.posterUrl,
    releaseDate: movie.releaseDate || undefined,
    createdAt: movie.releaseDate || undefined,
  };
};

const normalizeFinanceMoviePoint = (raw: unknown): FinanceMoviePoint => {
  const point = toRecord(raw);

  return {
    label: String(point.label || ''),
    revenue: Number(point.revenue || 0),
    transactions: Number(point.transactions || 0),
  };
};

const getErrorMessage = (error: any) => {
  if (Array.isArray(error?.response?.data?.errors) && error.response.data.errors.length) {
    return String(error.response.data.errors[0]);
  }

  if (error?.response?.data?.message) {
    return String(error.response.data.message);
  }

  if (error?.message) {
    return String(error.message);
  }

  return 'Unable to load movie catalog.';
};

const formatMoney = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const formatDuration = (value: number) => {
  if (!value) return 'Duration TBD';

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Release date TBD';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const AdminMoviesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AdminMovieStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState<SortOption>('Recent');
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());

  const sortParam = useMemo(() => {
    if (activeSort === 'Revenue') return 'revenue';
    if (activeSort === 'A-Z') return 'title';
    return 'recent';
  }, [activeSort]);

  const { data, error, isLoading, isRefetching, refetch } = useQuery<AdminMovieCatalogResult>({
    queryKey: ['admin-movie-catalog', deferredSearchQuery, sortParam],
    queryFn: async () => {
      try {
        const adminData = unwrapApiData<unknown[]>(
          await apiClient.get('/admin/movies', {
            params: {
              search: deferredSearchQuery || undefined,
              sort: sortParam,
              status: 'all',
            },
          })
        );

        return {
          movies: adminData.map(normalizeMovieCatalogItem),
        };
      } catch (adminError: any) {
        const [fallbackMoviesResponse, financeResponse, showtimesResponse] = await Promise.all([
          apiClient.get('/movies', {
            params: {
              status: 'all',
              title: deferredSearchQuery || undefined,
              limit: 100,
            },
          }),
          apiClient.get('/admin/finance', {
            params: {
              groupBy: 'movie',
            },
          }),
          apiClient.get('/showtimes', {
            params: {
              status: 'all',
              limit: 500,
            },
          }),
        ]);

        const fallbackData = unwrapApiData<unknown[]>(fallbackMoviesResponse);
        const financeByMovie = unwrapApiData<unknown[]>(financeResponse).map(normalizeFinanceMoviePoint);
        const showtimes = unwrapApiData<any[]>(showtimesResponse);

        const financeMap = new Map(
          financeByMovie.map((item) => [item.label.trim().toLowerCase(), item])
        );

        const showtimeCountMap = showtimes.reduce((map, showtimeRaw) => {
          const showtime = toRecord(showtimeRaw);
          const movieRecord = toRecord(showtime.movie);
          const movieId = getId(movieRecord || showtime.movie);
          if (!movieId) return map;
          map.set(movieId, (map.get(movieId) || 0) + 1);
          return map;
        }, new Map<string, number>());

        const movies = fallbackData.map((rawMovie) => {
          const movie = normalizeFallbackMovie(rawMovie);
          const finance = financeMap.get(movie.title.trim().toLowerCase());

          return {
            ...movie,
            revenue: finance?.revenue || 0,
            bookings: finance?.transactions || 0,
            showtimes: showtimeCountMap.get(movie.movieId) || 0,
          };
        });

        if (sortParam === 'title') {
          movies.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortParam === 'revenue') {
          movies.sort((a, b) => {
            if (b.revenue !== a.revenue) return b.revenue - a.revenue;
            return b.bookings - a.bookings;
          });
        } else if (sortParam === 'recent') {
          movies.sort((a, b) => {
            const aDate = new Date(a.createdAt || a.releaseDate || 0).getTime();
            const bDate = new Date(b.createdAt || b.releaseDate || 0).getTime();
            return bDate - aDate;
          });
        }

        return {
          movies,
          warning: `Admin catalog unavailable. Showing movie metrics from legacy admin APIs instead. ${getErrorMessage(adminError)}`,
        };
      }
    },
  });

  const movies = data?.movies || [];
  const warning = data?.warning;

  const publishedCount = movies.filter((movie) => movie.status === 'PUBLISHED').length;

  const renderListHeader = () => (
    <View>
      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillLabel}>TOTAL TITLES</Text>
          <Text style={styles.metaPillValue}>{movies.length}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaPillLabel}>LIVE NOW</Text>
          <Text style={styles.metaPillValue}>{publishedCount}</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Search titles..."
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.sortContainer}>
        {sortOptions.map((sort) => (
          <TouchableOpacity
            key={sort}
            onPress={() => setActiveSort(sort)}
            style={[styles.sortTab, activeSort === sort && styles.activeSortTab]}
            activeOpacity={0.85}
          >
            <Text style={[styles.sortText, activeSort === sort && styles.activeSortText]}>{sort}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMovieCard = ({ item }: { item: AdminMovieCatalogItem }) => (
    <TouchableOpacity
      style={styles.movieCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('AdminMovieDetail', { movieId: item.movieId })}
    >
      {item.posterUrl ? (
        <Image source={{ uri: item.posterUrl }} style={styles.moviePoster} />
      ) : (
        <View style={[styles.moviePoster, styles.moviePosterFallback]}>
          <MaterialCommunityIcons name="movie-open-outline" size={38} color={theme.colors.primary} />
        </View>
      )}

      <View style={styles.statusBadgeContainer}>
        <View
          style={[
            styles.statusBadge,
            item.status === 'PUBLISHED' ? styles.statusBadgePublished : styles.statusBadgeMuted,
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.movieInfo}>
        <View style={styles.movieHeaderRow}>
          <View style={styles.movieTitleBlock}>
            <Text style={styles.movieTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.movieMeta} numberOfLines={1}>
              {(item.genre.slice(0, 2).join(' � ') || 'General Release').toUpperCase()} • {formatDuration(item.duration)}
            </Text>
          </View>
          <View style={styles.metricBadge}>
            <Text style={styles.metricBadgeLabel}>SHOWTIMES</Text>
            <Text style={styles.metricBadgeValue}>{item.showtimes}</Text>
          </View>
        </View>

        <View style={styles.revenueRow}>
          <View>
            <Text style={styles.revLabel}>GROSS REVENUE</Text>
            <Text style={styles.revValue}>{formatMoney(item.revenue)}</Text>
          </View>
          <View style={styles.sideMetrics}>
            <Text style={styles.sideMetricLabel}>BOOKINGS</Text>
            <Text style={styles.sideMetricValue}>{item.bookings}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.releasePill}>
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color="#a8a0ad" />
            <Text style={styles.releaseText}>{formatDate(item.releaseDate || item.createdAt)}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#6e6474" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="movie-search-outline" size={40} color="#5f5566" />
      <Text style={styles.emptyTitle}>No movies match this search</Text>
      <Text style={styles.emptyText}>Try a different title or switch the sort view.</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.subtitle}>INVENTORY MANAGEMENT</Text>
          <Text style={styles.title}>Movie Catalog</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, styles.addButton]}
            onPress={() => navigation.navigate('AdminMovieDetail')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => refetch()} activeOpacity={0.85}>
            <MaterialCommunityIcons name="refresh" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
      data={movies}
      keyExtractor={(item) => item.movieId}
      renderItem={renderMovieCard}
      ListHeaderComponent={renderListHeader}
      ListFooterComponent={
        warning || error ? (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.colors.warning} />
            <Text style={styles.warningText}>{warning || getErrorMessage(error)}</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
          progressBackgroundColor={theme.colors.surface}
        />
      }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20, 
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    marginRight: 16,
  },
  subtitle: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 6,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  createHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15101a',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d1f2b',
  },
  createHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#f9068040',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  createHeroCopy: {
    flex: 1,
  },
  createHeroTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 4,
  },
  createHeroText: {
    color: '#9a90a0',
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.medium,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metaPill: {
    flex: 1,
    backgroundColor: '#161019',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#241c29',
  },
  metaPillLabel: {
    color: '#8c8192',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 1.1,
  },
  metaPillValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 6,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  sortContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sortTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  activeSortTab: {
    backgroundColor: theme.colors.surface,
  },
  sortText: {
    color: '#666',
    fontFamily: theme.typography.fontFamilies.bold,
  },
  activeSortText: {
    color: theme.colors.text,
  },
  movieCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  moviePoster: {
    width: '100%',
    height: 200,
    opacity: 0.62,
    backgroundColor: '#140f18',
  },
  moviePosterFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgePublished: {
    backgroundColor: theme.colors.primary,
  },
  statusBadgeMuted: {
    backgroundColor: '#312734',
  },
  statusText: {
    color: theme.colors.text,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  movieInfo: {
    padding: 20,
  },
  movieHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  movieTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  movieTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  movieMeta: {
    color: '#8b8391',
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.medium,
    marginTop: 4,
  },
  metricBadge: {
    backgroundColor: '#211925',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
    minWidth: 82,
  },
  metricBadgeLabel: {
    color: '#8c8192',
    fontSize: 9,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 0.8,
  },
  metricBadgeValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 2,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  revLabel: {
    color: theme.colors.success,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 0.9,
  },
  revValue: {
    color: theme.colors.success,
    fontSize: 28,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 4,
  },
  sideMetrics: {
    alignItems: 'flex-end',
  },
  sideMetricLabel: {
    color: '#8c8192',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 0.8,
  },
  sideMetricValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a212f',
  },
  releasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  releaseText: {
    color: '#a8a0ad',
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 12,
  },
  emptyText: {
    color: '#8c8192',
    fontSize: 13,
    fontFamily: theme.typography.fontFamilies.medium,
    textAlign: 'center',
    marginTop: 6,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#221a12',
    borderWidth: 1,
    borderColor: '#4a3920',
  },
  warningText: {
    flex: 1,
    color: '#d8b36b',
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.medium,
  },
});


