import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomerStackParamList } from '../../types/navigation';
import apiClient from '../../api/client';
import {
  normalizeBooking,
  normalizeSeatAvailability,
  normalizeShowtime,
  unwrapApiData,
} from '../../api/transformers';
import { SeatAvailability, Showtime } from '../../types/models';

type Props = NativeStackScreenProps<CustomerStackParamList, 'BookingPayment'>;

const QR_CODE_IMAGE = require('../../../assets/QR-code.jpg');
const ACCENT = '#f90680';
const BACKGROUND = '#0f0a12';
const SURFACE = '#1a141e';
const SURFACE_BORDER = '#251d2a';
const MUTED = '#666';
const MUTED_LIGHT = '#aaa';

export const BookingPaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { showtimeId, selectedSeatIds } = route.params;
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const queryClient = useQueryClient();

  const { data: showtime } = useQuery<Showtime>({
    queryKey: ['showtime', showtimeId],
    queryFn: async () => normalizeShowtime(unwrapApiData(await apiClient.get(`/showtimes/${showtimeId}`))),
  });

  const { data: seats = [] } = useQuery<SeatAvailability[]>({
    queryKey: ['seats', showtimeId],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get(`/showtimes/${showtimeId}/seats`));
      return data.map(normalizeSeatAvailability);
    },
  });

  useEffect(() => {
    const createBooking = async () => {
      try {
        const booking = normalizeBooking(
          unwrapApiData(
            await apiClient.post('/bookings', {
              showtime: showtimeId,
              seats: selectedSeatIds,
            })
          )
        );
        setBookingId(booking.id);
        setTotalAmount(booking.totalAmount);
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

  const selectedSeatLabels = useMemo(() => {
    return seats
      .filter((seat) => selectedSeatIds.includes(seat.id))
      .sort((a, b) => {
        if (a.row === b.row) {
          return a.number - b.number;
        }

        return a.row.localeCompare(b.row);
      })
      .map((seat) => `${seat.row}${seat.number}`);
  }, [seats, selectedSeatIds]);

  const bookingCode = bookingId ? bookingId.slice(0, 8).toUpperCase() : 'PENDING';
  const movie = showtime?.movie;
  const cinemaName = [showtime?.screen?.cinema?.name, showtime?.screen?.name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const dateLabel = showtime?.startTime
    ? new Date(showtime.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : 'Date unavailable';
  const timeLabel = showtime?.startTime
    ? new Date(showtime.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'Time unavailable';

  const handlePayment = async () => {
    if (!bookingId || isPaid) {
      if (isPaid && bookingId) {
        navigation.navigate('TicketDetail', { bookingId });
      }
      return;
    }

    try {
      setIsPaying(true);
      await apiClient.post('/payments/process', {
        booking: bookingId,
        amount: totalAmount,
        method: 'bank_transfer',
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['seats', showtimeId] });
      setIsPaid(true);
    } catch (error: any) {
      Alert.alert('Payment Failed', error.response?.data?.message || 'Could not process payment');
    } finally {
      setIsPaying(false);
    }
  };

  if (isCreating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Securing your seats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isPaid ? 'Booking Confirmed' : 'Complete Payment'}</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Order Details', `Booking #${bookingCode}\nAmount: $${totalAmount.toFixed(2)}`)
          }
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons
              name={isPaid ? 'check' : 'qrcode-scan'}
              size={32}
              color="#fff"
            />
          </View>
          <Text style={styles.thankYouText}>{isPaid ? 'Thank You!' : 'Almost There'}</Text>
          <Text style={styles.subtitleText}>
            {isPaid
              ? 'Your cinematic adventure is ready.'
              : 'Scan the QR code and confirm your payment.'}
          </Text>
        </View>

        <View style={styles.ticketCard}>
          <View style={styles.movieHeader}>
            {movie?.posterUrl ? (
              <Image source={{ uri: movie.posterUrl }} style={styles.moviePoster} />
            ) : (
              <View style={[styles.moviePoster, styles.posterFallback]}>
                <MaterialCommunityIcons name="movie-open-outline" size={42} color="#fff" />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(26, 20, 30, 0.95)']}
              style={styles.movieGradient}
            />
            <View style={styles.movieInfoOverlay}>
              <View style={styles.imaxBadge}>
                <Text style={styles.imaxText}>
                  {showtime?.screen?.name || 'Movie Ticket'}
                </Text>
              </View>
              <Text style={styles.movieTitle} numberOfLines={2}>
                {movie?.title || 'Movie'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>DATE</Text>
                <Text style={styles.value}>{dateLabel}</Text>
              </View>
              <View style={[styles.col, styles.alignEnd]}>
                <Text style={styles.label}>TIME</Text>
                <Text style={styles.value}>{timeLabel}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>THEATER</Text>
                <Text style={styles.value}>{cinemaName || 'Theater unavailable'}</Text>
              </View>
              <View style={[styles.col, styles.alignEnd]}>
                <Text style={styles.label}>SEATS</Text>
                <Text style={styles.value}>
                  {selectedSeatLabels.length > 0
                    ? selectedSeatLabels.join(', ')
                    : `${selectedSeatIds.length} ticket${selectedSeatIds.length === 1 ? '' : 's'}`}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>TOTAL</Text>
                <Text style={styles.value}>${totalAmount.toFixed(2)}</Text>
              </View>
              <View style={[styles.col, styles.alignEnd]}>
                <Text style={styles.label}>STATUS</Text>
                <Text style={[styles.value, isPaid ? styles.successValue : styles.pendingValue]}>
                  {isPaid ? 'PAID' : 'PENDING'}
                </Text>
              </View>
            </View>

            <View style={styles.separatorContainer}>
              <View style={styles.leftCutout} />
              <View style={styles.dottedLine} />
              <View style={styles.rightCutout} />
            </View>

            <View style={styles.qrSection}>
              <View style={styles.qrContainer}>
                <Image source={QR_CODE_IMAGE} style={styles.qrCode} resizeMode="cover" />
              </View>
              <Text style={styles.orderId}>ORDER ID: #{bookingCode}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.instructionText}>
          {isPaid
            ? 'Show this QR code at the theater entrance.'
            : 'Scan this QR code to pay, then confirm below.'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.downloadButton, (!bookingId || isPaying) && styles.disabledButton]}
            onPress={handlePayment}
            activeOpacity={0.85}
            disabled={!bookingId || isPaying}
          >
            {isPaying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isPaid ? 'ticket-confirmation-outline' : 'check-circle-outline'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>
                  {isPaid ? 'View Ticket' : 'Confirm Payment'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('Tabs', {
                screen: isPaid ? 'Bookings' : 'Home',
              })
            }
          >
            <MaterialCommunityIcons
              name={isPaid ? 'ticket-confirmation-outline' : 'home-variant-outline'}
              size={20}
              color={ACCENT}
            />
            <Text style={styles.shareButtonText}>
              {isPaid ? 'Back to Bookings' : 'Back to Home'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
  },
  loadingText: {
    marginTop: 16,
    color: MUTED_LIGHT,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  thankYouText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: ACCENT,
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  ticketCard: {
    marginHorizontal: 20,
    backgroundColor: SURFACE,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  movieHeader: {
    height: 200,
    width: '100%',
  },
  moviePoster: {
    width: '100%',
    height: '100%',
    backgroundColor: SURFACE,
  },
  posterFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  movieInfoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  imaxBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  imaxText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 25,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  col: {
    flex: 1,
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  label: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    opacity: 0.6,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successValue: {
    color: '#03DAC6',
  },
  pendingValue: {
    color: '#F2C94C',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -25,
    marginVertical: 10,
  },
  leftCutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BACKGROUND,
    marginLeft: -10,
  },
  rightCutout: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BACKGROUND,
    marginRight: -10,
  },
  dottedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    borderStyle: 'dashed',
    marginHorizontal: 5,
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  qrCode: {
    width: 140,
    height: 140,
  },
  orderId: {
    color: MUTED,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  instructionText: {
    color: ACCENT,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
    paddingHorizontal: 24,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  downloadButton: {
    backgroundColor: ACCENT,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  shareButton: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 6, 128, 0.3)',
    backgroundColor: 'rgba(249, 6, 128, 0.05)',
    width: '100%',
  },
  shareButtonText: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
