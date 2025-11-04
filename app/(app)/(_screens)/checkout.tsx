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
  const comissaoId = Number(params.comissaoId);

  const initializeCheckout = async () => {
    setLoading(true);

    try {
      const response = await api.post('/payments/create-payment-intent', {
        amount: totalComissao * 100,
        lojaId: lojaId,
        comissao_id: comissaoId,
      });

      const { paymentIntent, ephemeralKey, customer } = response.data;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Sua Plataforma',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        Alert.alert('Erro ao inicializar pagamento', initError.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Pagamento cancelado', presentError.message);
        router.push('./pagamento-comissao-cancelado'); // rota relativa
      } else {
        
        router.push('./pagamento-comissao-sucesso'); // rota relativa
      }
    } catch (error) {
      console.error('Erro ao iniciar o checkout:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o pagamento.');
      router.push('./pagamento-comissao-cancelado'); // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (totalComissao > 0 && lojaId && comissaoId) {
      initializeCheckout();
    }
  }, [totalComissao, lojaId, comissaoId]);

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
