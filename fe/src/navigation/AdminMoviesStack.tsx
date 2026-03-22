import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminMovieStackParamList } from '../types/navigation';
import { AdminLayout } from '../components/AdminLayout';
import { AdminMoviesScreen } from '../screens/admin/AdminMoviesScreen';
import { AdminMovieDetailScreen } from '../screens/admin/AdminMovieDetailScreen';

const Stack = createNativeStackNavigator<AdminMovieStackParamList>();

const withMoviesLayout =
  <T extends object>(Component: React.ComponentType<T>) =>
  (props: T) => (
    <AdminLayout activeTabOverride="Movies">
      <Component {...props} />
    </AdminLayout>
  );

const MovieCatalogWithLayout = withMoviesLayout(AdminMoviesScreen);
const MovieDetailWithLayout = withMoviesLayout(AdminMovieDetailScreen as React.ComponentType<any>);

export function AdminMoviesStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminMovieCatalog"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0a12' },
      }}
    >
      <Stack.Screen name="AdminMovieCatalog" component={MovieCatalogWithLayout} />
      <Stack.Screen name="AdminMovieDetail" component={MovieDetailWithLayout} />
    </Stack.Navigator>
  );
}
