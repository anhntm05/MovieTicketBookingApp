import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');
const chartWidth = width - 80;

type RevenueRange = 'today' | '7d' | '30d';

type RevenueStreamData = {
  summary: {
    totalRevenue: number;
    todayRevenue: number;
    averageOrderValue: number;
    completedPayments: number;
    revenueChange: number;
    todayChange: number;
    completedChange: number;
  };
  trend: Array<{
    label: string;
    revenue: number;
  }>;
  health: {
    refundRate: number;
    failureRate: number;
    alertTitle: string;
    alertMessage: string;
    alertSeverity: 'warning' | 'critical';
  };
  liveTransactions: Array<{
    id: string;
    movie: string;
    customer: string;
    time: string;
    amount: number;
    status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    revenue: number;
  }>;
};

const DEFAULT_DATA: RevenueStreamData = {
  summary: {
    totalRevenue: 0,
    todayRevenue: 0,
    averageOrderValue: 0,
    completedPayments: 0,
    revenueChange: 0,
    todayChange: 0,
    completedChange: 0,
  },
  trend: [],
  health: {
    refundRate: 0,
    failureRate: 0,
    alertTitle: 'SYSTEM STABLE',
    alertMessage: 'No abnormal payment activity detected in the selected period.',
    alertSeverity: 'warning',
  },
  liveTransactions: [],
  topPerformers: [],
};

const formatMoney = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
};

const formatChange = (value: number) => {
  if (value === 0) return 'Stable';
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

  return 'Unable to load revenue stream.';
};

const KPICard = ({
  title,
  value,
  change,
  color,
  isPositive = true,
}: {
  title: string;
  value: string;
  change?: string;
  color: string;
  isPositive?: boolean;
}) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiTitle}>{title}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
    {change ? (
      <View style={styles.changeRow}>
        <MaterialCommunityIcons
          name={isPositive ? 'trending-up' : 'trending-down'}
          size={14}
          color={isPositive ? theme.colors.success : theme.colors.primary}
        />
        <Text style={[styles.changeText, { color: isPositive ? theme.colors.success : theme.colors.primary }]}>
          {change}
        </Text>
      </View>
    ) : null}
    <View style={[styles.kpiIndicator, { backgroundColor: color }]} />
  </View>
);

const TransactionRow = ({
  movie,
  time,
  customer,
  amount,
  status,
}: {
  movie: string;
  time: string;
  customer: string;
  amount: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
}) => (
  <View style={styles.transactionRow}>
    <View style={styles.txMainInfo}>
      <Text style={styles.txMovie}>{movie}</Text>
      <Text style={styles.txCustomer}>{customer}</Text>
    </View>
    <View style={styles.txMetaInfo}>
      <Text style={styles.txTime}>{time}</Text>
      <Text style={styles.txAmount}>{amount}</Text>
    </View>
    <View
      style={[
        styles.statusDot,
        {
          backgroundColor:
            status === 'SUCCESS'
              ? theme.colors.success
              : status === 'REFUNDED'
                ? theme.colors.warning
                : theme.colors.primary,
        },
      ]}
    />
  </View>
);

export const RevenueStreamingScreen = () => {
  const [range, setRange] = useState<RevenueRange>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  const { data = DEFAULT_DATA, error, isLoading, refetch } = useQuery<RevenueStreamData>({
    queryKey: ['admin-revenue-stream', range],
    queryFn: async () =>
      unwrapApiData<RevenueStreamData>(
        await apiClient.get('/admin/revenue-stream', {
          params: { range },
        })
      ),
  });

  const filteredTransactions = useMemo(() => {
    if (!deferredSearchQuery) return data.liveTransactions;

    return data.liveTransactions.filter((item) =>
      [item.id, item.movie, item.customer].some((value) => value.toLowerCase().includes(deferredSearchQuery))
    );
  }, [data.liveTransactions, deferredSearchQuery]);

  const filteredPerformers = useMemo(() => {
    if (!deferredSearchQuery) return data.topPerformers;

    return data.topPerformers.filter((item) => item.name.toLowerCase().includes(deferredSearchQuery));
  }, [data.topPerformers, deferredSearchQuery]);

  const maxRevenue = Math.max(...data.trend.map((item) => item.revenue), 1);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.logoSquare}>
            <MaterialCommunityIcons name="finance" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.headerTitle}>REVENUE STREAMING</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.85} onPress={() => refetch()}>
          <MaterialCommunityIcons name="refresh" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              placeholder="Search transaction ID or movie..."
              placeholderTextColor="#666"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScroll}>
          <KPICard
            title="TOTAL REVENUE"
            value={formatMoney(data.summary.totalRevenue)}
            change={formatChange(data.summary.revenueChange)}
            color={theme.colors.primary}
            isPositive={data.summary.revenueChange >= 0}
          />
          <KPICard
            title="TODAY'S INTAKE"
            value={formatMoney(data.summary.todayRevenue)}
            change={formatChange(data.summary.todayChange)}
            color={theme.colors.success}
            isPositive={data.summary.todayChange >= 0}
          />
          <KPICard
            title="AVG ORDER VALUE"
            value={formatMoney(data.summary.averageOrderValue)}
            change="Stable"
            color="#9C27B0"
          />
          <KPICard
            title="COMPLETED"
            value={data.summary.completedPayments.toLocaleString()}
            change={formatChange(data.summary.completedChange)}
            color={theme.colors.success}
            isPositive={data.summary.completedChange >= 0}
          />
        </ScrollView>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Revenue Velocity</Text>
            <View style={styles.chartTabs}>
              {[
                { key: 'today' as RevenueRange, label: 'TODAY' },
                { key: '7d' as RevenueRange, label: '7D' },
                { key: '30d' as RevenueRange, label: '30D' },
              ].map((item) => {
                const isActive = range === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={isActive ? styles.activeTab : styles.inactiveTab}
                    activeOpacity={0.85}
                    onPress={() => setRange(item.key)}
                  >
                    <Text style={isActive ? styles.tabTextActive : styles.tabText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.chartArea}>
            <LinearGradient colors={['#f9068030', 'transparent']} style={styles.chartGradient} />
            <View style={styles.chartBars}>
              {data.trend.map((point) => (
                <View key={point.label} style={styles.barBlock}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: Math.max(14, chartWidth / Math.max(data.trend.length * 1.8, 1)),
                        height: Math.max(12, (point.revenue / maxRevenue) * 108),
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{point.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.healthRow}>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>REFUND RATE</Text>
            <Text style={styles.healthValue}>{data.health.refundRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>FAILURE RATE</Text>
            <Text style={styles.healthValue}>{data.health.failureRate.toFixed(1)}%</Text>
          </View>
        </View>

        <View
          style={[
            styles.alertBanner,
            {
              backgroundColor:
                data.health.alertSeverity === 'critical' ? '#f9068010' : '#F2C94C18',
              borderLeftColor:
                data.health.alertSeverity === 'critical' ? theme.colors.primary : theme.colors.warning,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={data.health.alertSeverity === 'critical' ? 'alert-decagram' : 'alert-circle-outline'}
            size={24}
            color={data.health.alertSeverity === 'critical' ? theme.colors.primary : theme.colors.warning}
          />
          <View style={styles.alertContent}>
            <Text
              style={[
                styles.alertTitle,
                {
                  color: data.health.alertSeverity === 'critical' ? theme.colors.primary : theme.colors.warning,
                },
              ]}
            >
              {data.health.alertTitle}
            </Text>
            <Text style={styles.alertMessage}>{data.health.alertMessage}</Text>
          </View>
        </View>

        <View style={styles.streamCard}>
          <Text style={styles.sectionTitle}>Live Transaction Stream</Text>
          <View style={styles.streamList}>
            {filteredTransactions.length ? (
              filteredTransactions.map((item) => (
                <TransactionRow
                  key={item.id}
                  movie={item.movie}
                  time={item.time}
                  customer={item.customer}
                  amount={formatMoney(item.amount)}
                  status={item.status}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No transactions match this search.</Text>
            )}
          </View>
        </View>

        <View style={styles.performersCard}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          {filteredPerformers.length ? (
            filteredPerformers.map((item, index) => (
              <View key={item.id} style={styles.performerItem}>
                <View style={styles.performerInfo}>
                  <View style={styles.performerRank}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.performerName}>{item.name}</Text>
                </View>
                <Text style={styles.performerValue}>{formatMoney(item.revenue)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No performers match this search.</Text>
          )}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.colors.warning} />
            <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquare: {
    width: 36,
    height: 36,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 1,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    marginLeft: 10,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  kpiScroll: {
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  kpiCard: {
    width: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    marginRight: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  kpiTitle: {
    color: '#666',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 8,
  },
  kpiValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    marginLeft: 4,
  },
  kpiIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
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
    backgroundColor: theme.colors.surfaceLight,
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
    color: '#666',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  chartArea: {
    minHeight: 150,
    justifyContent: 'flex-end',
  },
  chartGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingTop: 14,
  },
  barBlock: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    backgroundColor: '#f9068020',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  barLabel: {
    color: '#8c8192',
    fontSize: 9,
    fontFamily: theme.typography.fontFamilies.medium,
    marginTop: 8,
  },
  healthRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  healthCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 15,
  },
  healthLabel: {
    color: '#666',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 5,
  },
  healthValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  alertBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 15,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertContent: {
    marginLeft: 15,
    flex: 1,
  },
  alertTitle: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 2,
  },
  alertMessage: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  streamCard: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },
  streamList: {
    marginTop: 15,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  txMainInfo: {
    flex: 1,
  },
  txMovie: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  txCustomer: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
    fontFamily: theme.typography.fontFamilies.regular,
  },
  txMetaInfo: {
    alignItems: 'flex-end',
    marginRight: 15,
  },
  txTime: {
    color: '#aaa',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  txAmount: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  performersCard: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    padding: 20,
  },
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  performerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  performerRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  performerName: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  performerValue: {
    color: theme.colors.success,
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  emptyText: {
    color: '#8c8192',
    fontSize: 13,
    fontFamily: theme.typography.fontFamilies.medium,
    marginTop: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#221a12',
    borderWidth: 1,
    borderColor: '#4a3920',
  },
  errorText: {
    flex: 1,
    color: '#d8b36b',
    fontSize: 12,
    fontFamily: theme.typography.fontFamilies.medium,
  },
  bottomSpacer: {
    height: 100,
  },
});
