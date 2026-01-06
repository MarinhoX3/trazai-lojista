"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  StatusBar, 
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importação da API (ajuste conforme o seu projeto)
import api from '../../../src/api/api';

/**
 * COMPONENTE DE CHECKOUT
 * Responsável por inicializar e apresentar o Payment Sheet do Stripe
 * para o pagamento de comissões pendentes.
 */
export default function App() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams();
  const totalComissao = Number(params.totalComissao);
  const lojaId = Number(params.lojaId);

  const initializeCheckout = useCallback(async () => {
    if (!totalComissao || !lojaId) return;

    setLoading(true);
    try {
      // 1. Criar Intent de Pagamento no Servidor
      const response = await api.post('/checkout/create-payment-intent-comissao', {
        amount: Math.round(totalComissao * 100),
        loja_id: lojaId,
      });

      const { paymentIntent, ephemeralKey, customer } = response.data;

      // 2. Inicializar o PaymentSheet do Stripe
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'TrazAí Plataforma',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        appearance: {
          colors: {
            primary: '#2563eb',
          },
          shapes: {
            borderRadius: 12,
          }
        },
        returnURL: 'trazaolojista://stripe-redirect',
      });

      if (initError) {
        Alert.alert('Erro de Configuração', initError.message);
        setLoading(false);
        return;
      }

      // 3. Apresentar o Modal de Pagamento
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // O utilizador cancelou ou houve um erro no preenchimento
        router.push('/(app)/pagamento-comissao-cancelado' as any);
      } else {
        // Sucesso no processamento
        router.push('/(app)/pagamento-comissao-sucesso' as any);
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      Alert.alert('Erro', 'Não foi possível estabelecer ligação com o processador de pagamentos.');
      router.push('/(app)/pagamento-comissao-cancelado' as any);
    } finally {
      setLoading(false);
    }
  }, [totalComissao, lojaId, initPaymentSheet, presentPaymentSheet, router]);

  useEffect(() => {
    if (totalComissao > 0 && lojaId) {
      initializeCheckout();
    }
  }, [totalComissao, lojaId, initializeCheckout]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* CABEÇALHO PERSONALIZADO */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* CARTÃO DE RESUMO DO PAGAMENTO */}
        <View style={styles.paymentCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color="#2563eb" />
          </View>
          
          <Text style={styles.paymentLabel}>Valor da Comissão</Text>
          <Text style={styles.paymentValue}>
            R$ {totalComissao.toFixed(2).replace('.', ',')}
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={16} color="#64748b" />
            <Text style={styles.infoText}>Pagamento seguro para TrazAí</Text>
          </View>
        </View>

        {/* INDICADOR DE CARREGAMENTO / ESTADO */}
        <View style={styles.statusSection}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.statusTitle}>A processar pagamento...</Text>
              <Text style={styles.statusSubtitle}>
                Por favor, não feche a aplicação enquanto o Stripe é inicializado.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.readyBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.readyText}>Pronto para processar</Text>
              </View>
              <TouchableOpacity style={styles.retryBtn} onPress={initializeCheckout}>
                <Text style={styles.retryBtnText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* RODAPÉ DE SEGURANÇA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Ionicons name="lock-closed" size={14} color="#94a3b8" />
        <Text style={styles.footerText}>Pagamento encriptado e processado pelo Stripe</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  backBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  // Cartão de Resumo
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paymentValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1e293b',
    marginVertical: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Secção de Status
  statusSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 20,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  readyText: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  retryBtn: {
    marginTop: 20,
    padding: 10,
  },
  retryBtnText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 15,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
});