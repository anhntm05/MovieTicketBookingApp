import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { normalizeCinema, unwrapApiData } from '../../api/transformers';
import { Cinema } from '../../types/models';
import { theme } from '../../constants/theme';

const categories = ['Nearby', 'Favorites', 'All Cinemas'] as const;
type CinemaCategory = (typeof categories)[number];

const cinemaImages = [
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1517604401870-d2511955973b?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=900',
  'https://images.unsplash.com/photo-1460881680858-30d872d5b530?auto=format&fit=crop&q=80&w=900',
];

const mapPreviewImage =
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200';

const fallbackTags = ['4K', 'IMAX', 'Dine-in'];

const deriveCinemaDistance = (index: number) => `${(index * 0.9 + 1.2).toFixed(1)} miles away`;

const deriveCinemaTags = (cinema: Cinema, index: number) => {
  const facilities = (cinema.facilities ?? []).filter(Boolean).slice(0, 3);
  if (facilities.length) {
    return facilities;
  }

  return fallbackTags.slice(index % fallbackTags.length).concat(fallbackTags).slice(0, 3);
};

const buildCinemaLocation = (cinema: Cinema, index: number) => {
  const place = cinema.location || cinema.address || 'Location unavailable';
  return `${deriveCinemaDistance(index)} • ${place}`;
};

export const CinemasScreen = () => {
  const [activeCategory, setActiveCategory] = React.useState<CinemaCategory>('Nearby');
  const [searchValue, setSearchValue] = React.useState('');
  const [favoriteCinemaIds, setFavoriteCinemaIds] = React.useState<string[]>([]);

  const { data: cinemas, isLoading, isRefetching, isError, error, refetch } = useQuery<Cinema[]>({
    queryKey: ['cinemas'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/cinemas?status=active'));
      return data.map(normalizeCinema);
    },
  });

  const toggleFavorite = (cinemaId: string) => {
    setFavoriteCinemaIds((currentIds) =>
      currentIds.includes(cinemaId)
        ? currentIds.filter((id) => id !== cinemaId)
        : [...currentIds, cinemaId]
    );
  };

  const filteredCinemas = (cinemas ?? []).filter((cinema, index) => {
    const query = searchValue.trim().toLowerCase();
    const haystack = [cinema.name, cinema.location, cinema.address].join(' ').toLowerCase();
    const matchesSearch = !query || haystack.includes(query);

    if (!matchesSearch) {
      return false;
    }

    if (activeCategory === 'Favorites') {
      return favoriteCinemaIds.includes(cinema.id);
    }

    if (activeCategory === 'Nearby') {
      return index < 3;
    }

    return true;
  });

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : 'Unable to load cinemas right now.';

    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.errorState}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={42}
            color={theme.colors.primary}
          />
          <Text style={styles.emptyTitle}>Could not load cinemas</Text>
          <Text style={styles.emptyText}>{message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cinemas</Text>
          <Text style={styles.headerSubtitle}>Find your favorite spot</Text>
        </View>
        <TouchableOpacity style={styles.mapButton} activeOpacity={0.85}>
          <MaterialCommunityIcons name="map-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search by city or zip code..."
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.searchInput}
            value={searchValue}
            onChangeText={setSearchValue}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setActiveCategory(category)}
            style={[styles.tab, activeCategory === category && styles.activeTab]}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, activeCategory === category && styles.activeTabText]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        {filteredCinemas.map((cinema, index) => {
          const isFavorite = favoriteCinemaIds.includes(cinema.id);
          const imageUri = cinemaImages[index % cinemaImages.length];
          const tags = deriveCinemaTags(cinema, index);

          return (
            <TouchableOpacity key={cinema.id} style={styles.card} activeOpacity={0.92}>
              <Image source={{ uri: imageUri }} style={styles.cinemaImage} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cinemaName} numberOfLines={1}>
                    {cinema.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(cinema.id)}
                    activeOpacity={0.85}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name={isFavorite ? 'heart' : 'heart-outline'}
                      size={20}
                      color={isFavorite ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.locationText}>{buildCinemaLocation(cinema, index)}</Text>
                <View style={styles.tagRow}>
                  {tags.map((tag) => (
                    <View key={`${cinema.id}-${tag}`} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {!filteredCinemas.length ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="movie-search-outline"
              size={42}
              color={theme.colors.primary}
            />
            <Text style={styles.emptyTitle}>No cinemas found</Text>
            <Text style={styles.emptyText}>
              Try another search or switch to a different category.
            </Text>
          </View>
        ) : null}

        {/* <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Cinema Map</Text>
          <View style={styles.mapContainer}>
            <Image source={{ uri: mapPreviewImage }} style={styles.mapMock} />
            <View style={styles.mapOverlay}>
              <View style={styles.mapMarker}>
                <MaterialCommunityIcons name="movie" size={16} color="#fff" />
              </View>
            </View>
          </View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    ...theme.typography.pageTitle,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilies.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginTop: 2,
  },
  mapButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#f9068015',
    borderWidth: 1,
    borderColor: '#f9068030',
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  cinemaImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  cinemaName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  locationText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#f9068010',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f9068020',
  },
  tagText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#251d2a',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorState: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: theme.typography.sizes.sm,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#f9068015',
    borderWidth: 1,
    borderColor: '#f9068030',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: theme.typography.sizes.sm,
  },
  mapSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 15,
  },
  mapContainer: {
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  mapMock: {
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default CinemasScreen;
