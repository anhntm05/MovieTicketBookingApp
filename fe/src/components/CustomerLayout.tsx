import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';
import { normalizeNotification, unwrapApiData } from '../api/transformers';
import { Notification } from '../types/models';
import { MainTabName, MainTabNavigation } from './MainTabNavigation';
import { useAuthStore } from '../store/authStore';

interface CustomerLayoutProps {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

const customerTabs: MainTabName[] = ['Home', 'Cinemas', 'Bookings', 'Profile'];

const isMainTab = (routeName?: string): routeName is MainTabName =>
  customerTabs.includes(routeName as MainTabName);

const findActiveTab = (state: any): MainTabName => {
  if (!state?.routes?.length) return 'Home';

  const activeRoute = state.routes[state.index ?? 0];
  if (isMainTab(activeRoute?.name)) {
    return activeRoute.name;
  }

  const customerMainRoute = state.routes.find((route: any) => route.name === 'CustomerMain');
  if (customerMainRoute?.state) {
    return findActiveTab(customerMainRoute.state);
  }

  if (activeRoute?.state) {
    return findActiveTab(activeRoute.state);
  }

  return 'Home';
};

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  contentStyle,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { isAuthenticated } = useAuthStore();
  const activeTab = isMainTab(route.name) ? route.name : findActiveTab(navigation.getState());

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['layout-notifications'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/notifications/me?limit=20'));
      return data.map(normalizeNotification);
    },
  });

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const handleTabPress = (tabName: MainTabName) => {
    navigation.navigate('CustomerMain', { screen: tabName });
  };

  const handleOpenNotifications = () => {
    navigation.navigate('Notifications');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      {isAuthenticated ? (
        <TouchableOpacity
          style={styles.notificationButton}
          activeOpacity={0.9}
          onPress={handleOpenNotifications}
        >
          <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
          {unreadCount > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}
      <MainTabNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0a12',
  },
  content: {
    flex: 1,
  },
  notificationButton: {
    position: 'absolute',
    right: 22,
    bottom: 98,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f90680',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f90680',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f0a12',
  },
  notificationBadgeText: {
    color: '#f90680',
    fontSize: 10,
    fontWeight: '700',
  },
});
