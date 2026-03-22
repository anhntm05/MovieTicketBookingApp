import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { resolveMediaUrl, unwrapApiData } from '../../api/transformers';
import { AdminUserStackParamList } from '../../types/navigation';

const { width } = Dimensions.get('window');

type CustomerDetailResponse = {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
    memberSince: string;
    tierLabel: string;
  };
  stats: {
    totalSpent: number;
    totalBookings: number;
    cancellationRate: number;
    commentCount: number;
  };
  recentBookings: Array<{
    id: string;
    title: string;
    date: string;
    hall: string;
    status: 'CONFIRMED' | 'CANCELLED' | 'PENDING_PAYMENT' | 'EXPIRED';
    posterUrl?: string;
  }>;
  latestFeedback?: {
    id: string;
    movieTitle: string;
    rating: number;
    content: string;
    createdAt: string;
  };
  spendingTrend: Array<{ label: string; amount: number }>;
  loyalty: {
    tierLabel: string;
    progressPercent: number;
    frequencyPerMonth: number;
    averageTicketValue: number;
  };
};

const formatMoney = (value: number) => `$${value.toLocaleString('en-US', { maximumFractionDigits: value % 1 ? 2 : 0 })}`;
const formatPct = (value: number) => `${value.toFixed(1)}%`;
const formatJoined = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
const formatBookingDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatFeedbackTime = (value: string) => {
  const diffDays = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)));
  return diffDays === 0 ? 'TODAY' : diffDays === 1 ? '1 DAY AGO' : `${diffDays} DAYS AGO`;
};
const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
const getStatusColor = (status: CustomerDetailResponse['user']['status']) =>
  status === 'ACTIVE' ? '#03DAC6' : status === 'BLOCKED' ? '#f90680' : '#F2C94C';

const StatCard = ({
  label,
  value,
  subtext,
  color,
  icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  color: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{label}</Text>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {subtext ? (
      <View style={styles.subtextRow}>
        <MaterialCommunityIcons name="trending-up" size={12} color="#03DAC6" />
        <Text style={styles.subtext}>{subtext}</Text>
      </View>
    ) : null}
    <View style={[styles.indicator, { backgroundColor: color }]} />
  </View>
);

const BookingItem = ({
  title,
  date,
  status,
  hall,
  image,
}: CustomerDetailResponse['recentBookings'][number] & { image?: string }) => (
  <View style={styles.bookingItem}>
    {image ? <Image source={{ uri: resolveMediaUrl(image) }} style={styles.movieThumb} /> : <View style={styles.movieThumbFallback} />}
    <View style={styles.bookingInfo}>
      <Text style={styles.bookingTitle}>{title}</Text>
      <Text style={styles.bookingMeta}>
        {formatBookingDate(date)} • {hall}
      </Text>
    </View>
    <View style={[styles.statusBadge, { backgroundColor: status === 'CONFIRMED' ? '#03DAC620' : '#f9068020' }]}>
      <Text style={[styles.statusText, { color: status === 'CONFIRMED' ? '#03DAC6' : '#f90680' }]}>{status}</Text>
    </View>
  </View>
);

export const AdminCustomerDetailScreen = () => {
  const route = useRoute<RouteProp<AdminUserStackParamList, 'AdminCustomerDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AdminUserStackParamList, 'AdminCustomerDetail'>>();
  const queryClient = useQueryClient();
  const { userId } = route.params;
  const { data, error, isLoading, isRefetching, refetch } = useQuery<CustomerDetailResponse>({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => unwrapApiData<CustomerDetailResponse>(await apiClient.get(`/admin/users/${userId}/detail`)),
  });

  const roleMutation = useMutation({
    mutationFn: async (role: CustomerDetailResponse['user']['role']) =>
      apiClient.patch(`/admin/users/${userId}/role`, { role: role.toLowerCase() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-analytics'] });
    },
    onError: (err: any) => Alert.alert('Unable to update role', err?.response?.data?.message || err?.message || 'Please try again.'),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: 'active' | 'inactive' | 'blocked') => apiClient.patch(`/admin/users/${userId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-analytics'] });
    },
    onError: (err: any) =>
      Alert.alert('Unable to update status', err?.response?.data?.message || err?.message || 'Please try again.'),
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f90680" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{(error as any)?.response?.data?.message || 'Unable to load customer details.'}</Text>
      </View>
    );
  }

  const barMax = Math.max(1, ...data.spendingTrend.map((point) => point.amount));
  const statusColor = getStatusColor(data.user.status);
  const deactivateLabel = data.user.status === 'INACTIVE' ? 'Activate Account' : 'Deactivate Account';
  const banLabel = data.user.status === 'BLOCKED' ? 'Restore Access' : 'Ban User';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CUSTOMER INSIGHTS</Text>
        <TouchableOpacity style={styles.moreButton} onPress={() => refetch()}>
          {isRefetching ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="refresh" size={22} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.userHero}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={['#2a0f22', '#110c14']} style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(data.user.fullName)}</Text>
            </LinearGradient>
            <View style={[styles.onlineStatus, { backgroundColor: statusColor }]} />
          </View>
          <Text style={styles.userName}>{data.user.fullName}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{data.user.tierLabel}</Text>
          </View>
          <Text style={styles.userEmail}>{data.user.email}</Text>
          <Text style={styles.joinDate}>MEMBER SINCE {formatJoined(data.user.memberSince)}</Text>

          <View style={styles.heroActions}>
            <View style={[styles.editBtn, styles.statusHeroBtn, { borderColor: `${statusColor}55` }]}>
              <Text style={[styles.editBtnText, { color: statusColor }]}>{data.user.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.gridRow}>
          <StatCard label="TOTAL SPENT" value={formatMoney(data.stats.totalSpent)} subtext="Revenue contribution" icon="currency-usd" color="#00E5FF" />
          <StatCard label="TOTAL BOOKINGS" value={`${data.stats.totalBookings}`} subtext="Lifetime activity" icon="ticket-confirmation" color="#f90680" />
        </View>
        <View style={styles.gridRow}>
          <StatCard label="CANCELLATION RATE" value={formatPct(data.stats.cancellationRate)} subtext="Booking reliability" icon="close-circle-outline" color="#9C27B0" />
          <StatCard label="COMMENT COUNT" value={`${data.stats.commentCount}`} subtext="Community engagement" icon="comment-text-outline" color="#03DAC6" />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="history" size={20} color="#f90680" />
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
          </View>
          {data.recentBookings.length ? data.recentBookings.map((booking) => <BookingItem key={booking.id} {...booking} image={booking.posterUrl} />) : <Text style={styles.emptyText}>No bookings yet.</Text>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chat-outline" size={20} color="#f90680" />
            <Text style={styles.sectionTitle}>Latest Feedback</Text>
          </View>
          {data.latestFeedback ? (
            <View style={styles.feedbackCard}>
              <View style={styles.starRow}>
                <View style={styles.starList}>
                  {Array.from({ length: data.latestFeedback.rating }).map((_, index) => (
                    <MaterialCommunityIcons key={index} name="star" size={14} color="#f90680" />
                  ))}
                </View>
                <Text style={styles.feedbackTime}>{formatFeedbackTime(data.latestFeedback.createdAt)}</Text>
              </View>
              <Text style={styles.feedbackText}>"{data.latestFeedback.content}"</Text>
              <Text style={styles.feedbackMovie}>{data.latestFeedback.movieTitle}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No approved feedback yet.</Text>
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>SPENDING TREND</Text>
          <View style={styles.chartArea}>
            {data.spendingTrend.map((point) => (
              <View key={point.label} style={styles.chartCol}>
                <View style={[styles.chartBar, { height: Math.max(14, (point.amount / barMax) * 90) }, point.amount === barMax && styles.activeBar]} />
                <Text style={styles.chartMonth}>{point.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.loyaltyCard}>
          <Text style={styles.loyaltyLabel}>LOYALTY TIER PROGRESS</Text>
          <View style={styles.loyaltyHeader}>
            <Text style={styles.loyaltyValue}>{data.loyalty.tierLabel}</Text>
            <Text style={styles.loyaltyPercent}>{Math.round(data.loyalty.progressPercent)}%</Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient colors={['#00E5FF', '#f90680']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${data.loyalty.progressPercent}%` }]} />
          </View>
          <View style={styles.loyaltyMetrics}>
            <View>
              <Text style={styles.lMetricLabel}>FREQUENCY</Text>
              <Text style={styles.lMetricValue}>{data.loyalty.frequencyPerMonth.toFixed(1)} / mo</Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.lMetricLabel}>AVG TICKET</Text>
              <Text style={styles.lMetricValue}>{formatMoney(data.loyalty.averageTicketValue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.roleCard}>
          <Text style={styles.roleTitle}>ACCESS ROLE</Text>
          <View style={styles.roleRow}>
            {(['CUSTOMER', 'STAFF', 'ADMIN'] as const).map((role) => {
              const isActive = data.user.role === role;
              return (
                <TouchableOpacity key={role} style={[styles.roleChip, isActive && styles.roleChipActive]} disabled={isActive || roleMutation.isPending} onPress={() => roleMutation.mutate(role)}>
                  <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>{role}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionBtn} disabled={statusMutation.isPending} onPress={() => statusMutation.mutate(data.user.status === 'INACTIVE' ? 'active' : 'inactive')}>
            <MaterialCommunityIcons name="account-cancel-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>{deactivateLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} disabled={statusMutation.isPending} onPress={() => statusMutation.mutate(data.user.status === 'BLOCKED' ? 'active' : 'blocked')}>
            <MaterialCommunityIcons name="gavel" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>{banLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0a12' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0a12' },
  errorText: { color: '#fff', textAlign: 'center', paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#1a141e', justifyContent: 'center', alignItems: 'center' },
  moreButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#1a141e', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20 },
  userHero: { alignItems: 'center', marginVertical: 20 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 30, borderWidth: 2, borderColor: '#f90680', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  onlineStatus: { position: 'absolute', bottom: 5, right: 5, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#0f0a12' },
  userName: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  tierBadge: { backgroundColor: '#f9068020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginVertical: 8 },
  tierText: { color: '#f90680', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  userEmail: { color: '#666', fontSize: 14, marginBottom: 5 },
  joinDate: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  heroActions: { flexDirection: 'row', marginTop: 25 },
  editBtn: { width: (width - 60) / 2, height: 50, backgroundColor: '#1a141e', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statusHeroBtn: { width: width - 40 },
  editBtnText: { fontWeight: 'bold' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { width: (width - 55) / 2, backgroundColor: '#1a141e', borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden' },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statLabel: { color: '#666', fontSize: 8, fontWeight: 'bold', letterSpacing: 0.5 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  subtext: { color: '#03DAC6', fontSize: 8, fontWeight: 'bold', marginLeft: 4 },
  indicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  section: { marginVertical: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  bookingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a141e', padding: 12, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#251d2a' },
  movieThumb: { width: 50, height: 70, borderRadius: 8 },
  movieThumbFallback: { width: 50, height: 70, borderRadius: 8, backgroundColor: '#251d2a' },
  bookingInfo: { flex: 1, marginLeft: 15 },
  bookingTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  bookingMeta: { color: '#666', fontSize: 11, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: 'bold' },
  feedbackCard: { backgroundColor: '#1a141e', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#251d2a' },
  starRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  starList: { flexDirection: 'row', gap: 2 },
  feedbackTime: { color: '#666', fontSize: 9, fontWeight: 'bold' },
  feedbackText: { color: '#aaa', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  feedbackMovie: { color: '#f90680', fontSize: 10, fontWeight: 'bold', marginTop: 15 },
  chartCard: { backgroundColor: '#1a141e', padding: 20, borderRadius: 25, marginVertical: 15, borderWidth: 1, borderColor: '#251d2a' },
  chartTitle: { color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 20 },
  chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  chartCol: { alignItems: 'center' },
  chartBar: { width: 30, backgroundColor: '#f9068030', borderRadius: 4, borderWidth: 1, borderColor: '#f9068050' },
  activeBar: { backgroundColor: '#f90680' },
  chartMonth: { color: '#666', fontSize: 8, fontWeight: 'bold', marginTop: 10 },
  loyaltyCard: { backgroundColor: '#1a141e', padding: 25, borderRadius: 30, marginBottom: 20 },
  loyaltyLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15 },
  loyaltyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  loyaltyValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  loyaltyPercent: { color: '#00E5FF', fontSize: 14, fontWeight: 'bold' },
  progressBg: { height: 6, backgroundColor: '#0f0a12', borderRadius: 3, marginBottom: 25 },
  progressFill: { height: '100%', borderRadius: 3 },
  loyaltyMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  lMetricLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', marginBottom: 5 },
  lMetricValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  metricRight: { alignItems: 'flex-end' },
  roleCard: { backgroundColor: '#1a141e', borderRadius: 24, padding: 18, marginBottom: 20 },
  roleTitle: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 14 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#140f16', borderWidth: 1, borderColor: '#251d2a' },
  roleChipActive: { borderColor: '#f90680', backgroundColor: '#f9068015' },
  roleChipText: { color: '#aaa', fontSize: 11, fontWeight: '700' },
  roleChipTextActive: { color: '#f90680' },
  actionsSection: { gap: 12, marginVertical: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, backgroundColor: '#1a141e', borderRadius: 15, borderWidth: 1, borderColor: '#251d2a' },
  dangerBtn: { backgroundColor: '#f9068010', borderColor: '#f9068030' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 12 },
  emptyText: { color: '#777', fontSize: 13 },
  bottomSpacer: { height: 100 },
});
