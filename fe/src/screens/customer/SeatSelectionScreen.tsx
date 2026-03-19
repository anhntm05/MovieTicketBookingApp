import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerStackParamList } from '../../types/navigation';
import apiClient from '../../api/client';
import { normalizeSeatAvailability, normalizeShowtime, unwrapApiData } from '../../api/transformers';
import { theme } from '../../constants/theme';
import { SeatAvailability, Showtime } from '../../types/models';
import { Button } from '../../components/Button';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

const ACCENT = '#f90680';
const BACKGROUND = '#0f0a12';
const TEXT_MUTED = '#999';
const SEAT_AVAILABLE = '#666';
const SEAT_UNAVAILABLE = '#333';

type Props = NativeStackScreenProps<CustomerStackParamList, 'SeatSelection'>;

export const SeatSelectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { showtimeId } = route.params;
  const { isAuthenticated } = useAuthStore();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [isHolding, setIsHolding] = useState(false);

  const { data: showtime, isLoading: isLoadingShowtime } = useQuery<Showtime>({
    queryKey: ['showtime', showtimeId],
    queryFn: async () => {
      return normalizeShowtime(unwrapApiData(await apiClient.get(`/showtimes/${showtimeId}`)));
    },
  });

  const { data: seats, isLoading: isLoadingSeats, refetch: refetchSeats } = useQuery<SeatAvailability[]>({
    queryKey: ['seats', showtimeId],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get(`/showtimes/${showtimeId}/seats`));
      return data.map(normalizeSeatAvailability);
    },
    refetchInterval: 5000,
  });

  const handleSeatPress = (seat: SeatAvailability) => {
    if (seat.status !== 'AVAILABLE') return;

    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      }

      if (prev.length >= 8) {
        Alert.alert('Limit Reached', 'You can only select up to 8 seats at once.');
        return prev;
      }

      return [...prev, seat.id];
    });
  };

  const handleHoldSeats = async () => {
    if (!isAuthenticated) {
      navigation.getParent()?.navigate('Login' as never);
      return;
    }

    if (selectedSeatIds.length === 0) return;

    try {
      setIsHolding(true);
      await apiClient.post('/bookings/hold', {
        showtime: showtimeId,
        seats: selectedSeatIds,
      });

      navigation.navigate('BookingPayment', {
        showtimeId,
        selectedSeatIds,
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

  const handleInfoPress = () => {
    Alert.alert(
      'Seat Selection',
      'Tap available seats to select up to 8 tickets. Held, booked, and blocked seats cannot be selected.'
    );
  };

  if (isLoadingShowtime || isLoadingSeats) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading seat availability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const seatsByRow =
    seats?.reduce<Record<string, SeatAvailability[]>>((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {}) ?? {};

  const rows = Object.keys(seatsByRow).sort();
  const sortedSelectedSeats =
    seats
      ?.filter((seat) => selectedSeatIds.includes(seat.id))
      .sort((a, b) => {
        if (a.row === b.row) return a.number - b.number;
        return a.row.localeCompare(b.row);
      }) ?? [];

  const selectedSeatLabels = sortedSelectedSeats.map((seat) => `${seat.row}${seat.number}`);
  const totalPrice = selectedSeatIds.length * (showtime?.price || 0);
  const showtimeLabel = showtime
    ? new Date(showtime.startTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'Showtime unavailable';
  const venueLabel = [showtime?.screen?.cinema?.name, showtime?.screen?.name]
    .filter(Boolean)
    .join(' | ');

  const getSeatColor = (seat: SeatAvailability) => {
    if (selectedSeatIds.includes(seat.id)) return ACCENT;
    if (seat.status === 'AVAILABLE') return SEAT_AVAILABLE;
    return SEAT_UNAVAILABLE;
  };

  const getSeatSpacingStyle = (index: number, totalSeatsInRow: number) => {
    if (totalSeatsInRow >= 8 && (index === 1 || index === totalSeatsInRow - 3)) {
      return styles.seatWideGap;
    }

    if (totalSeatsInRow >= 6 && index === Math.floor(totalSeatsInRow / 2) - 1) {
      return styles.seatMidGap;
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {showtime?.movie?.title || 'Seat Selection'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={2}>
            {[showtimeLabel, venueLabel].filter(Boolean).join(' | ')}
          </Text>
        </View>

        <TouchableOpacity onPress={handleInfoPress} hitSlop={10}>
          <MaterialCommunityIcons name="information-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.screenContainer}>
          <LinearGradient
            colors={[ACCENT, 'rgba(249, 6, 128, 0.05)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.screenCurve}
          />
          <Text style={styles.screenText}>S C R E E N</Text>
        </View>

        <View style={styles.seatMap}>
          {rows.length === 0 ? (
            <Text style={styles.emptyState}>No seats available for this showtime.</Text>
          ) : (
            rows.map((row) => {
              const rowSeats = seatsByRow[row].sort((a, b) => a.number - b.number);

              return (
                <View key={row} style={styles.seatRowWrapper}>
                  <Text style={styles.rowLabel}>{row}</Text>
                  <View style={styles.seatRow}>
                    {rowSeats.map((seat, index) => (
                      <TouchableOpacity
                        key={seat.id}
                        disabled={seat.status !== 'AVAILABLE'}
                        onPress={() => handleSeatPress(seat)}
                        style={[styles.seat, getSeatSpacingStyle(index, rowSeats.length)]}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="seat-recline-normal"
                          size={26}
                          color={getSeatColor(seat)}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.rowLabel}>{row}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <MaterialCommunityIcons name="seat-recline-normal" size={18} color={SEAT_AVAILABLE} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <MaterialCommunityIcons name="seat-recline-normal" size={18} color={SEAT_UNAVAILABLE} />
            <Text style={styles.legendText}>Reserved</Text>
          </View>
          <View style={styles.legendItem}>
            <MaterialCommunityIcons name="seat-recline-normal" size={18} color={ACCENT} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Selected Seats</Text>
            <Text style={styles.summaryValue}>
              {selectedSeatLabels.length > 0 ? selectedSeatLabels.join(', ') : 'None'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Price</Text>
            <Text style={styles.summaryPrice}>${totalPrice.toFixed(2)}</Text>
          </View>
          <Button
            title="Confirm Booking"
            onPress={handleHoldSeats}
            disabled={selectedSeatIds.length === 0}
            isLoading={isHolding}
            style={styles.confirmButton}
          />
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: TEXT_MUTED,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.pageTitle,
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: ACCENT,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  screenContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  screenCurve: {
    width: width * 0.8,
    height: 40,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    opacity: 0.6,
  },
  screenText: {
    color: '#666',
    letterSpacing: 5,
    fontSize: 12,
    marginTop: -10,
  },
  seatMap: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  seatRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rowLabel: {
    width: 24,
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seat: {
    marginHorizontal: 4,
  },
  seatMidGap: {
    marginRight: 22,
  },
  seatWideGap: {
    marginRight: 30,
  },
  emptyState: {
    color: TEXT_MUTED,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    flexWrap: 'wrap',
    rowGap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  legendText: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginLeft: 6,
  },
  summaryCard: {
    backgroundColor: '#1a141e',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 28,
    padding: 18,
  },
  summaryRow: {
    marginBottom: 14,
  },
  summaryLabel: {
    color: '#8c8192',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryPrice: {
    color: ACCENT,
    fontSize: 24,
    fontWeight: '800',
  },
  confirmButton: {
    marginTop: 8,
  },
});
