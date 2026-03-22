import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminLayout } from '../components/AdminLayout';
import { AdminUserStackParamList } from '../types/navigation';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { AdminCustomerDetailScreen } from '../screens/admin/AdminCustomerDetailScreen';

const Stack = createNativeStackNavigator<AdminUserStackParamList>();

const withUsersLayout =
  <T extends object>(Component: React.ComponentType<T>) =>
  (props: T) => (
    <AdminLayout activeTabOverride="Users">
      <Component {...props} />
    </AdminLayout>
  );

const UserDirectoryWithLayout = withUsersLayout(UsersScreen);
const CustomerDetailWithLayout = withUsersLayout(AdminCustomerDetailScreen as React.ComponentType<any>);

export function AdminUsersStack() {
  return (
    <Stack.Navigator
      initialRouteName="AdminUserDirectory"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0a12' },
      }}
    >
      <Stack.Screen name="AdminUserDirectory" component={UserDirectoryWithLayout} />
      <Stack.Screen name="AdminCustomerDetail" component={CustomerDetailWithLayout} />
    </Stack.Navigator>
  );
}
