import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminCinemaStackParamList } from '../types/navigation';
import { AdminLayout } from '../components/AdminLayout';
import { CinemaConfigScreen } from '../screens/admin/CinemaConfigScreen';
import { AdminCinemaDetailScreen } from '../screens/admin/AdminCinemaDetailScreen';

const Stack = createNativeStackNavigator<AdminCinemaStackParamList>();

const withCinemasLayout =
  <T extends object>(Component: React.ComponentType<T>) =>
  (props: T) => (
    <AdminLayout activeTabOverride="Cinemas">
      <Component {...props} />
    </AdminLayout>
  );

const CinemaCatalogWithLayout = withCinemasLayout(CinemaConfigScreen);
const CinemaDetailWithLayout = withCinemasLayout(AdminCinemaDetailScreen as React.ComponentType<any>);

export function AdminCinemasStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminCinemaCatalog"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0a12' },
      }}
    >
      <Stack.Screen name="AdminCinemaCatalog" component={CinemaCatalogWithLayout} />
      <Stack.Screen name="AdminCinemaDetail" component={CinemaDetailWithLayout} />
    </Stack.Navigator>
  );
}
