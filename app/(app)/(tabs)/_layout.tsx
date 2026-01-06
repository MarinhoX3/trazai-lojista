"use client";

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * NOTA PARA O AMBIENTE DE DESENVOLVIMENTO:
 * Os erros de "Could not resolve" no Canvas ocorrem porque o ambiente de pré-visualização
 * não tem acesso aos seus ficheiros locais (api, contextos). 
 * No seu projeto real (VS Code), as importações abaixo funcionarão corretamente.
 */

// Importações reais do seu projeto
import api from '../../../src/api/api';
import { useAuthLoja } from '../../../src/api/contexts/AuthLojaContext';

/**
 * COMPONENTE PRINCIPAL (App)
 * Implementa a navegação por abas com design Premium e contagem dinâmica.
 */
export default function App() {
  const insets = useSafeAreaInsets();
  const { loja } = useAuthLoja();
  const [contagemPedidos, setContagemPedidos] = useState(0);

  // Valor animado para o efeito de pulsação do Badge
  const [badgeScale] = useState(new Animated.Value(1));

  useEffect(() => {
    async function fetchContagemPedidos() {
      // Se não houver loja logada, reinicia a contagem
      if (!loja?.id) {
        setContagemPedidos(0);
        return;
      }

      try {
        // Chamada real à sua API para obter a contagem de pedidos ativos
        const response = await api.get(`/pedidos/loja/${loja.id}/pedidos/count`);
        const novoValor = response.data.count || 0;
        
        if (novoValor !== contagemPedidos) {
          setContagemPedidos(novoValor);
          
          // Efeito visual de animação ao detetar novos pedidos
          if (novoValor > 0) {
            Animated.sequence([
              Animated.timing(badgeScale, { toValue: 1.4, duration: 200, useNativeDriver: true }),
              Animated.spring(badgeScale, { toValue: 1, friction: 4, useNativeDriver: true }),
            ]).start();
          }
        }
      } catch (error) {
        console.error('Erro ao buscar contagem de pedidos:', error);
        setContagemPedidos(0);
      }
    }

    fetchContagemPedidos();
    // Intervalo de 10 segundos conforme solicitado
    const interval = setInterval(fetchContagemPedidos, 10000);
    return () => clearInterval(interval);
  }, [loja?.id, contagemPedidos]);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#2563eb', // Azul Premium
          tabBarInactiveTintColor: '#94a3b8', // Cinza Slate
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 10,
            borderTopColor: '#f1f5f9',
            
            /** * Ajuste de altura para garantir visibilidade acima dos ícones do sistema.
             */
            height: Platform.OS === 'ios' ? 90 : 70, 
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
            paddingTop: 10,
            
            // Sombras suaves para aspeto moderno
            elevation: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
        }}
      >
        {/* ABA: DASHBOARD (Ícone Grelha/Grid) */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Início',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={styles.activeIndicator} />}
                <Ionicons 
                  name={focused ? "grid" : "grid-outline"} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
          }}
        />

        {/* ABA: PEDIDOS */}
        <Tabs.Screen
          name="pedidos-loja"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconWrapper}>
                {focused && <View style={styles.activeIndicator} />}
                <Ionicons 
                  name={focused ? "receipt" : "receipt-outline"} 
                  size={24} 
                  color={color} 
                />
                {contagemPedidos > 0 && (
                  <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                    <Text style={styles.badgeText}>
                      {contagemPedidos > 99 ? '99+' : contagemPedidos}
                    </Text>
                  </Animated.View>
                )}
              </View>
            ),
          }}
        />
        
         {/* ABA: FINANCEIRO */}
        <Tabs.Screen
          name="financeiro"
          options={{
            title: 'Financeiro',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={styles.activeIndicator} />}
                <Ionicons 
                  name={focused ? "wallet" : "wallet-outline"} 
                  size={24} 
                  color={color} 
                />
              </View>
            ),
          }}
        />

       {/* ABA: PERFIL */}
        <Tabs.Screen
          name="edit-loja"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={styles.activeIndicator} />}
                <Ionicons 
                  name={focused ? "person-circle" : "person-circle-outline"} 
                  size={26} 
                  color={color} 
                />
              </View>
            ),
          }}
        />

      </Tabs>

      {/* Área segura inferior para dispositivos com notch */}
      <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563eb',
  },
  // Badge de Notificação Estilizado
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    paddingHorizontal: 2,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  bottomSafeArea: {
    backgroundColor: '#ffffff',
    width: '100%',
  },
});