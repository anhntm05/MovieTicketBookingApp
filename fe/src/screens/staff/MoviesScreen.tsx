import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Movie } from '../../types/models';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export const MoviesScreen = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [posterUrl, setPosterUrl] = useState('');

  const { data: movies, isLoading } = useQuery<Movie[]>({
    queryKey: ['staff-movies'],
    queryFn: async () => {
      const { data } = await apiClient.get('/movies');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newMovie: any) => apiClient.post('/movies', newMovie),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-movies'] });
      closeModal();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string, payload: any }) => apiClient.put(`/movies/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-movies'] });
      closeModal();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/movies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-movies'] }),
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to delete'),
  });

  const openModal = (movie?: Movie) => {
    if (movie) {
      setEditingMovie(movie);
      setTitle(movie.title);
      setDescription(movie.description);
      setDuration(movie.duration.toString());
      setPosterUrl(movie.posterUrl || '');
    } else {
      setEditingMovie(null);
      setTitle('');
      setDescription('');
      setDuration('');
      setPosterUrl('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingMovie(null);
  };

  const handleSave = () => {
    const payload = {
      title,
      description,
      duration: parseInt(duration, 10),
      posterUrl,
      releaseDate: new Date().toISOString(), // Simplified for demo
      status: 'PUBLISHED',
    };

    if (editingMovie) {
      updateMutation.mutate({ id: editingMovie.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Movie', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const renderMovie = ({ item }: { item: Movie }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.movieTitle}>{item.title}</Text>
        <Text style={styles.movieSubtitle}>{item.duration} mins • {item.status}</Text>
      </View>
      <View style={styles.cardActions}>
        <Button title="Edit" variant="outline" onPress={() => openModal(item)} style={styles.actionBtn} />
        <Button title="Del" variant="danger" onPress={() => handleDelete(item.id)} style={styles.actionBtn} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Movies</Text>
        <Button title="+ Add Movie" onPress={() => openModal()} style={styles.addButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id}
          renderItem={renderMovie}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal for Create/Edit */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{editingMovie ? 'Edit Movie' : 'Add Movie'}</Text>
          
          <Input label="Title" value={title} onChangeText={setTitle} />
          <Input label="Description" value={description} onChangeText={setDescription} multiline />
          <Input label="Duration (mins)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
          <Input label="Poster URL" value={posterUrl} onChangeText={setPosterUrl} autoCapitalize="none" />

          <View style={styles.modalActions}>
            <Button 
              title="Cancel" 
              variant="outline" 
              onPress={closeModal} 
              style={{ flex: 1, marginRight: 8 }} 
            />
            <Button 
              title="Save" 
              onPress={handleSave} 
              isLoading={createMutation.isPending || updateMutation.isPending} 
              style={{ flex: 1 }} 
            />
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
    alignItems: 'center',
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
  cardInfo: { flex: 1, marginRight: theme.spacing.sm },
  movieTitle: { color: theme.colors.text, fontSize: theme.typography.sizes.md, fontWeight: 'bold' },
  movieSubtitle: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm, marginTop: 4 },
  cardActions: { flexDirection: 'row' },
  actionBtn: { height: 36, paddingHorizontal: theme.spacing.sm, marginLeft: 8 },
  modalContainer: {
    flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.xl, paddingTop: 60,
  },
  modalTitle: { fontSize: theme.typography.sizes.xl, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 },
  modalActions: { flexDirection: 'row', marginTop: theme.spacing.xl },
});
