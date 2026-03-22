import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { resolveMediaUrl, unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';
import { AdminCinemaStackParamList } from '../../types/navigation';

const { width } = Dimensions.get('window');

type TrendRange = 'weekly' | 'monthly';

type CinemaOpsDetail = {
  cinema: {
    id: string;
    name: string;
    location: string;
    address: string;
    status: 'ACTIVE' | 'INACTIVE';
    facilities: string[];
    screenCount: number;
    totalSeats: number;
    screenNames: string[];
    screens: Array<{
      id: string;
      name: string;
      totalSeats: number;
      hallType: string;
      projectionType?: string;
      audioSystem?: string;
      status: 'ACTIVE' | 'MAINTENANCE';
    }>;
  };
  summary: {
    totalRevenue: number;
    revenueChange: number;
    totalBookings: number;
    averageDailyBookings: number;
    occupancyRate: number;
  };
  trends: {
    weekly: Array<{ label: string; revenue: number }>;
    monthly: Array<{ label: string; revenue: number }>;
  };
  showingMovies: Array<{
    movieId: string;
    title: string;
    slots: number;
    posterUrl?: string;
    isTrending: boolean;
  }>;
  bookingDistribution: Array<{
    label: string;
    percentage: number;
    count: number;
  }>;
};

const formatMoney = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
};

const formatChange = (value: number) => {
  if (!value) return 'Stable';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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

  return 'Unable to load cinema detail.';
};

const StatCard = ({
  title,
  value,
  change,
  color,
}: {
  title: string;
  value: string;
  change?: string;
  color: string;
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {change ? (
      <View style={styles.changeRow}>
        <MaterialCommunityIcons name="trending-up" size={14} color={theme.colors.success} />
        <Text style={styles.changeText}>{change}</Text>
      </View>
    ) : null}
    <View style={[styles.statIndicator, { backgroundColor: color }]} />
  </View>
);

const MovieItem = ({
  title,
  slots,
  image,
  isTrending,
  onManage,
}: {
  title: string;
  slots: number;
  image?: string;
  isTrending?: boolean;
  onManage: () => void;
}) => (
  <View style={styles.movieItem}>
    {image ? (
      <Image source={{ uri: image }} style={styles.moviePoster} />
    ) : (
      <View style={[styles.moviePoster, styles.posterFallback]}>
        <MaterialCommunityIcons name="movie-open-outline" size={28} color={theme.colors.primary} />
      </View>
    )}
    {isTrending ? (
      <View style={styles.trendingBadge}>
        <Text style={styles.trendingText}>TRENDING</Text>
      </View>
    ) : null}
    <View style={styles.movieInfo}>
      <Text style={styles.movieTitle}>{title}</Text>
      <Text style={styles.movieSlots}>{slots} Slots Today</Text>
      <TouchableOpacity style={styles.manageButton} activeOpacity={0.85} onPress={onManage}>
        <Text style={styles.manageText}>MANAGE</Text>
      </TouchableOpacity>
    </View>
  </View>
);

type Props = NativeStackScreenProps<AdminCinemaStackParamList, 'AdminCinemaDetail'>;

export const AdminCinemaDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const rootNavigation = useNavigation<any>();
  const [trendRange, setTrendRange] = useState<TrendRange>('weekly');

  const { cinemaId } = route.params;
  const { data, error, isLoading, isRefetching, refetch } = useQuery<CinemaOpsDetail>({
    queryKey: ['admin-cinema-detail', cinemaId],
    queryFn: async () =>
      unwrapApiData<CinemaOpsDetail>(await apiClient.get(`/admin/cinemas/${cinemaId}/detail`)),
  });

  const trend = trendRange === 'weekly' ? data?.trends.weekly ?? [] : data?.trends.monthly ?? [];
  const maxRevenue = Math.max(...trend.map((item) => item.revenue), 1);
  const hallSummary = useMemo(() => {
    if (!data?.cinema.screenCount) return 'No halls configured';
    if (data.cinema.screenCount === 1) return '1 hall';
    return `${data.cinema.screenCount} halls`;
  }, [data?.cinema.screenCount]);

  const distributionColors = ['#03DAC6', '#9C27B0', '#f90680', '#666'];

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
        <TouchableOpacity style={styles.retryButton} activeOpacity={0.85} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
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
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
          progressBackgroundColor={theme.colors.surface}
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons name="movie-open" size={24} color={theme.colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{data.cinema.name}</Text>
            <Text style={styles.headerSubtitle}>
              {data.cinema.location} • {hallSummary}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileCircle} activeOpacity={0.85} onPress={() => refetch()}>
          <MaterialCommunityIcons name="refresh" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="TOTAL REVENUE"
          value={formatMoney(data.summary.totalRevenue)}
          change={formatChange(data.summary.revenueChange)}
          color={theme.colors.primary}
        />
        <StatCard
          title="TOTAL BOOKINGS"
          value={data.summary.totalBookings.toLocaleString()}
          change={`Daily avg: ${data.summary.averageDailyBookings.toFixed(1)}`}
          color={theme.colors.success}
        />
      </View>

      <View style={styles.fullStatCard}>
        <Text style={styles.statTitle}>OCCUPANCY RATE</Text>
        <View style={styles.occupancyRow}>
          <Text style={styles.occupancyValue}>{data.summary.occupancyRate.toFixed(0)}%</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(data.summary.occupancyRate, 100)}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity
              style={trendRange === 'weekly' ? styles.activeTab : styles.inactiveTab}
              activeOpacity={0.85}
              onPress={() => setTrendRange('weekly')}
            >
              <Text style={trendRange === 'weekly' ? styles.tabTextActive : styles.tabText}>WEEKLY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={trendRange === 'monthly' ? styles.activeTab : styles.inactiveTab}
              activeOpacity={0.85}
              onPress={() => setTrendRange('monthly')}
            >
              <Text style={trendRange === 'monthly' ? styles.tabTextActive : styles.tabText}>MONTHLY</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.chartPlaceholder}>
          <LinearGradient colors={['#f9068020', 'transparent']} style={styles.chartGradient} />
          <View style={styles.chartBars}>
            {trend.map((item, index) => (
              <View key={`${item.label}-${index}`} style={styles.chartBarBlock}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: Math.max(12, (item.revenue / maxRevenue) * 96),
                      width: Math.max(16, (width - 120) / Math.max(trend.length * 1.4, 1)),
                    },
                  ]}
                />
                <Text style={styles.chartLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.moviesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Currently Showing</Text>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AdminShowtimeCreate', { cinemaId })}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>ADD MOVIE</Text>
          </TouchableOpacity>
        </View>

        {data.showingMovies.length ? (
          data.showingMovies.map((movie) => (
            <MovieItem
              key={movie.movieId || movie.title}
              title={movie.title}
              slots={movie.slots}
              image={resolveMediaUrl(movie.posterUrl)}
              isTrending={movie.isTrending}
              onManage={() =>
                rootNavigation.navigate('Movies', {
                  screen: 'AdminMovieDetail',
                  params: { movieId: movie.movieId },
                })
              }
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No movies are scheduled at this cinema today.</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.statTitle}>Booking Distribution</Text>
        {data.bookingDistribution.map((item, index) => (
          <View key={item.label} style={styles.distRow}>
            <View style={styles.distInfo}>
              <Text style={styles.distLabel}>{item.label}</Text>
              <Text style={styles.distValue}>{item.percentage}%</Text>
            </View>
            <View style={styles.distBarBg}>
              <View
                style={[
                  styles.distBarFill,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: distributionColors[index] || '#666',
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Cinema Information</Text>
        <Text style={styles.detailText}>{data.cinema.address}</Text>
        <Text style={styles.detailMeta}>
          {data.cinema.totalSeats.toLocaleString()} seats • {data.cinema.facilities.length || 0} listed facilities
        </Text>
        <View style={styles.hallList}>
          {data.cinema.screens.length ? (
            data.cinema.screens.map((screen) => (
              <View key={screen.id} style={styles.hallRow}>
                <View style={styles.hallRowCopy}>
                  <Text style={styles.hallRowName}>{screen.name}</Text>
                  <Text style={styles.hallRowMeta}>
                    {screen.totalSeats.toLocaleString()} seats • {screen.hallType}
                  </Text>
                  {screen.projectionType || screen.audioSystem ? (
                    <Text style={styles.hallRowSpecs}>
                      {[screen.projectionType, screen.audioSystem].filter(Boolean).join(' • ')}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.hallStatusPill,
                    screen.status === 'ACTIVE' ? styles.hallStatusActive : styles.hallStatusMaintenance,
                  ]}
                >
                  <Text style={styles.hallStatusText}>{screen.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyHallText}>No halls configured yet.</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.detailButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AdminScreenRoomCreate', { cinemaId })}
        >
          <MaterialCommunityIcons name="door-sliding-open" size={18} color="#fff" />
          <Text style={styles.detailButtonText}>ADD NEW SCREEN ROOM</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0a12' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0a12', padding: 24 },
  errorText: { color: '#fff', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    backgroundColor: '#f90680',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a141e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#f90680', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a141e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: {
    width: (width - 55) / 2,
    backgroundColor: '#1a141e',
    borderRadius: 20,
    padding: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  statTitle: { color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  changeText: { color: '#03DAC6', fontSize: 10, marginLeft: 4, fontWeight: '600' },
  statIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  fullStatCard: { backgroundColor: '#1a141e', borderRadius: 20, padding: 20, marginBottom: 20 },
  occupancyRow: { flexDirection: 'row', alignItems: 'center' },
  occupancyValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginRight: 20 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: '#0f0a12', borderRadius: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#f90680', borderRadius: 4 },
  sectionCard: { backgroundColor: '#1a141e', borderRadius: 25, padding: 20, marginBottom: 20 },
  detailCard: { backgroundColor: '#1a141e', borderRadius: 25, padding: 20 },
  detailTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  detailText: { color: '#aaa', fontSize: 14, lineHeight: 20 },
  detailMeta: { color: '#f90680', fontSize: 12, marginTop: 12, fontWeight: '700' },
  hallList: { marginTop: 18, gap: 12 },
  hallRow: {
    backgroundColor: '#120d15',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a1e31',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  hallRowCopy: { flex: 1 },
  hallRowName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  hallRowMeta: { color: '#f90680', fontSize: 12, fontWeight: '700', marginTop: 4 },
  hallRowSpecs: { color: '#9c92a3', fontSize: 11, marginTop: 4, lineHeight: 16 },
  hallStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  hallStatusActive: {
    backgroundColor: '#03DAC614',
    borderColor: '#03DAC650',
  },
  hallStatusMaintenance: {
    backgroundColor: '#F2C94C14',
    borderColor: '#F2C94C50',
  },
  hallStatusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyHallText: { color: '#8f8794', fontSize: 12 },
  detailButton: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#251d2a',
    borderWidth: 1,
    borderColor: '#3a2a44',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailButtonText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  chartTabs: { flexDirection: 'row', backgroundColor: '#0f0a12', borderRadius: 8, padding: 4 },
  activeTab: { backgroundColor: '#241a29', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  inactiveTab: { paddingHorizontal: 10, paddingVertical: 4 },
  tabTextActive: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tabText: { color: '#666', fontSize: 10 },
  chartPlaceholder: { minHeight: 150, position: 'relative', overflow: 'hidden', borderRadius: 16, justifyContent: 'flex-end' },
  chartGradient: { ...StyleSheet.absoluteFillObject },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 4, paddingTop: 16 },
  chartBarBlock: { alignItems: 'center', justifyContent: 'flex-end' },
  chartBar: { backgroundColor: '#f9068050', borderWidth: 1, borderColor: '#f90680', borderRadius: 8, marginBottom: 8 },
  chartLabel: { color: '#8f8794', fontSize: 9, maxWidth: 40 },
  moviesSection: { marginBottom: 20 },
  addBtn: { backgroundColor: '#f90680', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  movieItem: {
    backgroundColor: '#1a141e',
    borderRadius: 25,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  moviePoster: { width: 80, height: 120, borderRadius: 15, backgroundColor: '#120d15' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  movieInfo: { flex: 1, marginLeft: 15 },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  movieSlots: { color: '#666', fontSize: 12, marginTop: 4 },
  manageButton: {
    marginTop: 15,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0f0a12',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  manageText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  trendingBadge: {
    position: 'absolute',
    top: 25,
    left: 25,
    backgroundColor: '#f90680',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendingText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  distRow: { marginBottom: 15 },
  distInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, gap: 12 },
  distLabel: { color: '#aaa', fontSize: 12, flex: 1 },
  distValue: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  distBarBg: { height: 6, backgroundColor: '#0f0a12', borderRadius: 3 },
  distBarFill: { height: '100%', borderRadius: 3 },
  emptyCard: {
    backgroundColor: '#1a141e',
    borderRadius: 20,
    padding: 18,
  },
  emptyText: { color: '#8f8794', fontSize: 13 },
});

export default AdminCinemaDetailScreen;
