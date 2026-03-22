import React, { useEffect, useRef, useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomerStackParamList } from '../../types/navigation';
import apiClient from '../../api/client';
import {
  normalizeBooking,
  normalizeShowtime,
  unwrapApiData,
} from '../../api/transformers';
import { Booking, Showtime } from '../../types/models';

type Props = NativeStackScreenProps<CustomerStackParamList, 'BookingPayment'>;

const QR_CODE_IMAGE = require('../../../assets/QR-code.jpg');
const ACCENT = '#f90680';
const BACKGROUND = '#0f0a12';
const SURFACE = '#1a141e';
const SURFACE_BORDER = '#251d2a';
const MUTED = '#666';
const MUTED_LIGHT = '#aaa';

export const BookingPaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    bookingId: routeBookingId,
    booking: routeBooking,
    showtimeId: routeShowtimeId,
    showtime: routeShowtime,
    selectedSeatIds: routeSeatIds,
    selectedSeatLabels: routeSeatLabels,
  } = route.params;
  const bookingId = routeBookingId || routeBooking?.id || null;
  const [now, setNow] = useState(Date.now());
  const expiryHandledRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!bookingId) {
      Alert.alert('Booking unavailable', 'The payment session could not be restored.', [
        { text: 'OK', onPress: () => navigation.navigate('Tabs', { screen: 'Bookings' }) },
      ]);
    }
  }, [bookingId, navigation]);

  const { data: booking, isLoading: isLoadingBooking, refetch: refetchBooking } = useQuery<Booking>({
    queryKey: ['booking', bookingId],
    enabled: Boolean(bookingId),
    queryFn: async () => normalizeBooking(unwrapApiData(await apiClient.get(`/bookings/${bookingId}`))),
    initialData: routeBooking,
    refetchInterval: (query) => (query.state.data?.status === 'PENDING_PAYMENT' ? 5000 : false),
  });

  const effectiveShowtimeId = routeShowtime?.id || booking?.showtime?.id || booking?.showtimeId || routeShowtimeId;
  const selectedSeatIds = routeSeatIds || booking?.seatIds || [];
  const selectedSeatLabels = routeSeatLabels || booking?.seatLabels || [];

  const { data: showtime } = useQuery<Showtime>({
    queryKey: ['showtime', effectiveShowtimeId],
    enabled: Boolean(effectiveShowtimeId),
    initialData: routeShowtime || booking?.showtime,
    queryFn: async () => normalizeShowtime(unwrapApiData(await apiClient.get(`/showtimes/${effectiveShowtimeId}`))),
  });

  const bookingCode = booking?.bookingCode || (bookingId ? bookingId.slice(0, 8).toUpperCase() : 'PENDING');
  const totalAmount = booking?.totalAmount || 0;
  const isPaid = booking?.paymentStatus === 'COMPLETED' && booking?.status === 'CONFIRMED';
  const remainingMs = booking?.status === 'PENDING_PAYMENT' && booking.holdExpiresAt
    ? Math.max(0, new Date(booking.holdExpiresAt).getTime() - now)
    : 0;
  const totalSecondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
  const remainingLabel = `${String(Math.floor(totalSecondsLeft / 60)).padStart(2, '0')}:${String(
    totalSecondsLeft % 60
  ).padStart(2, '0')}`;
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

  useEffect(() => {
    if (booking?.status === 'EXPIRED' && !expiryHandledRef.current) {
      expiryHandledRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (effectiveShowtimeId) {
        queryClient.invalidateQueries({ queryKey: ['seats', effectiveShowtimeId] });
      }
      Alert.alert('Payment expired', 'Your 5-minute payment window has ended and the seats have been released.', [
        {
          text: 'Back to Bookings',
          onPress: () => navigation.navigate('Tabs', { screen: 'Bookings' }),
        },
      ]);
    }
  }, [booking?.status, effectiveShowtimeId, navigation, queryClient]);

  useEffect(() => {
    if (booking?.status === 'PENDING_PAYMENT' && remainingMs === 0) {
      refetchBooking();
    }
  }, [booking?.status, remainingMs, refetchBooking]);

  const paymentMutation = useMutation({
    mutationFn: async () =>
      apiClient.post('/payments/process', {
        booking: bookingId,
        amount: totalAmount,
        method: 'bank_transfer',
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        bookingId ? queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }) : Promise.resolve(),
        effectiveShowtimeId
          ? queryClient.invalidateQueries({ queryKey: ['seats', effectiveShowtimeId] })
          : Promise.resolve(),
      ]);
      await refetchBooking();
    },
    onError: (error: any) => {
      Alert.alert('Payment Failed', error.response?.data?.message || 'Could not process payment');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => apiClient.put(`/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      }
      if (effectiveShowtimeId) {
        queryClient.invalidateQueries({ queryKey: ['seats', effectiveShowtimeId] });
      }
      Alert.alert('Booking cancelled', 'Your pending booking was cancelled and the seats were released.', [
        {
          text: 'Back to Bookings',
          onPress: () => navigation.navigate('Tabs', { screen: 'Bookings' }),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Cancel failed', error.response?.data?.message || 'Could not cancel this booking');
    },
  });

  const handlePayment = () => {
    if (!bookingId) {
      return;
    }

    if (isPaid) {
      navigation.navigate('TicketDetail', { bookingId });
      return;
    }

    if (booking?.status !== 'PENDING_PAYMENT') {
      Alert.alert('Payment unavailable', 'This booking is no longer awaiting payment.');
      return;
    }

    if (remainingMs <= 0) {
      refetchBooking();
      return;
    }

    Alert.alert(
      'Confirm payment',
      'After payment is confirmed, this ticket cannot be cancelled and no refund will be issued from this screen. Continue?',
      [
        { text: 'Keep reviewing', style: 'cancel' },
        { text: 'Pay now', onPress: () => paymentMutation.mutate() },
      ]
    );
  };

  const handleCancelBooking = () => {
    if (!bookingId || booking?.status !== 'PENDING_PAYMENT') {
      return;
    }

    Alert.alert('Cancel pending booking', 'This will release your held seats immediately. Continue?', [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => cancelMutation.mutate() },
    ]);
  };

  if (bookingId && isLoadingBooking && !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading payment session...</Text>
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
              : 'Finish payment before the timer runs out to keep your seats.'}
          </Text>
          {!isPaid && booking?.status === 'PENDING_PAYMENT' ? (
            <View style={styles.timerBadge}>
              <MaterialCommunityIcons name="timer-outline" size={18} color="#fff" />
              <Text style={styles.timerText}>{remainingLabel} left</Text>
            </View>
          ) : null}
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
                  {isPaid ? 'PAID' : booking?.status === 'EXPIRED' ? 'EXPIRED' : 'PENDING'}
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
            : `Confirm payment within ${remainingLabel} or the seats will be released automatically.`}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.downloadButton, (!bookingId || paymentMutation.isPending || cancelMutation.isPending) && styles.disabledButton]}
            onPress={handlePayment}
            activeOpacity={0.85}
            disabled={!bookingId || paymentMutation.isPending || cancelMutation.isPending}
          >
            {paymentMutation.isPending ? (
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

          {!isPaid && booking?.status === 'PENDING_PAYMENT' ? (
            <TouchableOpacity
              style={[styles.cancelButton, cancelMutation.isPending && styles.disabledButton]}
              activeOpacity={0.85}
              onPress={handleCancelBooking}
              disabled={cancelMutation.isPending || paymentMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <ActivityIndicator size="small" color={ACCENT} />
              ) : (
                <>
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color={ACCENT} />
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.shareButton}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('Tabs', {
                screen: 'Bookings',
              })
            }
          >
            <MaterialCommunityIcons name="ticket-confirmation-outline" size={20} color={ACCENT} />
            <Text style={styles.shareButtonText}>Back to Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
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
  timerBadge: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9068025',
    borderWidth: 1,
    borderColor: '#f9068050',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
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
  cancelButton: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 6, 128, 0.3)',
    backgroundColor: 'rgba(249, 6, 128, 0.08)',
    width: '100%',
    marginBottom: 15,
  },
  cancelButtonText: {
    color: ACCENT,
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
