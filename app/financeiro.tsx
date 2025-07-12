import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { useAuthLoja } from '../src/api/contexts/AuthLojaContext';
import api from '../src/api/api';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

export default function FinanceiroScreen() {
  const { loja } = useAuthLoja();
  const [totalComissao, setTotalComissao] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchComissoes = useCallback(async () => {
    if (!loja?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/lojas/${loja.id}/comissoes`);
      setTotalComissao(response.data.total_comissao);
    } catch (error) {
      console.error("Erro ao buscar comissões:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  }, [loja?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchComissoes();
    }, [fetchComissoes])
  );

  const handlePagarComissao = async () => {
    if (!loja?.id) return;
    
    if (totalComissao <= 0) {
        Alert.alert("Tudo em dia!", "Você não tem comissões pendentes para pagar.");
        return;
    }

    setPaymentLoading(true);
    try {
        const response = await api.post(`/lojas/${loja.id}/pagar-comissao`);
        const { url } = response.data;

        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Erro", `Não foi possível abrir o link. Copie e cole no seu navegador: ${url}`);
        }

    } catch (error: any) {
        const message = error.response?.data?.message || "Não foi possível gerar o link de pagamento.";
        Alert.alert("Erro", message);
    } finally {
        setPaymentLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Financeiro' }} />
      <View style={styles.content}>
        <Ionicons name="cash-outline" size={80} color="#28a745" />
        <Text style={styles.title}>Suas Comissões</Text>
        <Text style={styles.subtitle}>
          Este é o valor total a ser pago à plataforma referente aos pedidos
          em Dinheiro e Pix.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Valor Pendente</Text>
            <Text style={styles.cardValue}>
              R$ {Number(totalComissao).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
            {paymentLoading ? (
                <ActivityIndicator size="large" color="#007BFF" />
            ) : (
                <Pressable style={styles.payButton} onPress={handlePagarComissao}>
                    <Text style={styles.payButtonText}>Efetuar Pagamento da Comissão</Text>
                </Pressable>
            )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 30, alignItems: 'center', width: '90%', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardLabel: { fontSize: 18, color: '#6c757d' },
  cardValue: { fontSize: 40, fontWeight: 'bold', color: '#dc3545', marginTop: 10 },
  buttonContainer: { marginTop: 40, width: '90%', height: 50, justifyContent: 'center' },
  payButton: { backgroundColor: '#28a745', paddingVertical: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
