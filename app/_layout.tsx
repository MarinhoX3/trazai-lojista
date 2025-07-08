import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { AuthLojaProvider } from '../src/api/contexts/AuthLojaContext';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
  const router = useRouter();

  return (
    <AuthLojaProvider>
      <StripeProvider
          publishableKey="pk_test_SUA_CHAVE_PUBLICAVEL_AQUI" // <-- LEMBRE-SE DE COLOCAR A SUA CHAVE PUBLICÁVEL
      >
          <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="dashboard" options={{ headerShown: false }} />

              <Stack.Screen name="register" options={{ title: 'Cadastro de Loja' }} />
              <Stack.Screen name="edit-loja" options={{ title: 'Editar Dados da Loja' }} />
              <Stack.Screen name="create-product" options={{ title: 'Adicionar Novo Produto' }} />
              <Stack.Screen name="edit-product" options={{ title: 'Editar Produto' }} />
              <Stack.Screen name="historico-pedidos" options={{ title: 'Histórico de Pedidos' }}/>
              <Stack.Screen name="imprimir-pedido" options={{ title: 'Imprimir Cupom' }}/>

              <Stack.Screen 
                name="pedidos-loja" 
                options={{ 
                  title: 'Pedidos Ativos',
                  headerRight: () => (
                      <Pressable onPress={() => router.push('/historico-pedidos')} style={{ marginRight: 15 }}>
                          <Ionicons name="archive-outline" size={24} color="#007BFF" />
                      </Pressable>
                  )
                }} 
              />
          </Stack>
      </StripeProvider>
    </AuthLojaProvider>
  );
}
