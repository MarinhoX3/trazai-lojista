import React, { useEffect } from 'react';
import { Stack, SplashScreen, useSegments } from 'expo-router';
import { AuthLojaProvider, useAuthLoja } from '../src/api/contexts/AuthLojaContext';
import { PedidosAtivosProvider } from '../src/api/contexts/PedidosAtivosContext';
import { View, ActivityIndicator, Text } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';

// Previna que a tela de splash se esconda automaticamente
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
  const segments = useSegments();

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

  if (!loja) {
    return (
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}
