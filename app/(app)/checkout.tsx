import React, { useState } from 'react';
import { View, Button, Alert, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';

const CheckoutScreen = () => {
  const { createPaymentMethod } = useStripe();
  const [isCardComplete, setIsCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  // ADAPTE AQUI: Pegue os dados do pedido da sua fonte de dados (ex: state, navegação)
  const pedido = {
    id_cliente: 1,
    id_loja: 3, // ID da "Pizzaria do Zé" que testamos
    endereco_entrega: 'Rua de Teste, 456',
    itens: [
      { id_produto: 1, quantidade: 1 }, // Substitua por produtos reais
    ]
  };

  const handlePayPress = async () => {
    if (!isCardComplete) {
      Alert.alert("Erro", "Por favor, preencha todos os dados do cartão.");
      return;
    }
    setLoading(true);

    try {
      // 1. Cria o método de pagamento seguro
      const { paymentMethod, error } = await createPaymentMethod({
  paymentMethodType: 'Card', // <-- Correto
});

      if (error) {
        Alert.alert("Erro", error.message);
        setLoading(false);
        return;
      }

      // 2. Chama a sua API (backend) com o ID do método de pagamento
      // MUITO IMPORTANTE: Substitua pela URL do seu backend.
      // Se estiver testando no celular, use o IP da sua máquina na rede (ex: http://192.168.1.5:3000)
      const response = await fetch('http://192.168.1.12:3000/api/pedidos', { // <<< MUDE AQUI
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pedido, // Envia todos os dados do pedido
          paymentMethodId: paymentMethod.id, // Envia o ID do pagamento gerado
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso!", result.message);
        // Ex: router.push('/pedido-confirmado');
      } else {
        throw new Error(result.message);
      }

    } catch (apiError: any) {
      console.error("Erro ao chamar a API:", apiError);
      Alert.alert("Erro no Pedido", apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finalizar Pagamento</Text>
      
      <Text style={styles.label}>Dados do Cartão de Crédito</Text>
      <CardField
        postalCodeEnabled={false}
        onCardChange={(cardDetails) => {
          setIsCardComplete(cardDetails.complete);
        }}
        style={styles.cardField}
      />
      
      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : (
          <Button 
            title="Pagar Agora" 
            onPress={handlePayPress} 
            disabled={!isCardComplete || loading}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  cardField: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  buttonContainer: {
    marginTop: 40,
  }
});

export default CheckoutScreen;