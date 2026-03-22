import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminTabParamList } from '../types/navigation';
import { AdminLayout } from '../components/AdminLayout';
import { ProfileScreen } from '../screens/auth/ProfileScreen';
import { AdminMoviesStack } from './AdminMoviesStack';
import { AdminCinemasStack } from './AdminCinemasStack';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { RevenueStreamingScreen } from '../screens/admin/RevenueStreamingScreen';
import { AdminUsersStack } from './AdminUsersStack';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const withAdminLayout =
  <T extends object>(Component: React.ComponentType<T>) =>
  (props: T) => (
    <AdminLayout>
      <Component {...props} />
    </AdminLayout>
  );

const DashboardWithLayout = withAdminLayout(DashboardScreen);
const RevenueWithLayout = withAdminLayout(RevenueStreamingScreen);
const ProfileWithLayout = withAdminLayout(ProfileScreen);

export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#0f0a12' },
      }}
      tabBar={() => null}
    >
      <Tab.Screen name="Dashboard" component={DashboardWithLayout} />
      <Tab.Screen name="Revenue" component={RevenueWithLayout} />
      <Tab.Screen name="Movies" component={AdminMoviesStack} />
      <Tab.Screen name="Users" component={AdminUsersStack} />
      <Tab.Screen name="Cinemas" component={AdminCinemasStack} />
      <Tab.Screen name="Profile" component={ProfileWithLayout} />
    </Tab.Navigator>
  );
}
