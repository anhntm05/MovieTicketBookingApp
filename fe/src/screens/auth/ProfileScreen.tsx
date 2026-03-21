import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerTabParamList, RootStackParamList } from '../../types/navigation';
import { Button } from '../../components/Button';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { normalizeProfile, ProfileData, unwrapApiData } from '../../api/transformers';

const AVATAR_PLACEHOLDER =
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=300';

const formatRoleLabel = (role?: string) => (role || 'CUSTOMER').replace(/_/g, ' ').toUpperCase();

export const ProfileScreen = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const profileData = normalizeProfile(unwrapApiData(await apiClient.get('/users/profile')));
      setFullName(profileData.fullName);
      return profileData;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string }) => apiClient.put('/users/profile', { name: data.fullName }),
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

    updateProfileMutation.mutate({ fullName: fullName.trim() });
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          queryClient.clear();
          await logout();
        },
      },
    ]);
  };

  const handleSwitchAccount = async () => {
    queryClient.clear();
    await logout();
    navigation.navigate('Login');
  };

  const handleNotificationsPress = () => {
    if (profile?.role !== 'CUSTOMER') {
      Alert.alert('Not available', 'Notifications screen is only available for customer accounts.');
      return;
    }

    const parentNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
    parentNavigation?.navigate('CustomerMain', {
      screen: 'Tabs',
      params: { screen: 'Notifications' as keyof CustomerTabParamList },
    });
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.centerContainer}>
          <Text style={styles.loggedOutText}>Please log in to view your profile and bookings.</Text>
          <Button title="Go to Login" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell-outline' as const,
      onPress: handleNotificationsPress,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: 'lock-outline' as const,
      onPress: () => Alert.alert('Not available', 'Privacy settings are not implemented yet.'),
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'logout' as const,
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        {/* <TouchableOpacity
          style={styles.headerAction}
          activeOpacity={0.85}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Profile</Text>
        {/* <View style={styles.headerAction} /> */}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: AVATAR_PLACEHOLDER }} style={styles.avatar} />
            <View style={styles.badge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={theme.colors.white} />
            </View>
          </View>

          <Text style={styles.userName}>{profile?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || 'Email unavailable'}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{formatRoleLabel(profile?.role)}</Text>
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editCard}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.editInputContainer}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.editInputIcon}
              />
              <TextInput
                style={styles.editInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.secondaryActionButton, styles.halfAction]}
                activeOpacity={0.85}
                onPress={() => {
                  setIsEditing(false);
                  setFullName(profile?.fullName || '');
                }}
              >
                <Text style={styles.secondaryActionText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryActionButton, styles.halfAction]}
                activeOpacity={0.85}
                onPress={handleUpdate}
                disabled={updateProfileMutation.isPending}
              >
                <Text style={styles.primaryActionText}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.editButton} activeOpacity={0.9} onPress={() => setIsEditing(true)}>
            <MaterialCommunityIcons
              name="pencil"
              size={20}
              color={theme.colors.white}
              style={styles.editIcon}
            />
            <Text style={styles.editButtonText}>Edit Name</Text>
          </TouchableOpacity>
        )}

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                activeOpacity={0.85}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.switchAccountCard}>
          <Text style={styles.switchText}>
            Switching accounts? Sign in with a different profile.
          </Text>
          <TouchableOpacity style={styles.switchButton} activeOpacity={0.85} onPress={handleSwitchAccount}>
            <Text style={styles.switchButtonText}>Sign In to Another Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loggedOutText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerAction: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...theme.typography.pageTitle,
    color: theme.colors.text,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  userName: {
    color: theme.colors.text,
    fontSize: 28,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    marginBottom: 15,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(249, 6, 128, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 10,
  },
  roleText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fontFamilies.bold,
    letterSpacing: 1,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 25,
    marginTop: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  editIcon: {
    marginRight: 10,
  },
  editButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fontFamilies.bold,
  },
  editCard: {
    marginTop: 30,
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  inputLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 10,
    marginLeft: 4,
  },
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 60,
    borderWidth: 1,
    borderColor: '#251d2a',
  },
  editInputIcon: {
    marginRight: 12,
  },
  editInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
  halfAction: {
    flex: 1,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  primaryActionText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: theme.typography.sizes.sm,
  },
  secondaryActionButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryActionText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: theme.typography.sizes.sm,
  },
  settingsSection: {
    marginTop: 40,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fontFamilies.bold,
    marginBottom: 20,
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 25,
    overflow: 'hidden',
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(249, 6, 128, 0.08)',
  },
  menuItemText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
  switchAccountCard: {
    marginTop: 30,
    backgroundColor: 'rgba(26, 20, 30, 0.5)',
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(249, 6, 128, 0.2)',
    alignItems: 'center',
  },
  switchText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: theme.typography.sizes.sm,
    lineHeight: 22,
    marginBottom: 20,
  },
  switchButton: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  switchButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: theme.typography.sizes.sm,
  },
});

export default ProfileScreen;
