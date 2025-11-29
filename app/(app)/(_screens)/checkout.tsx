// app/(app)/(screens)/checkout.tsx

import React, { useState, useEffect } from 'react';
import { View, Alert, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '@/src/api/api';

const CheckoutScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const params = useLocalSearchParams();
  const totalComissao = Number(params.totalComissao);
  const lojaId = Number(params.lojaId);

  const initializeCheckout = async () => {
    setLoading(true);

    try {
      // 🚨 ROTA ATUALIZADA
      const response = await api.post('/checkout/create-payment-intent-comissao', {
        amount: Math.round(totalComissao * 100),
        loja_id: lojaId,
      });

      const { paymentIntent, ephemeralKey, customer } = response.data;

      // Inicializa PaymentSheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'TrazAí Plataforma',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
      });

      if (initError) {
        Alert.alert('Erro ao inicializar pagamento', initError.message);
        return;
      }

      // Abre PaymentSheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Pagamento cancelado', presentError.message);
        router.push('./pagamento-comissao-cancelado');
      } else {
        router.push('./pagamento-comissao-sucesso');
      }
    } catch (error) {
      console.error('Erro ao iniciar o checkout:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o pagamento.');
      router.push('./pagamento-comissao-cancelado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (totalComissao > 0 && lojaId) {
      initializeCheckout();
    }
  }, [totalComissao, lojaId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finalizar Pagamento</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <Text>O seu pagamento está pronto para ser processado.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default CheckoutScreen;
