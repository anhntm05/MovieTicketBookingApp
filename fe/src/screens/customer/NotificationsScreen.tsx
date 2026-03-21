import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeNotification, unwrapApiData } from '../../api/transformers';
import { Notification } from '../../types/models';
import { CustomerStackParamList } from '../../types/navigation';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { socketService } from '../../services/socket';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Notifications'>;
type NotificationTab = 'All' | 'Bookings' | 'Social';

const tabs: NotificationTab[] = ['All', 'Bookings', 'Social'];
const avatarFallback =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100';

const filterMap: Record<NotificationTab, 'all' | 'bookings' | 'social'> = {
  All: 'all',
  Bookings: 'bookings',
  Social: 'social',
};

const formatRelativeTime = (value?: string) => {
  if (!value) return '';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diffMinutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}M AGO`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}H AGO`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}D AGO`;
};

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<NotificationTab>('All');

  const { data: notifications = [], isLoading, isRefetching, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications', activeTab],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(
        await apiClient.get(`/notifications/me?filter=${filterMap[activeTab]}&limit=50`)
      );
      return data.map(normalizeNotification);
    },
  });

  React.useEffect(() => {
    if (!user?.id) {
      return;
    }

    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socketService.connect();
    socketService.joinNotifications(user.id);
    socketService.on('notifications:new', handleRefresh);
    socketService.on('notifications:read', handleRefresh);
    socketService.on('notifications:read-all', handleRefresh);

    return () => {
      socketService.off('notifications:new', handleRefresh);
      socketService.off('notifications:read', handleRefresh);
      socketService.off('notifications:read-all', handleRefresh);
      socketService.leaveNotifications(user.id);
      socketService.disconnect();
    };
  }, [queryClient, user?.id]);

  const markAsRead = async (notificationId: string, unread: boolean) => {
    if (!unread) {
      return;
    }

    await apiClient.patch(`/notifications/${notificationId}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not update notifications');
    }
  };

  const renderIcon = (item: Notification) => {
    if (item.type === 'COMMENT') {
      return (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.actorAvatarUrl || avatarFallback }} style={styles.avatar} />
          <View style={styles.commentBadge}>
            <MaterialCommunityIcons name="chat" size={10} color="#fff" />
          </View>
        </View>
      );
    }

    let bgColor = 'rgba(249, 6, 128, 0.1)';
    let iconColor = theme.colors.primary;
    let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] = 'ticket-percent-outline';

    if (item.type === 'BOOKING_CONFIRM') {
      bgColor = 'rgba(3, 218, 198, 0.1)';
      iconColor = '#03DAC6';
      iconName = 'check-circle-outline';
    } else if (item.type === 'BOOKING_CANCEL') {
      bgColor = 'rgba(255, 255, 255, 0.05)';
      iconColor = theme.colors.textSecondary;
      iconName = 'close-circle-outline';
    }

    return (
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
      </View>
    );
  };

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerAction} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.headerAction} activeOpacity={0.85} onPress={markAllAsRead}>
          <MaterialCommunityIcons
            name="dots-horizontal-circle-outline"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)} activeOpacity={0.85}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            {activeTab === tab ? <View style={styles.activeIndicator} /> : null}
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
        {notifications.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.notificationCard, item.unread && styles.unreadCard]}
            activeOpacity={0.9}
            onPress={() => markAsRead(item.id, item.unread)}
          >
            {renderIcon(item)}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}{' '}
                  {item.movieTitle ? <Text style={styles.movieText}>{item.movieTitle}</Text> : null}
                </Text>
                <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
              </View>
              <Text
                style={[styles.message, item.type === 'COMMENT' && styles.commentText]}
                numberOfLines={2}
              >
                {item.message}
              </Text>
            </View>
            {item.unread ? <View style={styles.unreadBadge} /> : null}
          </TouchableOpacity>
        ))}

        {!notifications.length ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-outline" size={42} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>New updates about bookings and comments will show up here.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0a12',
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
  headerAction: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...theme.typography.pageTitle,
    color: '#fff',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a141e',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 30,
    position: 'relative',
  },
  tabText: {
    color: '#666',
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: 16,
  },
  activeTabText: {
    color: '#f90680',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#f90680',
    borderRadius: 3,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a141e',
    alignItems: 'flex-start',
  },
  unreadCard: {
    backgroundColor: 'rgba(249, 6, 128, 0.02)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  commentBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#f90680',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f0a12',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontFamily: theme.typography.fontFamilies.bold,
    flex: 1,
    marginRight: 8,
  },
  movieText: {
    fontStyle: 'italic',
    color: '#aaa',
  },
  timeText: {
    color: '#666',
    fontSize: 10,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  message: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
  },
  commentText: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#f90680',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f90680',
    marginLeft: 10,
    marginTop: 6,
  },
  emptyState: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamilies.bold,
    marginTop: 12,
  },
  emptyText: {
    color: '#aaa',
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default NotificationsScreen;
