import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeCinema, unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';
import { Cinema } from '../../types/models';

const categories = ['Nearby', 'Favorites', 'All Cinemas'] as const;
type CinemaCategory = (typeof categories)[number];

const premiumFacilityPattern = /vip|imax|premium|dolby/i;
const cinemaImages = [
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?auto=format&fit=crop&q=80&w=800',
];
const mapPreviewImage =
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200';

const getCinemaImage = (index: number) => cinemaImages[index % cinemaImages.length];

export const CinemasScreen = () => {
  const [activeCategory, setActiveCategory] = useState<CinemaCategory>('Nearby');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: cinemas = [], isLoading, isRefetching, refetch } = useQuery<Cinema[]>({
    queryKey: ['cinemas'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/cinemas?status=active'));
      return data.map(normalizeCinema);
    },
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const searchedCinemas = useMemo(() => {
    if (!normalizedSearch) return cinemas;

    return cinemas.filter((cinema) =>
      [cinema.name, cinema.location, cinema.address, ...(cinema.facilities ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [cinemas, normalizedSearch]);

  const favoriteCinemas = useMemo(
    () =>
      searchedCinemas.filter((cinema) =>
        (cinema.facilities ?? []).some((facility) => premiumFacilityPattern.test(facility))
      ),
    [searchedCinemas]
  );

  const visibleCinemas = useMemo(() => {
    switch (activeCategory) {
      case 'Favorites':
        return favoriteCinemas;
      case 'All Cinemas':
        return searchedCinemas;
      case 'Nearby':
      default:
        return searchedCinemas.slice(0, 4);
    }
  }, [activeCategory, favoriteCinemas, searchedCinemas]);

  const subtitle =
    activeCategory === 'Favorites'
      ? 'Premium picks with standout formats'
      : activeCategory === 'All Cinemas'
        ? `${searchedCinemas.length} active cinemas available`
        : 'Find your favorite spot';

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cinemas</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
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
            placeholder="Search by cinema, city, facility..."
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        {categories.map((category) => {
          const isActive = activeCategory === category;

          return (
            <TouchableOpacity
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[styles.tab, isActive && styles.activeTab]}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{category}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderCinema = ({ item, index }: { item: Cinema; index: number }) => {
    const tags = (item.facilities ?? []).slice(0, 3);
    const locationText = [item.location, item.address].filter(Boolean).join(' • ') || 'Location unavailable';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9}>
        <Image source={{ uri: getCinemaImage(index) }} style={styles.cinemaImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cinemaName} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity activeOpacity={0.85}>
              <MaterialCommunityIcons name="heart-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.locationText} numberOfLines={2}>
              {' '}
              {locationText}
            </Text>
          </View>

          <View style={styles.tagRow}>
            {tags.length > 0 ? (
              tags.map((tag) => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>Standard</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => (
    <View style={styles.mapSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cinema Map</Text>
        <Text style={styles.sectionMeta}>{visibleCinemas.length} spots</Text>
      </View>

      <View style={styles.mapContainer}>
        <Image source={{ uri: mapPreviewImage }} style={styles.mapMock} />
        <View style={styles.mapOverlay}>
          <View style={styles.mapMarker}>
            <MaterialCommunityIcons name="movie" size={16} color="#fff" />
          </View>
          <Text style={styles.mapHint}>Live map coming soon</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={visibleCinemas}
        keyExtractor={(item) => item.id}
        renderItem={renderCinema}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
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
            <MaterialCommunityIcons name="movie-search-outline" size={42} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>No cinemas found</Text>
            <Text style={styles.emptyText}>
              {activeCategory === 'Favorites'
                ? 'No premium cinemas match this filter yet.'
                : 'Try another search keyword or refresh the list.'}
            </Text>
          </View>
        }
      />
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  headerSubtitle: {
    color: '#8c8192',
    fontSize: 14,
    marginTop: 4,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  mapButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  searchSection: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 52,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 14,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 12,
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
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  cinemaImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 12,
  },
  cinemaName: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    flex: 1,
    color: '#8c8192',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  tagBadge: {
    backgroundColor: '#f9068010',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#251d2a',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    marginTop: 6,
    marginBottom: 20,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    marginTop: 12,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  emptyText: {
    color: '#8c8192',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  mapSection: {
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  sectionMeta: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  mapContainer: {
    height: 160,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#251d2a',
    backgroundColor: theme.colors.surface,
  },
  mapMock: {
    width: '100%',
    height: '100%',
    opacity: 0.28,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  mapHint: {
    color: theme.colors.text,
    fontSize: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 10, 18, 0.8)',
    fontFamily: theme.typography.fontFamilies.medium,
  },
});
