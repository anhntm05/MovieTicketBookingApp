import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';
import { AdminTabParamList } from '../../types/navigation';

const { width } = Dimensions.get('window');
const cardWidth = (width - 55) / 2;

type DashboardSummary = {
  users: {
    total: number;
    customers: number;
    staff: number;
    admins: number;
  };
  movies: number;
  cinemas: number;
  showtimes: number;
  comments: number;
  bookings: {
    total: number;
    pendingPayment: number;
    confirmed: number;
    cancelled: number;
    expired: number;
  };
  payments: {
    totalRevenue: number;
    completed: number;
    refunded: number;
    failed: number;
  };
  occupancyRate: number;
  topMovies: Array<{
    movieId: string;
    title: string;
    bookings: number;
    revenue: number;
    posterUrl?: string;
    genre?: string[];
  }>;
};

type FinancePoint = {
  label: string;
  revenue: number;
  transactions: number;
};

type AlertItem = {
  title: string;
  message: string;
  type: 'warning' | 'critical';
  actionLabel: string;
  targetTab: keyof AdminTabParamList;
};

const DEFAULT_SUMMARY: DashboardSummary = {
  users: { total: 0, customers: 0, staff: 0, admins: 0 },
  movies: 0,
  cinemas: 0,
  showtimes: 0,
  comments: 0,
  bookings: { total: 0, pendingPayment: 0, confirmed: 0, cancelled: 0, expired: 0 },
  payments: { totalRevenue: 0, completed: 0, refunded: 0, failed: 0 },
  occupancyRate: 0,
  topMovies: [],
};

const formatMoney = (value: number) =>
  `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}`;

const formatPercentChange = (current: number, previous: number) => {
  if (previous <= 0) {
    return current > 0 ? '+100%' : '0%';
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.abs(change).toFixed(1);
  return `${change >= 0 ? '+' : '-'}${rounded}%`;
};

const KPICard = ({
  title,
  value,
  change,
  icon,
  color,
}: {
  title: string;
  value: string;
  change?: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) => (
  <View style={styles.kpiCard}>
    <View style={styles.kpiHeader}>
      <View style={[styles.kpiIconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.kpiTitle}>{title}</Text>
    </View>
    <Text style={styles.kpiValue}>{value}</Text>
    {change ? (
      <View style={styles.changeRow}>
        <MaterialCommunityIcons name="trending-up" size={14} color={theme.colors.success} />
        <Text style={styles.changeText}>{change} vs previous period</Text>
      </View>
    ) : null}
  </View>
);

const AlertCard = ({
  title,
  message,
  type,
  actionLabel,
  onPress,
}: AlertItem & { onPress: () => void }) => {
  const isCritical = type === 'critical';
  const color = isCritical ? theme.colors.primary : theme.colors.warning;

  return (
    <View style={[styles.alertCard, { borderColor: `${color}40` }]}>
      <View style={styles.alertHeader}>
        <MaterialCommunityIcons
          name={isCritical ? 'alert-decagram' : 'alert-circle-outline'}
          size={20}
          color={color}
        />
        <Text style={[styles.alertTitle, { color }]}>{title}</Text>
      </View>
      <Text style={styles.alertMessage}>{message}</Text>
      <TouchableOpacity
        style={[styles.alertButton, { backgroundColor: `${color}20` }]}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Text style={[styles.alertButtonText, { color }]}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

export const DashboardScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<AdminTabParamList>>();
  const [range, setRange] = useState<'week' | 'month'>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats', range],
    queryFn: async () => {
      const now = new Date();
      const currentStart = new Date(now);
      currentStart.setDate(now.getDate() - (range === 'week' ? 6 : 29));
      currentStart.setHours(0, 0, 0, 0);

      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);

      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - (range === 'week' ? 6 : 29));
      previousStart.setHours(0, 0, 0, 0);

      const params = (startDate: Date, endDate: Date) => ({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const [dashboardResponse, previousResponse, financeResponse] = await Promise.all([
        apiClient.get('/admin/dashboard', { params: params(currentStart, now) }),
        apiClient.get('/admin/dashboard', { params: params(previousStart, previousEnd) }),
        apiClient.get('/admin/finance', {
          params: {
            ...params(currentStart, now),
            groupBy: 'day',
          },
        }),
      ]);

      return {
        dashboard: unwrapApiData<DashboardSummary>(dashboardResponse),
        previous: unwrapApiData<DashboardSummary>(previousResponse),
        finance: unwrapApiData<FinancePoint[]>(financeResponse),
      };
    },
    placeholderData: {
      dashboard: DEFAULT_SUMMARY,
      previous: DEFAULT_SUMMARY,
      finance: [],
    },
  });

  const dashboard = data?.dashboard ?? DEFAULT_SUMMARY;
  const previous = data?.previous ?? DEFAULT_SUMMARY;
  const finance = data?.finance ?? [];

  const revenueChange = formatPercentChange(dashboard.payments.totalRevenue, previous.payments.totalRevenue);
  const confirmedChange = formatPercentChange(dashboard.bookings.confirmed, previous.bookings.confirmed);
  const cancellationRate = dashboard.bookings.total
    ? ((dashboard.bookings.cancelled / dashboard.bookings.total) * 100).toFixed(1)
    : '0.0';
  const pendingRate = dashboard.bookings.total
    ? (dashboard.bookings.pendingPayment / dashboard.bookings.total) * 100
    : 0;
  const confirmedRate = dashboard.bookings.total
    ? (dashboard.bookings.confirmed / dashboard.bookings.total) * 100
    : 0;
  const financeMax = Math.max(...finance.map((item) => item.revenue), 1);

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];

    if (dashboard.occupancyRate < 45) {
      items.push({
        title: 'Low Occupancy Alert',
        message: `Average occupancy is ${dashboard.occupancyRate.toFixed(1)}%, below the 45% operating target.`,
        type: 'warning',
        actionLabel: 'Review showtimes',
        targetTab: 'Cinemas',
      });
    }

    if (dashboard.bookings.total > 0 && Number(cancellationRate) >= 8) {
      items.push({
        title: 'High Cancellation Alert',
        message: `${dashboard.bookings.cancelled} bookings were cancelled in the selected period, representing ${cancellationRate}% of demand.`,
        type: 'critical',
        actionLabel: 'Investigate bookings',
        targetTab: 'Users',
      });
    }

    if (pendingRate >= 25) {
      items.push({
        title: 'Payment Friction Alert',
        message: `${dashboard.bookings.pendingPayment} bookings are still pending payment. Check checkout flow and payment completion.`,
        type: 'warning',
        actionLabel: 'Review customers',
        targetTab: 'Users',
      });
    }

    if (!items.length) {
      items.push({
        title: 'Operations Stable',
        message: 'No immediate operational anomalies detected from occupancy, cancellations, or payment flow.',
        type: 'warning',
        actionLabel: 'View cinemas',
        targetTab: 'Cinemas',
      });
    }

    return items.slice(0, 2);
  }, [dashboard.bookings.cancelled, dashboard.bookings.pendingPayment, dashboard.bookings.total, dashboard.occupancyRate, cancellationRate, pendingRate]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons name="movie-filter" size={24} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>NEON NOCTURNE ADMIN</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} activeOpacity={0.85} onPress={() => navigation.navigate('Profile')}>
          <MaterialCommunityIcons name="account-circle-outline" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.gridRow}>
        <KPICard
          title="TOTAL REVENUE"
          value={formatMoney(dashboard.payments.totalRevenue)}
          change={revenueChange}
          icon="currency-usd"
          color={theme.colors.primary}
        />
        <KPICard
          title="CONFIRMED"
          value={dashboard.bookings.confirmed.toLocaleString()}
          change={confirmedChange}
          icon="ticket-confirmation"
          color={theme.colors.success}
        />
      </View>

      <View style={styles.gridRow}>
        <KPICard
          title="OCCUPANCY"
          value={`${dashboard.occupancyRate.toFixed(1)}%`}
          icon="seat-passenger"
          color="#9C27B0"
        />
        <KPICard
          title="CANCELLATION"
          value={`${cancellationRate}%`}
          icon="close-circle-outline"
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Revenue Trend</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity
              style={range === 'week' ? styles.activeTab : styles.inactiveTab}
              activeOpacity={0.85}
              onPress={() => setRange('week')}
            >
              <Text style={range === 'week' ? styles.tabTextActive : styles.tabText}>WEEK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={range === 'month' ? styles.activeTab : styles.inactiveTab}
              activeOpacity={0.85}
              onPress={() => setRange('month')}
            >
              <Text style={range === 'month' ? styles.tabTextActive : styles.tabText}>MONTH</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.barChartPlaceholder}>
          {finance.map((item) => (
            <View
              key={item.label}
              style={[
                styles.bar,
                {
                  height: Math.max(12, (item.revenue / financeMax) * 100),
                  backgroundColor: `${theme.colors.primary}30`,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.chartLabels}>
          {finance.map((item) => (
            <Text key={item.label} style={styles.label}>
              {range === 'week' ? item.label.slice(8, 10) : item.label.slice(5, 7)}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Booking Funnel</Text>
        <View style={styles.funnelContainer}>
          <View style={styles.funnelCircle}>
            <Text style={styles.funnelValue}>{dashboard.bookings.total.toLocaleString()}</Text>
            <Text style={styles.funnelLabel}>TOTAL OPS</Text>
          </View>

          <View style={styles.funnelLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <Text style={styles.legendText}>Confirmed</Text>
              <Text style={styles.legendValue}>{confirmedRate.toFixed(0)}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
              <Text style={styles.legendText}>Pending</Text>
              <Text style={styles.legendValue}>{pendingRate.toFixed(0)}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
              <Text style={styles.legendText}>Expired</Text>
              <Text style={styles.legendValue}>
                {dashboard.bookings.total
                  ? `${((dashboard.bookings.expired / dashboard.bookings.total) * 100).toFixed(0)}%`
                  : '0%'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Operational Alerts</Text>
      {alerts.map((item) => (
        <AlertCard
          key={item.title}
          {...item}
          onPress={() => navigation.navigate(item.targetTab)}
        />
      ))}

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Top Performing Titles</Text>
          <Text style={styles.metaPill}>{dashboard.cinemas} cinemas live</Text>
        </View>

        {dashboard.topMovies.length ? (
          dashboard.topMovies.map((movie, index) => (
            <View
              key={movie.movieId}
              style={[
                styles.movieRow,
                index === dashboard.topMovies.length - 1 && styles.movieRowLast,
              ]}
            >
              <View style={styles.movieInfo}>
                {movie.posterUrl ? (
                  <Image source={{ uri: movie.posterUrl }} style={styles.moviePoster} />
                ) : (
                  <View style={styles.movieIcon}>
                    <MaterialCommunityIcons name="movie-open-outline" size={20} color={theme.colors.primary} />
                  </View>
                )}
                <View style={styles.movieTextBlock}>
                  <Text style={styles.movieName} numberOfLines={1}>
                    {movie.title}
                  </Text>
                  <Text style={styles.movieGenre} numberOfLines={1}>
                    {(movie.genre?.slice(0, 2).join(' / ') || 'General Release').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.movieMetricBlock}>
                <Text style={styles.movieRevenue}>{formatMoney(movie.revenue)}</Text>
                <Text style={styles.movieBookings}>{movie.bookings} bookings</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.placeholderText}>No top-performing movies for this period yet.</Text>
        )}
      </View>

      <View style={styles.quickStatsRow}>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatLabel}>SHOWTIMES</Text>
          <Text style={styles.quickStatValue}>{dashboard.showtimes}</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatLabel}>COMMENTS</Text>
          <Text style={styles.quickStatValue}>{dashboard.comments}</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatLabel}>USERS</Text>
          <Text style={styles.quickStatValue}>{dashboard.users.total}</Text>
        </View>
      </View>
    </ScrollView>
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
    paddingVertical: 15,
    backgroundColor: '#110c14',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
    marginLeft: 10,
    letterSpacing: 1,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  kpiCard: {
    width: cardWidth,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  kpiTitle: {
    color: '#aaa',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  kpiValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  changeText: {
    color: theme.colors.success,
    fontSize: 10,
    marginLeft: 4,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  chartTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 4,
  },
  activeTab: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inactiveTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabTextActive: {
    color: theme.colors.text,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  barChartPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingHorizontal: 10,
  },
  bar: {
    width: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    width: 18,
    textAlign: 'center',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 15,
  },
  alertCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
    marginLeft: 8,
  },
  alertMessage: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  alertButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  alertButtonText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  movieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  movieRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  movieInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  moviePoster: {
    width: 42,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: `${theme.colors.primary}20`,
  },
  movieIcon: {
    width: 42,
    height: 56,
    borderRadius: 8,
    backgroundColor: `${theme.colors.primary}20`,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movieTextBlock: {
    flex: 1,
  },
  movieName: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  movieGenre: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 4,
  },
  movieMetricBlock: {
    alignItems: 'flex-end',
  },
  movieRevenue: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  movieBookings: {
    color: '#aaa',
    fontSize: 11,
    fontFamily: theme.typography.fontFamilies.medium,
    marginTop: 4,
  },
  funnelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  funnelCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: `${theme.colors.primary}20`,
    borderTopColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  funnelValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  funnelLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  funnelLegend: {
    flex: 1,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    color: '#aaa',
    fontSize: 12,
    flex: 1,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  legendValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
  quickStatLabel: {
    color: '#aaa',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 8,
  },
  quickStatValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  metaPill: {
    color: theme.colors.primary,
    fontSize: 11,
    fontFamily: theme.typography.fontFamilies.bold,
    backgroundColor: `${theme.colors.primary}12`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  placeholderText: {
    color: '#aaa',
    fontFamily: theme.typography.fontFamilies.regular,
  },
});
