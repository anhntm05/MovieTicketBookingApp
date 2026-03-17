import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import apiClient from '../../api/client';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { useQueryClient } from '@tanstack/react-query';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingPayment'>;

export const BookingPaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { showtimeId, selectedSeatIds } = route.params;
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Create the booking as soon as the screen loads
    const createBooking = async () => {
      try {
        const response = await apiClient.post('/bookings', {
          showtimeId,
          seatIds: selectedSeatIds,
        });
        setBookingId(response.data.id);
        setTotalAmount(response.data.totalAmount);
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to create booking', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setIsCreating(false);
      }
    };

    createBooking();
  }, [showtimeId, selectedSeatIds, navigation]);

  const handlePayment = async () => {
    if (!bookingId) return;

    try {
      setIsPaying(true);
      // Simulate payment processing flow
      await apiClient.post('/payments/process', {
        bookingId,
        paymentMethod: 'MOCK_QR',
      });
      
      Alert.alert('Success', 'Payment processed and booking confirmed!', [
        { 
          text: 'View Booking', 
          onPress: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['seats', showtimeId] });
            // Navigate back to main and shift to Bookings tab
            navigation.navigate('CustomerMain');
          } 
        }
      ]);
    } catch (error: any) {
      Alert.alert('Payment Failed', error.response?.data?.message || 'Could not process payment');
    } finally {
      setIsPaying(false);
    }
  };

  if (isCreating) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Securing your seats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Order Summary</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Booking ID:</Text>
          <Text style={styles.value}>{bookingId?.slice(0, 8).toUpperCase()}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Seats:</Text>
          <Text style={styles.value}>{selectedSeatIds.length} x Tickets</Text>
        </View>

        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>
        <View style={styles.mockQrBox}>
          <Text style={styles.mockQrText}>[ MOCK QR CODE GATEWAY ]</Text>
        </View>

        <Button
          title="Simulate Payment"
          onPress={handlePayment}
          isLoading={isPaying}
          style={styles.payButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  paymentSection: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  mockQrBox: {
    height: 200,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  mockQrText: {
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  payButton: {
    marginTop: 'auto',
  },
});
