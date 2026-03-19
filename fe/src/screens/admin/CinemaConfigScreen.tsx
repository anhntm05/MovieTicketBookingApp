import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Modal, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { normalizeCinema, unwrapApiData } from '../../api/transformers';
import { Cinema } from '../../types/models';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export const CinemaConfigScreen = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');

  const { data: cinemas = [], isLoading, isRefetching, refetch, isError } = useQuery<Cinema[]>({
    queryKey: ['admin-cinemas'],
    queryFn: async () => {
      const data = unwrapApiData<unknown[]>(await apiClient.get('/cinemas?status=all&limit=100'));
      return data.map(normalizeCinema);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; location: string; address: string; facilities: string[]; status: 'active' }) => {
      const response = await apiClient.post('/cinemas', payload);
      return normalizeCinema(unwrapApiData(response));
    },
    onSuccess: async (createdCinema) => {
      queryClient.setQueryData<Cinema[]>(['admin-cinemas'], (current = []) => {
        const withoutCreatedCinema = current.filter((cinema) => cinema.id !== createdCinema.id);
        return [createdCinema, ...withoutCreatedCinema];
      });

      await refetch();
      setModalVisible(false);
      setName('');
      setLocation('');
      setAddress('');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to create'),
  });

  const handleSave = () => {
    if (!name || !location || !address) {
      Alert.alert('Error', 'Name, location, and address are required');
      return;
    }
    createMutation.mutate({ name, location, address, facilities: [], status: 'active' });
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
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Cinemas & Screens</Text>
        <Button title="+ Add" onPress={() => setModalVisible(true)} style={styles.addButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load cinemas.</Text>
          <Button title="Retry" onPress={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={cinemas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}

      {/* Modal for Create */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Cinema</Text>

          <Input label="Cinema Name" value={name} onChangeText={setName} />
          <Input label="Location" value={location} onChangeText={setLocation} />
          <Input label="Address" value={address} onChangeText={setAddress} />

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  headerSpacer: { width: 84 },
  headerTitle: {
    ...theme.typography.pageTitle,
    flex: 1,
    color: theme.colors.text,
    textAlign: 'center',
  },
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
  errorText: { color: theme.colors.error, marginBottom: theme.spacing.md },
  activeBadge: { backgroundColor: theme.colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: theme.colors.surface, fontSize: 10, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.xl, paddingTop: 60 },
  modalTitle: { fontSize: theme.typography.sizes.xl, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 },
  modalActions: { flexDirection: 'row', marginTop: theme.spacing.xl },
});
