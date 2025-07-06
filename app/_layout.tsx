import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { AuthLojaProvider } from '../src/api/contexts/AuthLojaContext';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// NOVO: Importe o StripeProvider
import { StripeProvider } from '@stripe/stripe-react-native';

// Este é o ficheiro de layout principal do seu app-lojista.
// Ele controla a navegação e a aparência dos cabeçalhos de todas as telas.
export default function RootLayout() {
  const router = useRouter();

  return (
    // O AuthLojaProvider continua envolvendo toda a aplicação.
    <AuthLojaProvider>
        {/* NOVO: StripeProvider envolve a navegação para habilitar pagamentos */}
        <StripeProvider
            publishableKey="pk_test_SUA_CHAVE_PUBLICAVEL_AQUI" // <-- COLOQUE SUA CHAVE PUBLICÁVEL AQUI
        >
            <Stack>
                {/* 2. Definimos aqui cada tela da nossa aplicação */}

                {/* Telas que não devem ter cabeçalho visível */}
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="dashboard" options={{ headerShown: false }} />

                {/* Telas com títulos simples */}
                <Stack.Screen name="register" options={{ title: 'Cadastro de Loja' }} />
                <Stack.Screen name="edit-loja" options={{ title: 'Editar Dados da Loja' }} />
                <Stack.Screen name="create-product" options={{ title: 'Adicionar Novo Produto' }} />
                <Stack.Screen name="edit-product" options={{ title: 'Editar Produto' }} />
                <Stack.Screen name="historico-pedidos" options={{ title: 'Histórico de Pedidos' }}/>
                <Stack.Screen name="imprimir-pedido" options={{ title: 'Imprimir Cupom' }}/>

                {/* Tela de Pedidos com um botão customizado no cabeçalho */}
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