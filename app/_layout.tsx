import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { View, Text, ActivityIndicator, Platform } from "react-native";
import { AuthLojaProvider, useAuthLoja } from "../src/api/contexts/AuthLojaContext";
import { PedidosAtivosProvider } from "../src/api/contexts/PedidosAtivosContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import * as Notifications from "expo-notifications";

import Splash from "./splash";

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

  const [showSplash, setShowSplash] = useState(true);

  // 🔔 sempre chamado
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

  // 🔔 sempre chamado
  usePushNotifications(loja?.id);

  // timer da splash (também SEM condicional)
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(t);
  }, []);

  // 👉 AQUI só troca o que renderiza (SEM mudar hooks)
  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

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
