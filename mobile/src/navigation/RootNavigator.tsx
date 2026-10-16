import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

// Screens
import { BootstrapScreen } from '../screens/Auth/BootstrapScreen';
import { PinLockScreen } from '../screens/Auth/PinLockScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { CuadreScreen } from '../screens/Cuadre/CuadreScreen';
import { AccountsScreen } from '../screens/Accounts/AccountsScreen';
import { ThirdsScreen } from '../screens/Thirds/ThirdsScreen';
import { ProjectsScreen } from '../screens/Projects/ProjectsScreen';

const Tab = createBottomTabNavigator();

export const RootNavigator: React.FC = () => {
  const { isLoading, isBootstrapped, isAuthenticated, isLocked } = useAuth();
  const [preferLoginScreen, setPreferLoginScreen] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentGold} />
      </View>
    );
  }

  // 1. Si el sistema es nuevo y nunca se ha configurado la cuenta maestra VIP
  if (!isBootstrapped) {
    return <BootstrapScreen />;
  }

  // 2. Si la app está bloqueada por PIN o no se ha autenticado
  if (!isAuthenticated || isLocked) {
    if (preferLoginScreen) {
      return <LoginScreen onSwitchToPin={() => setPreferLoginScreen(false)} />;
    }
    return <PinLockScreen onSwitchToLogin={() => setPreferLoginScreen(true)} />;
  }

  // 3. Navegación Principal autenticada
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: Colors.accentGold,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            backgroundColor: '#0A0E1A',
            borderTopWidth: 1.2,
            borderTopColor: Colors.borderGlass,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any = 'square';
            if (route.name === 'Inicio') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Cuadre') {
              iconName = focused ? 'calculator' : 'calculator-outline';
            } else if (route.name === 'Cuentas') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'Terceros') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Proyectos') {
              iconName = focused ? 'briefcase' : 'briefcase-outline';
            }
            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={DashboardScreen} />
        <Tab.Screen name="Cuadre" component={CuadreScreen} />
        <Tab.Screen name="Cuentas" component={AccountsScreen} />
        <Tab.Screen name="Terceros" component={ThirdsScreen} />
        <Tab.Screen name="Proyectos" component={ProjectsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
