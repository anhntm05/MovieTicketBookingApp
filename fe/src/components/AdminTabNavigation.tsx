import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type AdminTabName = 'Dashboard' | 'Users' | 'Cinemas' | 'Profile';

interface AdminTabNavigationProps {
  activeTab?: AdminTabName;
  onTabPress: (tabName: AdminTabName) => void;
}

const tabs: Array<{
  name: AdminTabName;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}> = [
  { name: 'Dashboard', label: 'Overview', icon: 'view-dashboard-outline' },
  { name: 'Users', label: 'Users', icon: 'account-group-outline' },
  { name: 'Cinemas', label: 'Cinemas', icon: 'movie-open-settings-outline' },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline' },
];

export const AdminTabNavigation: React.FC<AdminTabNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = tab.name === activeTab;

          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onTabPress(tab.name)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={22}
                color={isActive ? '#fff' : '#8c8192'}
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
    backgroundColor: '#110c14',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1a141e',
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
    paddingVertical: 8,
    borderRadius: 18,
  },
  tabButtonActive: {
    backgroundColor: '#f90680',
  },
  label: {
    color: '#8c8192',
    fontSize: 10,
    fontWeight: '700',
  },
  labelActive: {
    color: '#fff',
  },
});
