import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainTabName, MainTabNavigation } from './MainTabNavigation';

interface CustomerLayoutProps {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

const customerTabs: MainTabName[] = ['Home', 'Cinemas', 'Bookings', 'Profile'];

const isMainTab = (routeName?: string): routeName is MainTabName =>
  customerTabs.includes(routeName as MainTabName);

const findActiveTab = (state: any): MainTabName => {
  if (!state?.routes?.length) return 'Home';

  const activeRoute = state.routes[state.index ?? 0];
  if (isMainTab(activeRoute?.name)) {
    return activeRoute.name;
  }

  const customerMainRoute = state.routes.find((route: any) => route.name === 'CustomerMain');
  if (customerMainRoute?.state) {
    return findActiveTab(customerMainRoute.state);
  }

  if (activeRoute?.state) {
    return findActiveTab(activeRoute.state);
  }

  return 'Home';
};

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  contentStyle,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const activeTab = isMainTab(route.name) ? route.name : findActiveTab(navigation.getState());

  const handleTabPress = (tabName: MainTabName) => {
    navigation.navigate('CustomerMain', { screen: tabName });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      <MainTabNavigation activeTab={activeTab} onTabPress={handleTabPress} />
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
