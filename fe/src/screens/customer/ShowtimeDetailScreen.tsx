import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import apiClient from '../../api/client';
import { Showtime, SeatAvailability } from '../../types/models';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ShowtimeDetail'>;

export const ShowtimeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { showtimeId } = route.params;
  const { isAuthenticated } = useAuthStore();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isHolding, setIsHolding] = useState(false);

  const { data: showtime, isLoading: isLoadingShowtime } = useQuery<Showtime>({
    queryKey: ['showtime', showtimeId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/showtimes/${showtimeId}`);
      return data;
    },
  });

  const { data: seats, isLoading: isLoadingSeats, refetch: refetchSeats } = useQuery<SeatAvailability[]>({
    queryKey: ['seats', showtimeId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/showtimes/${showtimeId}/seats`);
      return data;
    },
    // Poll every 5 seconds to get live seat status updates (or we could use socket.io)
    refetchInterval: 5000,
  });

  const handleSeatPress = (seat: SeatAvailability) => {
    if (seat.status !== 'AVAILABLE') return;

    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      } else {
        // Limit selection to 8 seats for example
        if (prev.length >= 8) {
          Alert.alert('Limit Reached', 'You can only select up to 8 seats at once.');
          return prev;
        }
        return [...prev, seat.id];
      }
    });
  };

  const handleHoldSeats = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    if (selectedSeatIds.length === 0) return;

    try {
      setIsHolding(true);
      await apiClient.post('/bookings/hold', {
        showtimeId,
        seatIds: selectedSeatIds,
      });

      // Navigate to payment/booking creation screen
      navigation.navigate('BookingPayment', { 
        showtimeId, 
        selectedSeatIds 
      });
    } catch (error: any) {
      Alert.alert(
        'Hold Failed', 
        error.response?.data?.message || 'The seats may have been taken by someone else.'
      );
      refetchSeats();
      setSelectedSeatIds([]);
    } finally {
      setIsHolding(false);
    }
  };

  if (isLoadingShowtime || isLoadingSeats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Group seats by row for rendering the seat map
  const seatsByRow = seats?.reduce((acc: { [row: string]: SeatAvailability[] }, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {}) || {};

  const rows = Object.keys(seatsByRow).sort();

  return (
    <View style={styles.container}>
      {showtime && (
        <View style={styles.header}>
          <Text style={styles.title}>{showtime.movie?.title || 'Movie'}</Text>
          <Text style={styles.subtitle}>
            {new Date(showtime.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
          <Text style={styles.subtitle}>
            {showtime.screen?.cinema?.name} • Screen {showtime.screen?.name}
          </Text>
        </View>
      )}

      {/* Screen Arc */}
      <View style={styles.screenContainer}>
        <View style={styles.screenArc} />
        <Text style={styles.screenText}>SCREEN</Text>
      </View>

      <ScrollView contentContainerStyle={styles.seatMap}>
        {rows.map((row) => (
          <View key={row} style={styles.row}>
            <Text style={styles.rowLabel}>{row}</Text>
            <View style={styles.seatRow}>
              {seatsByRow[row]
                .sort((a, b) => a.number - b.number)
                .map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  let bgColor = theme.colors.seatAvailable;
                  if (isSelected) bgColor = theme.colors.seatSelected;
                  else if (seat.status === 'HELD') bgColor = theme.colors.seatHeld;
                  else if (seat.status === 'BOOKED') bgColor = theme.colors.seatBooked;
                  else if (seat.status === 'BLOCKED') bgColor = theme.colors.border;

                  return (
                    <TouchableOpacity
                      key={seat.id}
                      style={[styles.seat, { backgroundColor: bgColor }]}
                      onPress={() => handleSeatPress(seat)}
                      disabled={seat.status !== 'AVAILABLE'}
                    >
                      <Text style={styles.seatNumber}>{seat.number}</Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
            <Text style={styles.rowLabel}>{row}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.seatAvailable }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.seatSelected }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.seatHeld }]} />
          <Text style={styles.legendText}>Held</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.seatBooked }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerTotal}>Total: ${(selectedSeatIds.length * (showtime?.price || 0)).toFixed(2)}</Text>
          <Text style={styles.footerSeats}>{selectedSeatIds.length} tickets selected</Text>
        </View>
        <Button
          title="Continue Booking"
          onPress={handleHoldSeats}
          disabled={selectedSeatIds.length === 0}
          isLoading={isHolding}
          style={styles.continueButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  screenContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  screenArc: {
    width: '80%',
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  screenText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: theme.spacing.xs,
    letterSpacing: 2,
  },
  seatMap: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rowLabel: {
    color: theme.colors.textSecondary,
    width: 20,
    textAlign: 'center',
    fontSize: theme.typography.sizes.xs,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  seat: {
    width: 26,
    height: 26,
    marginHorizontal: 3,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatNumber: {
    fontSize: 10,
    color: theme.colors.white,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    paddingBottom: 30, // Safe area roughly
  },
  footerInfo: {
    flex: 1,
  },
  footerTotal: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
  },
  footerSeats: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  continueButton: {
    flex: 1,
  },
});
