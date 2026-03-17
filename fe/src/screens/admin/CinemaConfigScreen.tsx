import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { Cinema } from '../../types/models';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export const CinemaConfigScreen = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const { data: cinemas, isLoading } = useQuery<Cinema[]>({
    queryKey: ['admin-cinemas'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cinemas');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; location: string; status: 'ACTIVE' }) => {
      return apiClient.post('/cinemas', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cinemas'] });
      setModalVisible(false);
      setName('');
      setLocation('');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to create'),
  });

  const handleSave = () => {
    if (!name || !location) {
      Alert.alert('Error', 'Name and location are required');
      return;
    }
    createMutation.mutate({ name, location, status: 'ACTIVE' });
  };

  const renderItem = ({ item }: { item: Cinema }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.location}</Text>
      </View>
      <View style={styles.activeBadge}>
        <Text style={styles.badgeText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cinemas & Screens</Text>
        <Button title="+ Add" onPress={() => setModalVisible(true)} style={styles.addButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={cinemas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Modal for Create */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Cinema</Text>

          <Input label="Cinema Name" value={name} onChangeText={setName} />
          <Input label="Location" value={location} onChangeText={setLocation} />

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
    justifyContent: 'space-between',
  },
  info: { flex: 1 },
  title: { color: theme.colors.text, fontSize: theme.typography.sizes.md, fontWeight: 'bold' },
  subtitle: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm },
  activeBadge: { backgroundColor: theme.colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: theme.colors.surface, fontSize: 10, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.xl, paddingTop: 60 },
  modalTitle: { fontSize: theme.typography.sizes.xl, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 },
  modalActions: { flexDirection: 'row', marginTop: theme.spacing.xl },
});
