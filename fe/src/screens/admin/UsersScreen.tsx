import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { theme } from '../../constants/theme';
import { unwrapApiData } from '../../api/transformers';

const { width } = Dimensions.get('window');

type DirectoryUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
};

type SelectedUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  totalSpent: number;
  tickets: number;
  favoriteCinema: string;
  recentPurchases: Array<{
    id: string;
    title: string;
    date: string;
    price: number;
  }>;
};

type UserAnalyticsResponse = {
  summary: {
    totalUsers: number;
    totalUsersChange: number;
    activeUsers: number;
    activeUserRate: number;
    totalPurchasers: number;
    purchaserRate: number;
    userGrowthRate: number;
  };
  directory: DirectoryUser[];
  selectedUser?: SelectedUser;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const formatCompact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
};

const formatMoney = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
};

const formatChange = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

const formatPurchaseDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

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

  return 'Unable to load users.';
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
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.kpiTitle}>{title}</Text>
    </View>
    <Text style={styles.kpiValue}>{value}</Text>
    {change ? (
      <View style={styles.changeRow}>
        <MaterialCommunityIcons name="trending-up" size={14} color="#03DAC6" />
        <Text style={styles.changeText}>{change} THIS MONTH</Text>
      </View>
    ) : null}
    <View style={[styles.indicator, { backgroundColor: color }]} />
  </View>
);

const AvatarCircle = ({ name, large = false }: { name: string; large?: boolean }) => (
  <View style={[large ? styles.userAvatarLargePlaceholder : styles.rowAvatar, styles.avatarCircle]}>
    <Text style={large ? styles.avatarInitialLarge : styles.avatarInitial}>{getInitials(name)}</Text>
  </View>
);

const UserRow = ({
  user,
  isSelected,
  onPress,
}: {
  user: DirectoryUser;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity style={[styles.userRow, isSelected && styles.userRowActive]} activeOpacity={0.88} onPress={onPress}>
    <AvatarCircle name={user.fullName} />
    <View style={styles.rowInfo}>
      <Text style={styles.rowName}>{user.fullName}</Text>
      <Text style={styles.rowEmail}>{user.email}</Text>
    </View>
    <View style={[styles.statusBadge, { backgroundColor: user.status === 'ACTIVE' ? '#03DAC620' : '#f9068020' }]}>
      <Text style={[styles.statusText, { color: user.status === 'ACTIVE' ? '#03DAC6' : '#f90680' }]}>{user.status}</Text>
    </View>
  </TouchableOpacity>
);

export const UsersScreen = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    setSelectedUserId(null);
  }, [deferredSearchQuery]);

  const { data, error, isLoading, isRefetching, refetch } = useQuery<UserAnalyticsResponse>({
    queryKey: ['admin-users-analytics', deferredSearchQuery, page, selectedUserId],
    queryFn: async () =>
      unwrapApiData<UserAnalyticsResponse>(
        await apiClient.get('/admin/users/analytics', {
          params: {
            page,
            limit: 10,
            search: deferredSearchQuery || undefined,
            userId: selectedUserId || undefined,
          },
        })
      ),
  });

  useEffect(() => {
    if (!selectedUserId && data?.directory.length) {
      setSelectedUserId(data.directory[0].id);
    }
  }, [data?.directory, selectedUserId]);

  const selectedUser = data?.selectedUser;
  const pagination = data?.pagination;

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: DirectoryUser['role'] }) =>
      apiClient.patch(`/admin/users/${id}/role`, { role: role.toLowerCase() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users-analytics'] }),
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to update role'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'blocked' }) =>
      apiClient.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users-analytics'] }),
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to update user status'),
  });

  const pageNumbers = useMemo(() => {
    if (!pagination) return [];
    if (pagination.pages <= 2) return Array.from({ length: pagination.pages }, (_, index) => index + 1);
    return [pagination.page, Math.min(pagination.page + 1, pagination.pages)].filter(
      (value, index, array) => value >= 1 && array.indexOf(value) === index
    );
  }, [pagination]);

  if (isLoading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f90680" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <MaterialCommunityIcons name="shield-account" size={28} color="#f90680" />
          <Text style={styles.headerTitle}>USER MANAGEMENT</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} activeOpacity={0.85} onPress={() => refetch()}>
          <View style={styles.profileIconPlaceholder}>
            {isRefetching ? <ActivityIndicator size="small" color="#f90680" /> : null}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <KPICard
            title="TOTAL USERS"
            value={formatCompact(data?.summary.totalUsers || 0)}
            change={formatChange(data?.summary.totalUsersChange || 0)}
            icon="account-group"
            color="#00E5FF"
          />
          <KPICard
            title="ACTIVE USERS"
            value={formatCompact(data?.summary.activeUsers || 0)}
            change={`${(data?.summary.activeUserRate || 0).toFixed(1)}%`}
            icon="flash"
            color="#f90680"
          />
        </View>
        <View style={styles.statsGrid}>
          <KPICard
            title="TOTAL PURCHASERS"
            value={formatCompact(data?.summary.totalPurchasers || 0)}
            change={`${(data?.summary.purchaserRate || 0).toFixed(1)}%`}
            icon="cart"
            color="#9C27B0"
          />
          <KPICard
            title="USER GROWTH"
            value={formatChange(data?.summary.userGrowthRate || 0)}
            change="PEAK"
            icon="trending-up"
            color="#03DAC6"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Directory</Text>
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Search by name or email..."
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.directoryCard}>
          <View style={styles.directoryHeader}>
            <Text style={styles.colLabel}>USER</Text>
            <Text style={styles.colLabel}>STATUS</Text>
          </View>
          {(data?.directory || []).map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelected={selectedUserId === user.id}
              onPress={() => setSelectedUserId(user.id)}
            />
          ))}

          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              SHOWING {pagination ? (pagination.page - 1) * pagination.limit + 1 : 0}-
              {pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0} OF {pagination?.total || 0}
            </Text>
            <View style={styles.pageBtns}>
              <TouchableOpacity
                style={styles.pageBtn}
                activeOpacity={0.85}
                disabled={!pagination || pagination.page <= 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color="#666" />
              </TouchableOpacity>
              {pageNumbers.map((pageNumber) => (
                <TouchableOpacity
                  key={pageNumber}
                  style={[styles.pageBtn, pagination?.page === pageNumber && styles.activePageBtn]}
                  activeOpacity={0.85}
                  onPress={() => setPage(pageNumber)}
                >
                  <Text style={pagination?.page === pageNumber ? styles.activePageText : styles.pageText}>{pageNumber}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pageBtn}
                activeOpacity={0.85}
                disabled={!pagination || pagination.page >= pagination.pages}
                onPress={() => setPage((current) => Math.min(pagination?.pages || current, current + 1))}
              >
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {selectedUser ? (
          <View style={styles.userDetailCard}>
            <View style={styles.userHero}>
              <AvatarCircle name={selectedUser.fullName} large />
              <View style={styles.userHeroInfo}>
                <Text style={styles.userHeroName}>{selectedUser.fullName}</Text>
                <View style={styles.userHeroEmailRow}>
                  <MaterialCommunityIcons name="email-outline" size={14} color="#666" />
                  <Text style={styles.userHeroEmail}>{selectedUser.email}</Text>
                </View>
              </View>
            </View>

            <View style={styles.userStatsRow}>
              <View style={styles.userStatItem}>
                <Text style={styles.userStatLabel}>TOTAL SPENT</Text>
                <Text style={styles.userStatValue}>{formatMoney(selectedUser.totalSpent)}</Text>
              </View>
              <View style={styles.userStatItem}>
                <Text style={styles.userStatLabel}>TICKETS</Text>
                <Text style={styles.userStatValue}>{selectedUser.tickets}</Text>
              </View>
            </View>

            <View style={styles.prefSection}>
              <Text style={styles.prefLabel}>FAVORITE CINEMA</Text>
              <Text style={styles.prefValue}>{selectedUser.favoriteCinema}</Text>
            </View>

            <Text style={styles.subSectionTitle}>RECENT PURCHASES</Text>
            <View style={styles.purchaseList}>
              {selectedUser.recentPurchases.length ? (
                selectedUser.recentPurchases.map((item) => (
                  <View key={item.id} style={styles.purchaseItem}>
                    <View>
                      <Text style={styles.purchaseTitle}>{item.title}</Text>
                      <Text style={styles.purchaseDate}>{formatPurchaseDate(item.date)}</Text>
                    </View>
                    <Text style={styles.purchasePrice}>{formatMoney(item.price)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyPurchasesText}>No completed purchases yet.</Text>
              )}
            </View>

            <View style={styles.rolePicker}>
              <Text style={styles.rolePickerText}>Change Role</Text>
              <View style={styles.roleChipRow}>
                {(['CUSTOMER', 'STAFF', 'ADMIN'] as const).map((role) => {
                  const isActive = selectedUser.role === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleChip, isActive && styles.roleChipActive]}
                      activeOpacity={0.85}
                      disabled={isActive || roleMutation.isPending}
                      onPress={() => roleMutation.mutate({ id: selectedUser.id, role })}
                    >
                      <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>{role}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.banBtn, selectedUser.status === 'BLOCKED' && styles.unbanBtn]}
              activeOpacity={0.88}
              disabled={statusMutation.isPending}
              onPress={() =>
                statusMutation.mutate({
                  id: selectedUser.id,
                  status: selectedUser.status === 'BLOCKED' ? 'active' : 'blocked',
                })
              }
            >
              <Text style={[styles.banBtnText, selectedUser.status === 'BLOCKED' && styles.unbanBtnText]}>
                {selectedUser.status === 'BLOCKED' ? 'ACTIVATE USER ACCOUNT' : 'DEACTIVATE USER ACCOUNT'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
  container: { flex: 1, backgroundColor: '#0f0a12' },
  centerContainer: { flex: 1, backgroundColor: '#0f0a12', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#f90680', fontSize: 16, fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },
  profileBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1a141e', justifyContent: 'center', alignItems: 'center' },
  profileIconPlaceholder: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f9068030', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  kpiCard: { width: (width - 55) / 2, backgroundColor: '#1a141e', borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden' },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  kpiTitle: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  kpiValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  changeText: { color: '#03DAC6', fontSize: 8, fontWeight: 'bold', marginLeft: 4 },
  indicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  sectionHeader: { marginTop: 15, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a141e', borderRadius: 15, paddingHorizontal: 15, height: 50, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff' },
  directoryCard: { backgroundColor: '#1a141e', borderRadius: 25, padding: 15, marginBottom: 30 },
  directoryHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 15 },
  colLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#251d2a', paddingHorizontal: 10, borderRadius: 16 },
  userRowActive: { backgroundColor: '#120d15' },
  rowAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  avatarCircle: { backgroundColor: '#f9068020', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 12, fontWeight: '700' },
  avatarInitialLarge: { color: '#fff', fontSize: 22, fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  rowEmail: { color: '#666', fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingHorizontal: 10, gap: 12 },
  paginationText: { color: '#666', fontSize: 10, fontWeight: 'bold', flex: 1 },
  pageBtns: { flexDirection: 'row', gap: 8 },
  pageBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0f0a12', justifyContent: 'center', alignItems: 'center' },
  activePageBtn: { backgroundColor: '#f90680' },
  activePageText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  pageText: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  userDetailCard: { backgroundColor: '#1a141e', borderRadius: 30, padding: 25 },
  userHero: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  userAvatarLargePlaceholder: { width: 64, height: 64, borderRadius: 15 },
  userHeroInfo: { marginLeft: 20, flex: 1 },
  userHeroName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userHeroEmailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  userHeroEmail: { color: '#666', fontSize: 14, marginLeft: 6 },
  userStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  userStatItem: { flex: 1, backgroundColor: '#0f0a12', padding: 15, borderRadius: 15, marginRight: 10 },
  userStatLabel: { color: '#f90680', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  userStatValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  prefSection: { backgroundColor: '#0f0a12', padding: 15, borderRadius: 15, marginBottom: 25 },
  prefLabel: { color: '#03DAC6', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  prefValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subSectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  purchaseList: { marginBottom: 30 },
  purchaseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#251d2a' },
  purchaseTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  purchaseDate: { color: '#666', fontSize: 12, marginTop: 2 },
  purchasePrice: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  emptyPurchasesText: { color: '#777', fontSize: 12 },
  rolePicker: { backgroundColor: '#0f0a12', padding: 18, borderRadius: 15, marginBottom: 20 },
  rolePickerText: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 14 },
  roleChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#17111b', borderWidth: 1, borderColor: '#251d2a' },
  roleChipActive: { borderColor: '#f90680', backgroundColor: '#f9068015' },
  roleChipText: { color: '#aaa', fontSize: 11, fontWeight: '700' },
  roleChipTextActive: { color: '#f90680' },
  banBtn: { backgroundColor: '#f9068020', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f9068050' },
  unbanBtn: { backgroundColor: '#03DAC620', borderColor: '#03DAC650' },
  banBtnText: { color: '#f90680', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  unbanBtnText: { color: '#03DAC6' },
  errorBanner: { marginTop: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a141e', borderRadius: 14, padding: 14, gap: 10 },
  errorText: { color: '#fff', flex: 1 },
  bottomSpacer: { height: 100 },
});
