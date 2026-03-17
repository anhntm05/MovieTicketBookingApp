import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomerTabParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { ProfileScreen } from '../screens/auth/ProfileScreen';
import { HomeScreen } from '../screens/customer/HomeScreen';
import { CinemasScreen } from '../screens/customer/CinemasScreen';
import { BookingsScreen } from '../screens/customer/BookingsScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export function CustomerTabs() {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Cinemas" component={CinemasScreen} />
      {isAuthenticated && (
        <Tab.Screen name="Bookings" component={BookingsScreen} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
