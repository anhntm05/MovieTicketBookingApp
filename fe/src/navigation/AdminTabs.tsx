import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminTabParamList } from '../types/navigation';
import { AdminLayout } from '../components/AdminLayout';
import { ProfileScreen } from '../screens/auth/ProfileScreen';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { CinemaConfigScreen } from '../screens/admin/CinemaConfigScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const withAdminLayout =
  <T extends object>(Component: React.ComponentType<T>) =>
  (props: T) => (
    <AdminLayout>
      <Component {...props} />
    </AdminLayout>
  );

const DashboardWithLayout = withAdminLayout(DashboardScreen);
const UsersWithLayout = withAdminLayout(UsersScreen);
const CinemasWithLayout = withAdminLayout(CinemaConfigScreen as React.ComponentType<any>);
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
      <Tab.Screen name="Users" component={UsersWithLayout} />
      <Tab.Screen name="Cinemas" component={CinemasWithLayout} />
      <Tab.Screen name="Profile" component={ProfileWithLayout} />
    </Tab.Navigator>
  );
}
