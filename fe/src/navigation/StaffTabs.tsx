import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StaffTabParamList } from '../types/navigation';
import { ProfileScreen } from '../screens/auth/ProfileScreen';
import { MoviesScreen } from '../screens/staff/MoviesScreen';
import { ShowtimesScreen } from '../screens/staff/ShowtimesScreen';
import { CommentsScreen } from '../screens/staff/CommentsScreen';

const Tab = createBottomTabNavigator<StaffTabParamList>();

export function StaffTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Movies" component={MoviesScreen} />
      <Tab.Screen name="Showtimes" component={ShowtimesScreen} />
      <Tab.Screen name="Comments" component={CommentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
