import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminTabParamList } from '../types/navigation';
import { ProfileScreen } from '../screens/auth/ProfileScreen';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { CinemaConfigScreen } from '../screens/admin/CinemaConfigScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Cinemas" component={CinemaConfigScreen as any} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
