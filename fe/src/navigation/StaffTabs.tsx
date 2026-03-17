import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StaffTabParamList } from '../types/navigation';
import { View, Text } from 'react-native';
import { ProfileScreen } from '../screens/auth/ProfileScreen';

const Tab = createBottomTabNavigator<StaffTabParamList>();

const MoviesScreen = () => <View><Text>Manage Movies</Text></View>;
const ShowtimesScreen = () => <View><Text>Manage Showtimes</Text></View>;
const CommentsScreen = () => <View><Text>Manage Comments</Text></View>;

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
