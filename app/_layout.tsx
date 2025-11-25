// app/_layout.tsx
import React, { useEffect } from "react";
import { Stack, SplashScreen } from "expo-router";
import { View, Text, ActivityIndicator, Platform } from "react-native";
import { AuthLojaProvider, useAuthLoja } from "../src/api/contexts/AuthLojaContext";
import { PedidosAtivosProvider } from "../src/api/contexts/PedidosAtivosContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import * as Notifications from "expo-notifications";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthLojaProvider>
      <PedidosAtivosProvider>
        <StripeProvider publishableKey="pk_test_XXXX">
          <RootNavigation />
        </StripeProvider>
      </PedidosAtivosProvider>
    </AuthLojaProvider>
  );
}

function RootNavigation() {
  const { loja, loading } = useAuthLoja();

  // 🔥 CRIA O CANAL DE NOTIFICAÇÃO ANTES DE CHAMAR O HOOK
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }, []);

  // 🔥 Agora o hook pode rodar SEM PROBLEMAS
  usePushNotifications(loja?.id);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!loja ? (
        <Stack.Screen name="(auth)" />
      ) : (
        <Stack.Screen name="(app)" />
      )}
    </Stack>
  );
}
