import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { AdminTabName, AdminTabNavigation } from './AdminTabNavigation';

interface AdminLayoutProps {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  activeTabOverride?: AdminTabName;
}

const adminTabs: AdminTabName[] = ['Dashboard', 'Revenue', 'Movies', 'Users', 'Cinemas', 'Profile'];

const isAdminTab = (routeName?: string): routeName is AdminTabName =>
  adminTabs.includes(routeName as AdminTabName);

const findActiveTab = (state: any): AdminTabName => {
  if (!state?.routes?.length) return 'Dashboard';

  const activeRoute = state.routes[state.index ?? 0];
  if (isAdminTab(activeRoute?.name)) {
    return activeRoute.name;
  }

  if (activeRoute?.state) {
    return findActiveTab(activeRoute.state);
  }

  return 'Dashboard';
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, contentStyle, activeTabOverride }) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const activeTab = activeTabOverride || (isAdminTab(route.name) ? route.name : findActiveTab(navigation.getState()));

  const handleTabPress = (tabName: AdminTabName) => {
    let currentNavigation: any = navigation;

    while (currentNavigation) {
      const state = currentNavigation.getState?.();
      if (state?.routeNames?.includes(tabName)) {
        currentNavigation.navigate(tabName);
        return;
      }
      currentNavigation = currentNavigation.getParent?.();
    }

    navigation.navigate(tabName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      <AdminTabNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0a12',
  },
  content: {
    flex: 1,
  },
});
