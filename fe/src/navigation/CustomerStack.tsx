import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { CustomerTabs } from './CustomerTabs';
import { MovieDetailScreen } from '../screens/customer/MovieDetailScreen';
import { SeatSelectionScreen } from '../screens/customer/SeatSelectionScreen';
import { BookingPaymentScreen } from '../screens/customer/BookingPaymentScreen';
import { TicketDetailScreen } from '../screens/customer/TicketDetailScreen';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerStack() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0a12' },
      }}
    >
      <Stack.Screen name="Tabs" component={CustomerTabs} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen as any} />
      <Stack.Screen name="SeatSelection" component={SeatSelectionScreen as any} />
      {isAuthenticated && (
        <>
          <Stack.Screen name="BookingPayment" component={BookingPaymentScreen as any} />
          <Stack.Screen name="TicketDetail" component={TicketDetailScreen as any} />
        </>
      )}
    </Stack.Navigator>
  );
}
