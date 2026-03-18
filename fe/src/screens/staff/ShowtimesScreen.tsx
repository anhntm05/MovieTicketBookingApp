import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeShowtime, unwrapApiData } from '../../api/transformers';
import { Showtime } from '../../types/models';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export const ShowtimesScreen = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State (Strings for simplicity in this demo)
  const [movieId, setMovieId] = useState('');
  const [screenId, setScreenId] = useState('');
  const [price, setPrice] = useState('');
  const [startTime, setStartTime] = useState('');

  const { data: showtimes, isLoading } = useQuery<Showtime[]>({
    queryKey: ['staff-showtimes'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/showtimes?status=all'));
      return data.map(normalizeShowtime);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => apiClient.post('/showtimes', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-showtimes'] });
      setModalVisible(false);
      setMovieId('');
      setScreenId('');
      setPrice('');
      setStartTime('');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to create'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/showtimes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-showtimes'] }),
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to delete'),
  });

  const handleSave = () => {
    // Generate an end time +2 hours for demo purposes
    const dStart = new Date(startTime || Date.now());
    const dEnd = new Date(dStart.getTime() + 2 * 60 * 60 * 1000);

    createMutation.mutate({
      movie: movieId,
      screen: screenId,
      price: parseFloat(price),
      startTime: dStart.toISOString(),
      endTime: dEnd.toISOString(),
    });
  };

  const renderItem = ({ item }: { item: Showtime }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.movieTitle}>{item.movie?.title || item.movieId}</Text>
        <Text style={styles.movieSubtitle}>
          {new Date(item.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • ${item.price}
        </Text>
      </View>
      <Button 
        title="Del" 
        variant="danger" 
        onPress={() => deleteMutation.mutate(item.id)} 
        style={styles.actionBtn} 
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Showtimes</Text>
        <Button title="+ Add" onPress={() => setModalVisible(true)} style={styles.addButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={showtimes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal for Create */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Showtime</Text>
          <Text style={{color: theme.colors.textSecondary, marginBottom: 10}}>*In a real app these would be picker components</Text>

          <Input label="Movie ID" value={movieId} onChangeText={setMovieId} />
          <Input label="Screen ID" value={screenId} onChangeText={setScreenId} />
          <Input label="Price ($)" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <Input label="Start Time (ISO Date)" value={startTime} onChangeText={setStartTime} placeholder="e.g. 2026-03-20T14:00:00Z" />

          <View style={styles.modalActions}>
            <Button title="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
            <Button title="Save" onPress={handleSave} isLoading={createMutation.isPending} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: { fontSize: theme.typography.sizes.xl, fontWeight: 'bold', color: theme.colors.text },
  addButton: { paddingHorizontal: theme.spacing.md, height: 40 },
  list: { padding: theme.spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  movieTitle: { color: theme.colors.text, fontSize: theme.typography.sizes.md, fontWeight: 'bold' },
  movieSubtitle: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm, marginTop: 4 },
  actionBtn: { height: 36, paddingHorizontal: theme.spacing.sm },
  modalContainer: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.xl, paddingTop: 60 },
  modalTitle: { fontSize: theme.typography.sizes.xl, fontWeight: 'bold', color: theme.colors.text, marginBottom: 10 },
  modalActions: { flexDirection: 'row', marginTop: theme.spacing.xl },
});
