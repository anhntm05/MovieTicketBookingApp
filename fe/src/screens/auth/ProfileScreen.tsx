import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';

export const ProfileScreen = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');

  // Fetch Current Profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile');
      setFullName(response.data.fullName);
      return response.data;
    },
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string }) => {
      return apiClient.put('/users/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleUpdate = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name cannot be empty');
      return;
    }
    updateProfileMutation.mutate({ fullName });
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        // Clear tanstack query cache to prevent data leak
        queryClient.clear();
        await logout();
      }},
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: theme.colors.text, fontSize: 18, marginBottom: 20 }}>Please log in to view your profile and bookings</Text>
        <Button title="Go to Login" onPress={() => navigation.navigate('Login')} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile Details</Text>

        <Input
          label="Email"
          value={profile?.email}
          editable={false}
          style={styles.disabledInput}
        />

        <Input
          label="Role"
          value={profile?.role}
          editable={false}
          style={styles.disabledInput}
        />

        <Input
          label="Full Name"
          value={isEditing ? fullName : profile?.fullName}
          onChangeText={setFullName}
          editable={isEditing}
          style={!isEditing && styles.disabledInput}
        />

        {isEditing ? (
          <View style={styles.actions}>
            <Button
              title="Save Changes"
              onPress={handleUpdate}
              isLoading={updateProfileMutation.isPending}
              style={{ flex: 1, marginRight: theme.spacing.sm }}
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => {
                setIsEditing(false);
                setFullName(profile?.fullName);
              }}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <Button
            title="Edit Profile"
            variant="secondary"
            onPress={() => setIsEditing(true)}
            style={styles.actionButton}
          />
        )}

        <Button
          title="Logout"
          variant="danger"
          onPress={handleLogout}
          style={[styles.actionButton, styles.logoutButton]}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  disabledInput: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  actionButton: {
    marginTop: theme.spacing.md,
  },
  logoutButton: {
    marginTop: theme.spacing.xxl,
  },
});
