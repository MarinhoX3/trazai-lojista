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
  ScrollView, // Importar ScrollView
  KeyboardAvoidingView, // Importar KeyboardAvoidingView
  Platform // Importar Platform para ajustes específicos de SO
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { useAuthLoja } from '../../../src/api/contexts/AuthLojaContext'; // Assumindo seu AuthLojaContext
import api from '../../../src/api/api';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking'; // Importar Linking

export default function FinanceiroScreen() {
  const { loja, updateAuthLoja } = useAuthLoja(); // Assumindo que updateAuthLoja existe para atualizar o contexto
  const [totalComissao, setTotalComissao] = useState(0);
  const [taxaEntrega, setTaxaEntrega] = useState<string>(''); // Novo estado para a taxa de entrega
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false); // Estado para salvar a taxa
  
  // Ref para controlar se os dados da loja já foram buscados para evitar loops
  const fetchedLojaIdRef = useRef<number | null>(null);

  // Log na renderização inicial e em cada re-renderização do componente
  console.log("FinanceiroScreen: Componente renderizado. Loja ID:", loja?.id, "totalComissao:", totalComissao, "taxaEntrega:", taxaEntrega);

  const fetchDadosFinanceiros = useCallback(async () => {
    console.log("fetchDadosFinanceiros: Iniciando busca de dados financeiros...");
    if (!loja?.id) {
      console.warn("fetchDadosFinanceiros: ID da loja não disponível. Não buscando dados.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Buscar comissões
      console.log(`fetchDadosFinanceiros: Chamando API: /lojas/${loja.id}/comissoes`);
      const comissoesResponse = await api.get(`/lojas/${loja.id}/comissoes`);
      const comissaoRecebida = parseFloat(comissoesResponse.data.total_comissao);
      if (!isNaN(comissaoRecebida)) {
        setTotalComissao(comissaoRecebida);
        console.log("fetchDadosFinanceiros: totalComissao atualizado para:", comissaoRecebida);
      } else {
        console.warn("fetchDadosFinanceiros: total_comissao recebido não é um número válido:", comissoesResponse.data.total_comissao);
        setTotalComissao(0);
      }

      // Buscar detalhes da loja para obter a taxa de entrega
      console.log(`fetchDadosFinanceiros: Chamando API: /lojas/${loja.id} para taxa de entrega`);
      const lojaDetailsResponse = await api.get(`/lojas/${loja.id}`);
      const taxaRecebida = lojaDetailsResponse.data.taxa_entrega;
      if (taxaRecebida !== undefined && taxaRecebida !== null) {
        setTaxaEntrega(String(parseFloat(taxaRecebida).toFixed(2))); // Formata para 2 casas decimais e converte para string
        console.log("fetchDadosFinanceiros: taxaEntrega atualizada para:", taxaRecebida);
      } else {
        setTaxaEntrega('0.00'); // Valor padrão se não houver taxa
        console.warn("fetchDadosFinanceiros: Taxa de entrega não encontrada ou inválida. Definindo para 0.00.");
      }
      
      // Marcar que os dados foram buscados para este loja.id (manter para outras otimizações se houver)
      fetchedLojaIdRef.current = loja.id;

    } catch (error: any) {
      console.error("fetchDadosFinanceiros: Erro ao buscar dados financeiros:", error.response?.data || error.message);
      Alert.alert("Erro", "Não foi possível carregar os dados financeiros.");
      setTotalComissao(0);
      setTaxaEntrega('0.00');
    } finally {
      setLoading(false);
      console.log("fetchDadosFinanceiros: Busca de dados financeiros finalizada.");
    }
  }, [loja?.id]);

  useFocusEffect(
    useCallback(() => {
      console.log("useFocusEffect: Tela Financeiro focada. Chamando fetchDadosFinanceiros.");
      fetchDadosFinanceiros();
    }, [fetchDadosFinanceiros])
  );

  const handlePagarComissao = async () => {
    if (!loja?.id) return;
    
    if (totalComissao <= 0) {
        Alert.alert("Tudo em dia!", "Você não tem comissões pendentes para pagar.");
        return;
    }

    setPaymentLoading(true);
    try {
        console.log(`handlePagarComissao: Chamando API para pagar comissão: /lojas/${loja.id}/pagar-comissao`);
        // Esta rota precisa ser implementada no seu backend para gerar o link de pagamento
        const response = await api.post(`/lojas/${loja.id}/pagar-comissao`);
        const { url } = response.data;
        console.log("handlePagarComissao: URL de pagamento recebida:", url);

        // CORREÇÃO: Ativar a lógica para abrir o link automaticamente
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Erro", `Não foi possível abrir o link. Copie e cole no seu navegador: ${url}`);
        }

    } catch (error: any) {
        const message = error.response?.data?.message || "Não foi possível gerar o link de pagamento.";
        console.error("handlePagarComissao: Erro ao pagar comissão:", error.response?.data || error.message);
        Alert.alert("Erro", message);
    } finally {
        setPaymentLoading(false);
    }
  };

  const handleSalvarTaxaEntrega = async () => {
    if (!loja?.id) return;

    setSavingDeliveryFee(true);
    try {
      const parsedTaxa = parseFloat(taxaEntrega.replace(',', '.')); // Garante que é um número (substitui vírgula por ponto)
      if (isNaN(parsedTaxa) || parsedTaxa < 0) {
        Alert.alert("Erro", "Por favor, insira um valor numérico válido e positivo para a taxa de entrega.");
        return;
      }

      // --- ALTERAÇÃO AQUI: USANDO A NOVA ROTA DEDICADA PARA TAXA DE ENTREGA ---
      console.log(`handleSalvarTaxaEntrega: Chamando API para atualizar taxa de entrega: /lojas/${loja.id}/taxa-entrega`);
      const response = await api.put(`/lojas/${loja.id}/taxa-entrega`, { taxa_entrega: parsedTaxa });

      // O backend 'atualizarTaxaEntrega' retorna apenas uma mensagem de sucesso, não o objeto loja completo.
      // Portanto, para atualizar a taxa na tela e no contexto, re-buscamos os dados financeiros.
      Alert.alert("Sucesso", response.data.message || "Taxa de entrega atualizada com sucesso!");
      fetchDadosFinanceiros(); // Re-busca os dados para atualizar a tela e o contexto

    } catch (error: any) {
      const message = error.response?.data?.message || "Não foi possível salvar a taxa de entrega.";
      console.error("handleSalvarTaxaEntrega: Erro ao salvar taxa de entrega:", error.response?.data || error.message);
      Alert.alert("Erro", message);
    } finally {
      setSavingDeliveryFee(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fullScreenContainer} // Um container que ocupa a tela inteira
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Ajuste o offset se necessário
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} // Estilo para o conteúdo dentro da ScrollView
        keyboardShouldPersistTaps="handled" // Permite que toques fora dos inputs fechem o teclado
        showsVerticalScrollIndicator={false} // Opcional: esconde a barra de rolagem vertical
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
                <ActivityIndicator size="large" color="#007BFF" />
            ) : (
                <Pressable style={styles.payButton} onPress={handlePagarComissao}>
                    <Text style={styles.payButtonText}>Efetuar Pagamento da Comissão</Text>
                </Pressable>
            )}
        </View>

        {/* Seção para configurar a Taxa de Entrega */}
        <View style={styles.sectionDivider} />
        <Text style={styles.title}>Configurar Taxa de Entrega</Text>
        <Text style={styles.subtitle}>
          Defina o valor que sua loja cobrará por entrega.
        </Text>
        
        {loading ? ( // Usar o mesmo loading para a taxa de entrega inicial
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
              returnKeyType="done" // Adicionado para melhor navegação do teclado
              onSubmitEditing={handleSalvarTaxaEntrega} // Tenta salvar ao pressionar "Done"
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
  fullScreenContainer: { // Novo estilo para o KeyboardAvoidingView
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: { 
    flexGrow: 1, // Permite que o conteúdo cresça e ocupe o espaço disponível
    padding: 20, 
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    paddingBottom: 50, // Espaço extra para rolagem
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
    marginBottom: 20, // Espaçamento
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
    alignItems: 'flex-start', // Alinha o label à esquerda
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
