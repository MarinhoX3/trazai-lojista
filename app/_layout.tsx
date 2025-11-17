import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { AuthLojaProvider, useAuthLoja } from '../src/api/contexts/AuthLojaContext';
import { PedidosAtivosProvider } from '../src/api/contexts/PedidosAtivosContext';
import { StripeProvider } from '@stripe/stripe-react-native';

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

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
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
