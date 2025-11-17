// app/(app)/(tabs)/_layout.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../src/api/api';
import { useAuthLoja } from '../../../src/api/contexts/AuthLojaContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { loja } = useAuthLoja();
  const [contagemPedidos, setContagemPedidos] = useState(0);

  useEffect(() => {
    async function fetchContagemPedidos() {
      if (!loja?.id) return;
      try {
        const response = await api.get(`/pedidos/loja/${loja.id}/pedidos/count`);
        setContagemPedidos(response.data.count || 0);
      } catch (error) {
        console.error('Erro ao buscar contagem de pedidos:', error);
        setContagemPedidos(0);
      }
    }

    fetchContagemPedidos();
    const interval = setInterval(fetchContagemPedidos, 10000);
    return () => clearInterval(interval);
  }, [loja?.id]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#007BFF',
          tabBarInactiveTintColor: '#555',
          tabBarStyle: {
            paddingBottom: 5,
            height: 60,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Início',
            tabBarIcon: ({ color }: { color: string }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pedidos-loja"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color }: { color: string }) => (
              <View>
                <Ionicons name="receipt-outline" size={24} color={color} />
                {contagemPedidos > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{contagemPedidos}</Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
  name="financeiro"
  options={{
    title: 'Financeiro',
    tabBarIcon: ({ color }) => (
      <Ionicons name="wallet-outline" size={24} color={color} />
    ),
  }}
/>

        <Tabs.Screen
          name="edit-loja"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }: { color: string }) => (
              <Ionicons name="person-circle-outline" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Espaço seguro para dispositivos com notch/barra inferior */}
      <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bottomSafeArea: {
    backgroundColor: 'black',
    width: '100%',
  },
});
