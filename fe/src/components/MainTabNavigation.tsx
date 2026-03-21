import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

export type MainTabName = 'Home' | 'Cinemas' | 'Bookings' | 'Profile';

interface MainTabNavigationProps {
  activeTab?: MainTabName;
  onTabPress: (tabName: MainTabName) => void;
}

const tabs: Array<{ name: MainTabName; label: string; icon: string }> = [
  { name: 'Home', label: 'Home', icon: 'home-variant-outline' },
  { name: 'Cinemas', label: 'Cinemas', icon: 'movie-open-outline' },
  { name: 'Bookings', label: 'Bookings', icon: 'ticket-confirmation-outline' },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline' },
];

export const MainTabNavigation: React.FC<MainTabNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { isAuthenticated } = useAuthStore();
  const visibleTabs = isAuthenticated
    ? tabs
    : tabs.filter((tab) => tab.name !== 'Bookings');

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {visibleTabs.map((tab) => {
          const isActive = tab.name === activeTab;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => onTabPress(tab.name)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={24}
                color={isActive ? '#f90680' : '#8c8192'}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f0a12',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a141e',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  label: {
    color: '#8c8192',
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: '#f90680',
  },
});
