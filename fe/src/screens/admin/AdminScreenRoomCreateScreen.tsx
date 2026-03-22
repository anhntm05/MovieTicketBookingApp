import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { unwrapApiData } from '../../api/transformers';
import { AdminCinemaStackParamList } from '../../types/navigation';

const techOptions = ['Standard 4K', 'IMAX Laser', 'Dolby Vision'] as const;
const audioOptions = ['Dolby Atmos', '7.1 Surround', '5.1 Surround'] as const;
const seatsPerRowOptions = [8, 10, 12] as const;

const toRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' ? (value as Record<string, any>) : {};

const getId = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  const record = toRecord(value);
  return String(record._id || record.id || '');
};

const buildRowLabel = (index: number) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let value = index;
  let label = '';

  while (value >= 0) {
    label = alphabet[value % 26] + label;
    value = Math.floor(value / 26) - 1;
  }

  return label;
};

const buildSeatLayout = (totalSeats: number, seatsPerRow: number) => {
  const layout: Record<string, number> = {};
  const rowCount = Math.ceil(totalSeats / seatsPerRow);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const remaining = totalSeats - rowIndex * seatsPerRow;
    layout[buildRowLabel(rowIndex)] = Math.min(seatsPerRow, remaining);
  }

  return layout;
};

const buildSeatPayload = (totalSeats: number, seatsPerRow: number) => {
  const rowCount = Math.ceil(totalSeats / seatsPerRow);
  const seats: Array<{ row: string; number: number; type: 'standard' | 'vip' | 'premium'; status: 'active' }> = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = buildRowLabel(rowIndex);
    const remaining = totalSeats - rowIndex * seatsPerRow;
    const seatsInRow = Math.min(seatsPerRow, remaining);

    for (let seatNumber = 1; seatNumber <= seatsInRow; seatNumber += 1) {
      let type: 'standard' | 'vip' | 'premium' = 'standard';

      if (rowIndex >= Math.max(rowCount - 2, 0)) {
        type = 'premium';
      } else if (rowIndex >= Math.max(rowCount - 4, 0)) {
        type = 'vip';
      }

      seats.push({
        row,
        number: seatNumber,
        type,
        status: 'active',
      });
    }
  }

  return seats;
};

type Props = NativeStackScreenProps<AdminCinemaStackParamList, 'AdminScreenRoomCreate'>;

export const AdminScreenRoomCreateScreen: React.FC<Props> = ({ route, navigation }) => {
  const queryClient = useQueryClient();
  const { cinemaId } = route.params;
  const [roomName, setRoomName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [tech, setTech] = useState<(typeof techOptions)[number]>('Standard 4K');
  const [audio, setAudio] = useState<(typeof audioOptions)[number]>('Dolby Atmos');
  const [seatsPerRow, setSeatsPerRow] = useState<(typeof seatsPerRowOptions)[number]>(8);

  const { data: cinemaName } = useQuery({
    queryKey: ['cinema-room-create', cinemaId],
    queryFn: async () => {
      const payload = unwrapApiData<any>(await apiClient.get(`/cinemas/${cinemaId}`));
      return String(toRecord(payload.cinema).name || 'Cinema');
    },
  });

  const totalSeats = Number(capacity || 0);
  const seatLayout = useMemo(
    () => (totalSeats > 0 ? buildSeatLayout(totalSeats, seatsPerRow) : {}),
    [seatsPerRow, totalSeats]
  );
  const previewRows = Object.entries(seatLayout).slice(0, 6);

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = roomName.trim();
      const parsedCapacity = Number(capacity);

      if (!trimmedName) {
        throw new Error('Room name is required.');
      }

      if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
        throw new Error('Total seat capacity must be a positive integer.');
      }

      const screenResponse = await apiClient.post(`/admin/cinemas/${cinemaId}/screens`, {
        name: trimmedName,
        totalSeats: parsedCapacity,
        seatLayout: buildSeatLayout(parsedCapacity, seatsPerRow),
        projectionType: tech,
        audioSystem: audio,
        status: 'active',
      });

      const createdScreen = unwrapApiData<any>(screenResponse);
      const screenId = getId(createdScreen);

      await apiClient.post(`/admin/screens/${screenId}/seats/bulk`, {
        seats: buildSeatPayload(parsedCapacity, seatsPerRow),
      });

      return {
        screenId,
        roomName: trimmedName,
      };
    },
    onSuccess: async ({ roomName: createdRoomName }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-cinemas'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-cinema-detail', cinemaId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-showtime-create', cinemaId] }),
        queryClient.invalidateQueries({ queryKey: ['cinema-room-create', cinemaId] }),
      ]);

      Alert.alert(
        'Room Created',
        `${createdRoomName} is ready and can now be selected when adding showtimes.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to create the room.';
      Alert.alert('Create Room Failed', message);
    },
  });

  const handleCycleGrid = () => {
    const currentIndex = seatsPerRowOptions.indexOf(seatsPerRow);
    const nextIndex = (currentIndex + 1) % seatsPerRowOptions.length;
    setSeatsPerRow(seatsPerRowOptions[nextIndex]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Create Movie Room</Text>
          <Text style={styles.headerSubtitle}>{cinemaName || 'Cinema'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BASICS</Text>
          <Text style={styles.sectionTitle}>General Configuration</Text>

          <Text style={styles.inputLabel}>ROOM NAME</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. IMAX Hall 01"
              placeholderTextColor="#666"
              value={roomName}
              onChangeText={setRoomName}
            />
          </View>

          <Text style={styles.inputLabel}>TOTAL SEAT CAPACITY</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="250"
              placeholderTextColor="#666"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
            />
            <MaterialCommunityIcons name="seat-passenger" size={20} color="#f90680" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AV SYSTEMS</Text>
          <Text style={styles.sectionTitle}>Technical Specs</Text>

          <Text style={styles.inputLabel}>PROJECTION TECHNOLOGY</Text>
          <View style={styles.optionList}>
            {techOptions.map((option) => {
              const isActive = tech === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionChip, isActive && styles.optionChipActive]}
                  activeOpacity={0.85}
                  onPress={() => setTech(option)}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>AUDIO SYSTEM</Text>
          <View style={styles.optionList}>
            {audioOptions.map((option) => {
              const isActive = audio === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionChip, isActive && styles.optionChipActive]}
                  activeOpacity={0.85}
                  onPress={() => setAudio(option)}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INTERACTIVE SETUP</Text>
          <Text style={styles.sectionTitle}>Seating Map Preview</Text>

          <View style={styles.mapPlaceholder}>
            <LinearGradient colors={['#f9068030', 'transparent']} style={styles.screenIndicator} />
            <Text style={styles.screenLabel}>SCREEN THIS WAY</Text>

            <View style={styles.gridPreview}>
              {previewRows.length ? (
                previewRows.map(([rowLabel, seatsInRow]) => (
                  <View key={rowLabel} style={styles.gridRow}>
                    {Array.from({ length: Number(seatsInRow) }).map((_, index) => (
                      <View key={`${rowLabel}-${index + 1}`} style={styles.gridCell} />
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.previewText}>Enter a seat capacity to generate the room layout preview.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.editGridButton} activeOpacity={0.85} onPress={handleCycleGrid}>
              <MaterialCommunityIcons name="grid-large" size={16} color="#fff" />
              <Text style={styles.editGridText}>EDIT GRID</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.gridSummary}>
            {totalSeats > 0
              ? `${Object.keys(seatLayout).length} rows • ${seatsPerRow} seats per row target`
              : 'Capacity determines rows and seat count automatically.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.88}
          onPress={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          <LinearGradient colors={['#f90680', '#c20464']} style={styles.btnGradient}>
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Room</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0a12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#1a141e', justifyContent: 'center', alignItems: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#f90680', fontSize: 10, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  headerSpacer: { width: 44 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  section: { marginBottom: 35 },
  sectionLabel: { color: '#f90680', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputLabel: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a141e', borderRadius: 15, paddingHorizontal: 15, height: 60, marginBottom: 20, borderWidth: 1, borderColor: '#251d2a' },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  optionList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  optionChip: { backgroundColor: '#1a141e', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#251d2a' },
  optionChipActive: { borderColor: '#f90680', backgroundColor: '#f9068015' },
  optionText: { color: '#fff', fontSize: 14 },
  optionTextActive: { color: '#f90680', fontWeight: '700' },
  mapPlaceholder: { backgroundColor: '#1a141e', borderRadius: 25, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#251d2a' },
  screenIndicator: { width: '80%', height: 4, borderRadius: 2, marginBottom: 15 },
  screenLabel: { color: '#666', fontSize: 10, letterSpacing: 3, marginBottom: 25 },
  gridPreview: { gap: 8, minHeight: 120, justifyContent: 'center' },
  gridRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  gridCell: { width: 15, height: 15, borderRadius: 3, backgroundColor: '#251d2a', borderWidth: 1, borderColor: '#333' },
  previewText: { color: '#777', fontSize: 12, textAlign: 'center', maxWidth: 220, lineHeight: 18 },
  editGridButton: { position: 'absolute', bottom: 15, right: 15, backgroundColor: '#251d2a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  editGridText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 8 },
  gridSummary: { color: '#8f8794', fontSize: 12, marginTop: 12 },
  createButton: { height: 60, borderRadius: 20, overflow: 'hidden', shadowColor: '#f90680', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  bottomSpacer: { height: 40 },
});

export default AdminScreenRoomCreateScreen;
