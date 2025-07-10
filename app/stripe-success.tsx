import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StripeSuccessScreen() {
  const router = useRouter();

  // Este useEffect será executado assim que a tela for carregada.
  useEffect(() => {
    // Definimos um temporizador para esperar 3 segundos antes de fazer qualquer coisa.
    // Isto dá tempo ao utilizador para ler a mensagem de sucesso.
    const timer = setTimeout(() => {
      // Após 3 segundos, redirecionamos o utilizador para o painel principal.
      // O 'replace' garante que o utilizador não consegue voltar para esta tela de sucesso.
      router.replace('/dashboard');
    }, 3000); // 3000 milissegundos = 3 segundos

    // Esta é uma função de limpeza que será executada se a tela for "desmontada"
    // antes de o temporizador terminar. Garante que não temos temporizadores perdidos.
    return () => clearTimeout(timer);
  }, []); // O array vazio [] significa que este efeito só é executado uma vez.

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
      
      <Text style={styles.title}>Sucesso!</Text>
      
      <Text style={styles.subtitle}>
        A sua conta de pagamentos foi configurada.
      </Text>

      <ActivityIndicator size="large" color="#888" style={styles.spinner} />
      
      <Text style={styles.redirectText}>
        A redirecioná-lo para o painel...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  spinner: {
    marginTop: 40,
  },
  redirectText: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
  },
});
