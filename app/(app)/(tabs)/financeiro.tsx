import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useFocusEffect, router } from 'expo-router';
import { useAuthLoja } from '../../../src/api/contexts/AuthLojaContext';
import api from '../../../src/api/api';
import { Ionicons } from '@expo/vector-icons';

export default function financeiro() {
  const { loja } = useAuthLoja();
  const [totalComissao, setTotalComissao] = useState(0);
  const [comissaoId, setComissaoId] = useState<number | null>(null);
  const [taxaEntrega, setTaxaEntrega] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false);

  const fetchedLojaIdRef = useRef<number | null>(null);

  const fetchDadosFinanceiros = useCallback(async () => {
    if (!loja?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // CORREÇÃO: Pegando as chaves que o servidor ATUALMENTE retorna ('comissaoId' e 'valorPendente').
      const comissoesResponse = await api.get(`/payments/comissoes-pendentes/${loja.id}`);
      const { valorPendente, comissaoId: fetchedComissaoId } = comissoesResponse.data;

      // Garante que valorPendente é um número válido antes de setar o estado
      if (!isNaN(parseFloat(valorPendente))) {
        setTotalComissao(parseFloat(valorPendente));
        setComissaoId(fetchedComissaoId);
      } else {
        setTotalComissao(0);
        setComissaoId(null);
      }

      // Busca a Taxa de Entrega
      const lojaDetailsResponse = await api.get(`/lojas/${loja.id}`);
      const taxaRecebida = lojaDetailsResponse.data.taxa_entrega;
      if (taxaRecebida !== undefined && taxaRecebida !== null) {
        setTaxaEntrega(String(parseFloat(taxaRecebida).toFixed(2)));
      } else {
        setTaxaEntrega('0.00');
      }

      fetchedLojaIdRef.current = loja.id;

    } catch (error: any) {
      console.error("Erro ao buscar dados financeiros:", error.response?.data || error.message);
      Alert.alert("Erro", "Não foi possível carregar os dados financeiros.");
      setTotalComissao(0);
      setComissaoId(null);
      setTaxaEntrega('0.00');
    } finally {
      setLoading(false);
    }
  }, [loja?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchDadosFinanceiros();
    }, [fetchDadosFinanceiros])
  );

  const handlePagarComissao = async () => {
    if (!loja?.id || totalComissao <= 0) {
      Alert.alert("Tudo em dia!", "Você não tem comissões pendentes para pagar.");
      return;
    }

    if (!comissaoId) {
      // Se comissaoId não está definido, precisamos chamar a API para obter a URL de pagamento
      // (a função criarLinkPagamentoComissao no backend)
      
      try {
        setPaymentLoading(true);
        // Chama o endpoint que cria a sessão de pagamento (Stripe Checkout)
        const response = await api.post(`/lojas/${loja.id}/pagar-comissao`);
        const urlPagamento = response.data?.url;

        if (urlPagamento) {
          router.push(urlPagamento); // Abre a página de checkout da Stripe
        } else {
          Alert.alert("Erro", "Não foi possível obter a URL de pagamento.");
        }
      } catch (error: any) {
        console.error("Erro ao iniciar pagamento:", error.response?.data || error.message);
        Alert.alert("Erro", "Ocorreu um erro ao iniciar o pagamento.");
      } finally {
        setPaymentLoading(false);
      }
      
    } else {
      // Caso a API antiga estivesse sendo usada e retornasse o comissaoId diretamente
      // (Mantido para compatibilidade se o backend for atualizado para essa lógica)
      router.push({
        pathname: "/checkout",
        params: {
          totalComissao: totalComissao.toFixed(2),
          lojaId: loja.id,
          comissaoId: comissaoId,
        },
      });
    }
  };

  const handleSalvarTaxaEntrega = async () => {
    if (!loja?.id) return;

    setSavingDeliveryFee(true);
    try {
      const parsedTaxa = parseFloat(taxaEntrega.replace(',', '.'));
      if (isNaN(parsedTaxa) || parsedTaxa < 0) {
        Alert.alert("Erro", "Por favor, insira um valor numérico válido e positivo para a taxa de entrega.");
        return;
      }

      const response = await api.put(`/lojas/${loja.id}/taxa-entrega`, { taxa_entrega: parsedTaxa });

      Alert.alert("Sucesso", response.data.message || "Taxa de entrega atualizada com sucesso!");
      fetchDadosFinanceiros();

    } catch (error: any) {
      const message = error.response?.data?.message || "Não foi possível salvar a taxa de entrega.";
      console.error("Erro ao salvar taxa de entrega:", error.response?.data || error.message);
      Alert.alert("Erro", message);
    } finally {
      setSavingDeliveryFee(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fullScreenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen options={{ title: 'Financeiro' }} />
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
            <ActivityIndicator color="#007BFF" />
          ) : (
            <Pressable 
              style={[styles.payButton, totalComissao <= 0 && { backgroundColor: '#adb5bd' }]} 
              onPress={handlePagarComissao}
              disabled={totalComissao <= 0}
            >
              <Text style={styles.payButtonText}>Efetuar Pagamento da Comissão</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.sectionDivider} />
        <Text style={styles.title}>Configurar Taxa de Entrega</Text>
        <Text style={styles.subtitle}>
          Defina o valor que sua loja cobrará por entrega.
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color="#007BFF" />
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valor da Taxa (R$)</Text>
            <TextInput
              style={styles.deliveryFeeInput}
              value={taxaEntrega}
              onChangeText={setTaxaEntrega}
              keyboardType="numeric"
              placeholder="Ex: 5.00"
              placeholderTextColor="#888"
              returnKeyType="done"
              onSubmitEditing={handleSalvarTaxaEntrega}
            />
            <Pressable
              style={styles.saveButton}
              onPress={handleSalvarTaxaEntrega}
              disabled={savingDeliveryFee}
            >
              {savingDeliveryFee ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Taxa de Entrega</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    paddingBottom: 50,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#343a40' },
  subtitle: { fontSize: 16, color: '#6c757d', textAlign: 'center', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  cardLabel: { fontSize: 18, color: '#6c757d' },
  cardValue: { fontSize: 40, fontWeight: 'bold', color: '#dc3545', marginTop: 10 },
  buttonContainer: { marginTop: 10, width: '90%', height: 50, justifyContent: 'center', marginBottom: 30 },
  payButton: { backgroundColor: '#28a745', paddingVertical: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 30,
  },
  inputGroup: {
    width: '90%',
    alignItems: 'flex-start',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 8,
  },
  deliveryFeeInput: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#343a40',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
