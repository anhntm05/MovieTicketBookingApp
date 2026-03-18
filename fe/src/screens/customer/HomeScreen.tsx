import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { normalizeCinema, normalizeMovie, unwrapApiData } from '../../api/transformers';
import { Cinema, Movie } from '../../types/models';
import { useAuthStore } from '../../store/authStore';

const categories = ['Now Playing', 'Coming Soon', 'Top Movies', 'Favorites'] as const;
type HomeCategory = typeof categories[number];

const ACCENT = '#f90680';
const BACKGROUND = '#0f0a12';
const SURFACE = '#1a141e';
const MUTED = '#666';
const MUTED_LIGHT = '#aaa';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<HomeCategory>('Now Playing');

  const { data: movies = [], isLoading, isError, refetch, isRefetching } = useQuery<Movie[]>({
    queryKey: ['movies'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/movies?status=published'));
      return data.map(normalizeMovie);
    },
  });

  const { data: cinemas = [] } = useQuery<Cinema[]>({
    queryKey: ['home-cinemas'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/cinemas?status=active'));
      return data.map(normalizeCinema);
    },
  });

  const now = Date.now();
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const searchedMovies = useMemo(() => {
    if (!normalizedSearch) return movies;

    return movies.filter((movie) => {
      const haystack = [movie.title, movie.description, movie.genre?.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [movies, normalizedSearch]);

  const featuredMovies = useMemo(() => {
    switch (activeCategory) {
      case 'Coming Soon':
        return searchedMovies.filter((movie) => new Date(movie.releaseDate).getTime() > now);
      case 'Top Movies':
        return [...searchedMovies].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'Favorites': {
        const favoriteCandidates = searchedMovies.filter((movie) => (movie.rating ?? 0) >= 4);
        return favoriteCandidates.length > 0 ? favoriteCandidates : searchedMovies.slice(0, 6);
      }
      case 'Now Playing':
      default:
        return searchedMovies.filter((movie) => new Date(movie.releaseDate).getTime() <= now);
    }
  }, [activeCategory, now, searchedMovies]);

  const heroMovie = featuredMovies[0] ?? movies[0];
  const filteredCinemas = useMemo(() => {
    if (!normalizedSearch) return cinemas;

    return cinemas.filter((cinema) =>
      [cinema.name, cinema.location, cinema.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [cinemas, normalizedSearch]);

  const greetingName = user?.fullName || 'Guest';
  const firstName = greetingName.split(' ')[0] || greetingName;

  const formatGenres = (movie?: Movie) => {
    if (!movie?.genre || movie.genre.length === 0) return 'Cinema';
    return movie.genre.slice(0, 2).join(' • ');
  };

  const renderMoviePoster = (movie: Movie) => (
    <TouchableOpacity
      key={movie.id}
      style={styles.movieCard}
      onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
      activeOpacity={0.85}
    >
      {movie.posterUrl ? (
        <Image source={{ uri: movie.posterUrl }} style={styles.moviePoster} />
      ) : (
        <View style={[styles.moviePoster, styles.posterFallback]}>
          <MaterialCommunityIcons name="movie-open-outline" size={32} color="#fff" />
        </View>
      )}
      <Text style={styles.movieTitle} numberOfLines={1}>
        {movie.title}
      </Text>
      <Text style={styles.movieGenre}>{formatGenres(movie)}</Text>
    </TouchableOpacity>
  );

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading your movie picks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={ACCENT} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <View style={styles.headerSearch}>
            <MaterialCommunityIcons
              name="movie-search"
              size={20}
              color={MUTED}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search movies, cinemas..."
              placeholderTextColor={MUTED}
              style={styles.headerSearchInput}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>

        <View style={styles.heroContainer}>
          {heroMovie ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('MovieDetail', { movieId: heroMovie.id })}
            >
              <ImageBackground
                source={{
                  uri:
                    heroMovie.posterUrl ||
                    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
                }}
                style={styles.heroBackground}
                imageStyle={styles.heroImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(15, 10, 18, 0.94)']}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroBadge}>
                    <Text style={styles.badgeText}>
                      {activeCategory === 'Coming Soon' ? 'COMING SOON' : 'TRENDING NOW'}
                    </Text>
                  </View>
                  <Text style={styles.heroTitle}>{heroMovie.title}</Text>
                  <View style={styles.heroMeta}>
                    <Text style={styles.heroMetaText}>
                      {formatGenres(heroMovie)} • {heroMovie.duration}m
                    </Text>
                    <View style={styles.ratingContainer}>
                      <MaterialCommunityIcons name="star" size={16} color={ACCENT} />
                      <Text style={styles.ratingText}>{(heroMovie.rating ?? 4.5).toFixed(1)}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ) : (
            <View style={[styles.heroBackground, styles.heroEmpty]}>
              <Text style={styles.emptyText}>No movies available right now.</Text>
            </View>
          )}
        </View>

        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((category) => {
              const isActive = category === activeCategory;

              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryTab, isActive && styles.activeTab]}
                  onPress={() => setActiveCategory(category)}
                >
                  <Text style={[styles.categoryText, isActive && styles.activeTabText]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.movieSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Movies</Text>
            <TouchableOpacity onPress={() => setActiveCategory('Now Playing')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {isError ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>Failed to load movies.</Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : featuredMovies.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.movieScroll}
            >
              {featuredMovies.slice(0, 10).map(renderMoviePoster)}
            </ScrollView>
          ) : (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>No movies match this category yet.</Text>
            </View>
          )}
        </View>

        <View style={styles.cinemaSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cinemas Near You</Text>
            <Text style={styles.seeAll}>{filteredCinemas.length}</Text>
          </View>

          {filteredCinemas.length > 0 ? (
            filteredCinemas.slice(0, 4).map((cinema) => (
              <View key={cinema.id} style={styles.cinemaCard}>
                <View style={styles.cinemaIcon}>
                  <MaterialCommunityIcons name="movie-roll" size={22} color={ACCENT} />
                </View>
                <View style={styles.cinemaContent}>
                  <Text style={styles.cinemaName}>{cinema.name}</Text>
                  <Text style={styles.cinemaMeta}>{cinema.location}</Text>
                  {cinema.address ? (
                    <Text style={styles.cinemaAddress} numberOfLines={2}>
                      {cinema.address}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>No cinemas found for your search.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    paddingBottom: 36,
  },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 16,
  },
  welcomeText: {
    color: MUTED,
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSearch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingHorizontal: 2,
    height: 52,
    maxWidth: 220,
  },
  headerSearchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  heroBackground: {
    height: 350,
    width: '100%',
  },
  heroImage: {
    borderRadius: 30,
  },
  heroGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroEmpty: {
    borderRadius: 30,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heroBadge: {
    backgroundColor: ACCENT,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  heroMetaText: {
    color: MUTED_LIGHT,
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  categorySection: {
    marginTop: 25,
  },
  categoryScroll: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: ACCENT,
  },
  categoryText: {
    color: MUTED,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  movieSection: {
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: ACCENT,
    fontSize: 14,
  },
  movieScroll: {
    paddingHorizontal: 20,
  },
  movieCard: {
    width: 150,
    marginRight: 15,
  },
  moviePoster: {
    width: 150,
    height: 220,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: SURFACE,
  },
  posterFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  movieGenre: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  cinemaSection: {
    marginTop: 25,
    paddingBottom: 12,
  },
  cinemaCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SURFACE,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 22,
    padding: 16,
  },
  cinemaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 6, 128, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cinemaContent: {
    flex: 1,
  },
  cinemaName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cinemaMeta: {
    color: ACCENT,
    fontSize: 13,
    marginBottom: 4,
  },
  cinemaAddress: {
    color: MUTED_LIGHT,
    fontSize: 13,
    lineHeight: 18,
  },
  messageCard: {
    backgroundColor: SURFACE,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  messageText: {
    color: '#fff',
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 6, 128, 0.12)',
  },
  secondaryButtonText: {
    color: ACCENT,
    fontWeight: '700',
  },
  emptyText: {
    color: MUTED_LIGHT,
    textAlign: 'center',
  },
});
