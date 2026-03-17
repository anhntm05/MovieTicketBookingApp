import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';

// Mock User type since it's not fully defined in models for Admin view
type UserData = {
  id: string;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
};

export const UsersScreen = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<UserData[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users');
      return data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return apiClient.put(`/users/${id}/role`, { role });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err: any) => Alert.alert('Error', err.response?.data?.message || 'Failed to update user'),
  });

  const handlePromote = (user: UserData) => {
    let nextRole = 'CUSTOMER';
    if (user.role === 'CUSTOMER') nextRole = 'STAFF';
    else if (user.role === 'STAFF') nextRole = 'ADMIN';
    else return;

    Alert.alert('Promote User', `Change ${user.fullName}'s role to ${nextRole}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => roleMutation.mutate({ id: user.id, role: nextRole }) },
    ]);
  };

  const renderItem = ({ item }: { item: UserData }) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={styles.roleInfo}>
        <Text style={styles.roleBadge}>{item.role}</Text>
        {item.role !== 'ADMIN' && (
          <Button 
            title="Promote" 
            variant="outline" 
            style={styles.actionBtn} 
            onPress={() => handlePromote(item)} 
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Users</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: { fontSize: theme.typography.sizes.xl, fontWeight: 'bold', color: theme.colors.text },
  list: { padding: theme.spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { color: theme.colors.text, fontSize: theme.typography.sizes.md, fontWeight: 'bold' },
  userEmail: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm },
  roleInfo: { alignItems: 'flex-end' },
  roleBadge: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionBtn: { height: 30, paddingHorizontal: theme.spacing.sm, paddingVertical: 0 },
});
