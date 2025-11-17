import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { AuthLojaProvider, useAuthLoja } from '../src/api/contexts/AuthLojaContext';
import { PedidosAtivosProvider } from '../src/api/contexts/PedidosAtivosContext';
import { StripeProvider } from '@stripe/stripe-react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthLojaProvider>
      <PedidosAtivosProvider>
        <StripeProvider publishableKey="pk_test_51RhcOyD1ANZNVvcx26pdZ0aueqotnqyYc7yP7QTKFNWvujPT6EwGCDwhzg1MeEbk5CENAaTEswgAYqn7KH5YMh6z00KcsS2jnS">
          <RootLayoutNav />
        </StripeProvider>
      </PedidosAtivosProvider>
    </AuthLojaProvider>
  );
}

function RootLayoutNav() {
  const { loja, loading } = useAuthLoja();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{ marginTop: 10 }}>Carregando dados da loja...</Text>
      </View>
    );
  }

  // 🔹 NÃO logado → carregue o GRUPO (auth)
  if (!loja) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
      </Stack>
    );
  }

  // 🔹 Logado → carregue o GRUPO (app)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
