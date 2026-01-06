"use client";

import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  Platform, 
  StyleSheet, 
  StatusBar 
} from "react-native";
import { AuthLojaProvider, useAuthLoja } from "../src/api/contexts/AuthLojaContext";
import { PedidosAtivosProvider } from "../src/api/contexts/PedidosAtivosContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import * as Notifications from "expo-notifications";

import Splash from "./splash";

/**
 * COMPONENTE PRINCIPAL (App)
 * Gerencia os Providers globais da aplicação.
 */
export default function App() {
  return (
    <AuthLojaProvider>
      <PedidosAtivosProvider>
        {/* Usando a chave de teste ou live conforme configurado no financeiro anteriormente */}
        <StripeProvider publishableKey="pk_live_51RhcOpDK4gB80CI0e18vr6pZQDfX3jKom5lbMWEWJnxunMh4LqU6JZk7qH4pI8lONxtmVZfzWQaKAvfXwkR0fpZb00m8CtjxcG">
          <RootNavigation />
        </StripeProvider>
      </PedidosAtivosProvider>
    </AuthLojaProvider>
  );
}

/**
 * LÓGICA DE NAVEGAÇÃO E ESTADOS INICIAIS
 */
function RootNavigation() {
  const { loja, loading } = useAuthLoja();
  const [showSplash, setShowSplash] = useState(true);

  // Configuração de Canais de Notificação (Android)
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563eb",
      });
    }
  }, []);

  // Hook global para Push Notifications
  usePushNotifications(loja?.id);

  // Temporizador para a Splash Screen (2.5 segundos)
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // 1. Renderiza a Splash Screen se o tempo ainda não decorreu
  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  // 2. Renderiza um estado de carregamento Premium enquanto os dados da Auth são validados
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingTitle}>A preparar o seu painel</Text>
          <Text style={styles.loadingSubtitle}>A validar as credenciais da loja...</Text>
        </View>
      </View>
    );
  }

  // 3. Switch de Navegação baseado na autenticação (Lojista logado ou não)
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!loja ? (
          <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
        ) : (
          <Stack.Screen name="(app)" options={{ gestureEnabled: false }} />
        )}
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingTitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
    textAlign: "center",
  },
});