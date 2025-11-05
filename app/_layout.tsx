import React, { useEffect } from 'react';
import { Stack, Slot, SplashScreen } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { AuthLojaProvider, useAuthLoja } from '../src/api/contexts/AuthLojaContext';
import { PedidosAtivosProvider } from '../src/api/contexts/PedidosAtivosContext';
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

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  // Enquanto os dados da loja estão carregando
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{ marginTop: 10 }}>Carregando dados da loja...</Text>
      </View>
    );
  }

  // 🔹 Quando o usuário NÃO está logado → renderiza as rotas do grupo (auth)
  if (!loja) {
    return <Slot />;
  }

  // 🔹 Quando o usuário ESTÁ logado → renderiza o grupo (app)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
