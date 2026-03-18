import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { CustomerStackParamList } from '../../types/navigation';
import apiClient from '../../api/client';
import { normalizeTicketDetail, unwrapApiData } from '../../api/transformers';
import { TicketDetail } from '../../types/models';

type Props = NativeStackScreenProps<CustomerStackParamList, 'TicketDetail'>;

const QR_CODE_IMAGE = require('../../../assets/QR-code.jpg');
const ACCENT = '#f90680';
const BACKGROUND = '#0f0a12';
const SURFACE = '#1a141e';
const SURFACE_BORDER = '#251d2a';
const SUCCESS = '#03DAC6';
const TEXT_MUTED = '#aaa';
const TEXT_SUBTLE = '#666';

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

const formatDate = (value?: string) => {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value?: string) => {
  if (!value) return 'Time unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const getStatusLabel = (status: TicketDetail['status']) => status.replace(/_/g, ' ');

const getStatusColor = (status: TicketDetail['status']) => {
  switch (status) {
    case 'CONFIRMED':
      return SUCCESS;
    case 'PENDING_PAYMENT':
      return '#F2C94C';
    case 'CANCELLED':
    case 'EXPIRED':
      return '#8c8192';
    default:
      return '#fff';
  }
};

export const TicketDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params;

  const { data: ticket, isLoading, isRefetching } = useQuery<TicketDetail>({
    queryKey: ['ticket-detail', bookingId],
    queryFn: async () =>
      normalizeTicketDetail(unwrapApiData(await apiClient.get(`/bookings/${bookingId}/ticket-detail`))),
  });

  const handleShare = async () => {
    if (!ticket) return;

    try {
      await Share.share({
        message: `Movie: ${ticket.movie.title}\nBooking: #${ticket.bookingCode}\nTime: ${formatDate(ticket.schedule.startTime)} ${formatTime(ticket.schedule.startTime)}\nSeats: ${ticket.seats.map((seat) => seat.label).join(', ')}`,
      });
    } catch {
      Alert.alert('Share failed', 'Could not open the share sheet.');
    }
  };

  if (isLoading && !isRefetching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Ticket details are unavailable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(ticket.status);
  const seatLabels = ticket.seats.map((seat) => seat.label);
  const genres = ticket.movie.genre.slice(0, 2).join(', ') || 'Movie';
  const locationLine = [ticket.schedule.cinemaLocation, ticket.schedule.cinemaAddress]
    .filter(Boolean)
    .join(' • ');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Details</Text>
        <TouchableOpacity onPress={handleShare} activeOpacity={0.8}>
          <MaterialCommunityIcons name="share-variant" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.movieCard}>
          {ticket.movie.posterUrl ? (
            <Image source={{ uri: ticket.movie.posterUrl }} style={styles.moviePoster} />
          ) : (
            <View style={[styles.moviePoster, styles.posterFallback]}>
              <MaterialCommunityIcons name="movie-open-outline" size={36} color="#fff" />
            </View>
          )}

          <View style={styles.movieDetails}>
            <View style={styles.badgeRow}>
              <View style={styles.imaxBadge}>
                <Text style={styles.imaxText}>{ticket.schedule.hall || 'Standard Hall'}</Text>
              </View>
              <View style={[styles.imaxBadge, styles.secondaryBadge]}>
                <Text style={[styles.imaxText, styles.secondaryBadgeText]}>{ticket.paymentStatus}</Text>
              </View>
            </View>

            <Text style={styles.movieTitle}>{ticket.movie.title}</Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={ACCENT} />
              <Text style={styles.metaText}>
                {' '}
                {ticket.movie.duration}m  •  {genres}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(ticket.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>DATE</Text>
              <Text style={styles.value}>{formatDate(ticket.schedule.startTime)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>TIME</Text>
              <Text style={styles.value}>{formatTime(ticket.schedule.startTime)}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>THEATER</Text>
              <Text style={styles.value}>{ticket.schedule.theater || 'Cinema unavailable'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>HALL</Text>
              <Text style={styles.value}>{ticket.schedule.hall || 'Hall unavailable'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.seatSection}>
          <MaterialCommunityIcons name="seat-recline-normal" size={24} color={ACCENT} />
          <Text style={styles.sectionLabel}>Seats</Text>
          {seatLabels.length > 0 ? (
            seatLabels.map((seat) => (
              <View key={seat} style={styles.seatBadge}>
                <Text style={styles.seatText}>{seat}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyInlineText}>No seats found</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="popcorn" size={20} color={ACCENT} />
            <Text style={styles.sectionTitle}>Concessions</Text>
          </View>

          {ticket.concessions.length > 0 ? (
            ticket.concessions.map((item) => (
              <View key={`${item.name}-${item.note}-${item.qty}`} style={styles.concessionItem}>
                <View style={styles.concessionBody}>
                  <Text style={styles.concessionName}>{item.name}</Text>
                  {item.note ? <Text style={styles.concessionNote}>{item.note}</Text> : null}
                </View>
                <View style={styles.concessionMeta}>
                  <Text style={styles.concessionQty}>x{item.qty}</Text>
                  <Text style={styles.concessionPrice}>{formatMoney(item.totalPrice)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.addressText}>No concessions were added to this booking.</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker" size={20} color={ACCENT} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <Text style={styles.addressText}>
            {ticket.schedule.cinemaAddress || ticket.schedule.cinemaLocation || 'Location unavailable'}
          </Text>
          <View style={styles.mapContainer}>
            <LinearGradient
              colors={['rgba(249, 6, 128, 0.12)', 'rgba(26, 20, 30, 0.95)']}
              style={styles.mapMock}
            >
              <Text style={styles.mapCaption}>{locationLine || ticket.schedule.theater}</Text>
            </LinearGradient>
            <View style={styles.mapOverlay}>
              <View style={styles.mapMarker} />
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tickets ({ticket.summary.ticketCount}x)</Text>
            <Text style={styles.summaryValue}>{formatMoney(ticket.summary.ticketSubtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Concessions</Text>
            <Text style={styles.summaryValue}>{formatMoney(ticket.summary.concessionsSubtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>{formatMoney(ticket.summary.serviceFee)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatMoney(ticket.summary.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <Image source={QR_CODE_IMAGE} style={styles.qrCode} />
          </View>
          <Text style={styles.scanText}>SCAN THIS AT THE ENTRANCE</Text>
          <Text style={styles.qrIdText}>#{ticket.qrCodeValue}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => Alert.alert('Not available', 'PDF export is not implemented yet.')}
          >
            <MaterialCommunityIcons name="download" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => Alert.alert('Not available', 'Wallet integration is not implemented yet.')}
          >
            <MaterialCommunityIcons name="wallet" size={20} color="#fff" />
            <Text style={styles.secondaryButtonText}>Add to Apple Wallet</Text>
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
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderRadius: 25,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  moviePoster: {
    width: 100,
    height: 140,
    borderRadius: 15,
    backgroundColor: SURFACE_BORDER,
  },
  posterFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
    rowGap: 6,
  },
  imaxBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  secondaryBadge: {
    backgroundColor: '#f9068020',
    borderWidth: 1,
    borderColor: '#f90680',
  },
  imaxText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  secondaryBadgeText: {
    color: '#f90680',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: SURFACE,
    borderRadius: 25,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  label: {
    color: TEXT_SUBTLE,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seatSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: SURFACE,
    borderRadius: 25,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    rowGap: 10,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    marginRight: 10,
    flexGrow: 1,
  },
  seatBadge: {
    backgroundColor: '#f9068020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#f9068040',
  },
  seatText: {
    color: '#f90680',
    fontWeight: 'bold',
  },
  emptyInlineText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  concessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: SURFACE_BORDER,
  },
  concessionBody: {
    flex: 1,
    paddingRight: 12,
  },
  concessionMeta: {
    alignItems: 'flex-end',
  },
  concessionName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  concessionNote: {
    color: TEXT_SUBTLE,
    fontSize: 12,
  },
  concessionQty: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  concessionPrice: {
    color: ACCENT,
    fontSize: 12,
    marginTop: 4,
  },
  addressText: {
    color: TEXT_MUTED,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  mapContainer: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#120d17',
  },
  mapMock: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  mapCaption: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: '75%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ACCENT,
    borderWidth: 3,
    borderColor: '#fff',
  },
  summarySection: {
    padding: 20,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: SURFACE_BORDER,
    marginVertical: 15,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    color: ACCENT,
    fontSize: 24,
    fontWeight: 'bold',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 25,
    marginBottom: 15,
  },
  qrCode: {
    width: 120,
    height: 120,
  },
  scanText: {
    color: TEXT_SUBTLE,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  qrIdText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  actions: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: ACCENT,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: '#000',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
