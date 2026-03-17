import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { CustomerTabs } from './CustomerTabs';
import { StaffTabs } from './StaffTabs';
import { AdminTabs } from './AdminTabs';
import { View, Text, ActivityIndicator } from 'react-native';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

import { MovieDetailScreen } from '../screens/customer/MovieDetailScreen';
import { ShowtimeDetailScreen } from '../screens/customer/ShowtimeDetailScreen';
import { BookingPaymentScreen } from '../screens/customer/BookingPaymentScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  const isCustomerOrGuest = !isAuthenticated || user?.role === 'CUSTOMER';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isCustomerOrGuest && (
        <Stack.Group>
          <Stack.Screen name="CustomerMain" component={CustomerTabs} />
          <Stack.Screen name="MovieDetail" component={MovieDetailScreen as any} options={{ headerShown: true, title: 'Movie Details', headerBackTitle: 'Back' }} />
          <Stack.Screen name="ShowtimeDetail" component={ShowtimeDetailScreen as any} options={{ headerShown: true, title: 'Select Seats', headerBackTitle: 'Back' }} />
          
          {!isAuthenticated && (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}

          {isAuthenticated && (
            <Stack.Screen name="BookingPayment" component={BookingPaymentScreen as any} options={{ headerShown: true, title: 'Payment', headerBackTitle: 'Back' }} />
          )}
        </Stack.Group>
      )}

      {/* Staff Routes */}
      {isAuthenticated && user?.role === 'STAFF' && (
        <Stack.Screen name="StaffMain" component={StaffTabs} />
      )}

      {/* Admin Routes */}
      {isAuthenticated && user?.role === 'ADMIN' && (
        <Stack.Screen name="AdminMain" component={AdminTabs} />
      )}
    </Stack.Navigator>
  );
}
