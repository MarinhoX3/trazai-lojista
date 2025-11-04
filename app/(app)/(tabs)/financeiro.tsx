"use client"

import { useState, useCallback, useRef } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext"
import api from "../../../src/api/api"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useStripe, StripeProvider } from '@stripe/stripe-react-native'

export default function App() {
  return (
    <StripeProvider publishableKey="pk_live_51RhcOpDK4gB80CI0e18vr6pZQDfX3jKom5lbMWEWJnxunMh4LqU6JZk7qH4pI8lONxtmVZfzWQaKAvfXwkR0fpZb00m8CtjxcG">
      <Financeiro />
    </StripeProvider>
  );
}

function Financeiro() {
  const { loja } = useAuthLoja()
  const stripe = useStripe()

  const [totalComissao, setTotalComissao] = useState(0)
  const [comissaoId, setComissaoId] = useState<number | null>(null)
  const [saldoDisponivel, setSaldoDisponivel] = useState(0)
  const [proximaTransferencia, setProximaTransferencia] = useState<string | null>(null)
  const [taxaEntrega, setTaxaEntrega] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false)

  const fetchedLojaIdRef = useRef<number | null>(null)
  const insets = useSafeAreaInsets()

const fetchDadosFinanceiros = useCallback(async () => {
  if (!loja?.id) return;

  setLoading(true);

  try {
    // ✅ Sando disponível e próxima transferência
    const saldoResponse = await api.get(`/payments/saldo-disponivel/${loja.id}`);
    setSaldoDisponivel(Number(saldoResponse.data.saldo) || 0);
    setProximaTransferencia(saldoResponse.data.proximaTransferencia || null);

    // ✅ Comissões pendentes (cálculo real do banco)
    const comissoesResponse = await api.get(`/payments/comissoes-pendentes/${loja.id}`);
    const { valorPendente, comissaoId } = comissoesResponse.data;

    setTotalComissao(Number(valorPendente) || 0);
    setComissaoId(comissaoId ?? null);

    // ✅ Taxa de entrega
    const lojaResponse = await api.get(`/lojas/${loja.id}`);
    setTaxaEntrega(String(Number(lojaResponse.data.taxa_entrega || 0).toFixed(2)));

  } catch (err) {
    console.log("Erro ao carregar financeiro:", err);
    Alert.alert("Erro", "Não foi possível carregar os dados financeiros.");
  }

  setLoading(false);
}, [loja?.id]);


  useFocusEffect(
    useCallback(() => {
      if (loja?.id && loja.id !== fetchedLojaIdRef.current) {
        fetchDadosFinanceiros()
      }
    }, [loja?.id, fetchDadosFinanceiros])
  )

  const handlePayment = async () => {
  if (totalComissao <= 0 || !loja?.id) {
    Alert.alert("Aviso", "Não há comissão pendente para pagar.");
    return;
  }

  setPaymentLoading(true);
  try {
    const response = await api.post("/payments/create-payment-intent", {
      amount: totalComissao,
      lojaId: loja.id,
    });

    const { clientSecret } = response.data;
    if (!clientSecret) throw new Error("clientSecret ausente.");

    const { error: initError } = await stripe.initPaymentSheet({
      merchantDisplayName: "TrazAí Plataforma",
      paymentIntentClientSecret: clientSecret,
    });

    if (initError) {
      Alert.alert("Erro", initError.message);
      return;
    }

    const { error: presentError } = await stripe.presentPaymentSheet();
    if (presentError) {
      Alert.alert("Cancelado", presentError.message);
      return;
    }

    await api.post("/payments/confirmar-pagamento", {
      lojaId: loja.id,
      paymentIntentId: clientSecret.split("_secret")[0],
    });

    Alert.alert("Pagamento confirmado!", "Obrigado.");

    // ✅ Atualiza valores corretamente
    setTotalComissao(0);
    setComissaoId(null);

    fetchDadosFinanceiros();

  } catch (error) {
    console.log("Pagamento erro:", error);
    Alert.alert("Erro", "Falha ao processar pagamento.");
  } finally {
    setPaymentLoading(false);
  }
};


  const handleSaveDeliveryFee = async () => {
    if (!loja?.id) {
      Alert.alert("Erro", "Loja não identificada.")
      return
    }

    const taxaNum = Number.parseFloat(taxaEntrega.replace(",", "."))
    if (isNaN(taxaNum) || taxaNum < 0) {
      Alert.alert("Erro", "Por favor, insira um valor válido para a taxa de entrega.")
      return
    }

    setSavingDeliveryFee(true)
    try {
      await api.put(`/lojas/${loja.id}/taxa-entrega`, { taxa_entrega: taxaNum })
      Alert.alert("Sucesso", "Taxa de entrega salva com sucesso!")
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a taxa de entrega.")
    } finally {
      setSavingDeliveryFee(false)
    }
  }

  const formatTransferDate = (dateString: string | null) => {
    if (!dateString) return "A definir"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return "A definir"
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando dados financeiros...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={60} color="#4CAF50" />
        <Text style={styles.title}>Financeiro</Text>
        <Text style={styles.subtitle}>Acompanhe seus ganhos e pagamentos</Text>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.balanceLabel}>Saldo Disponível</Text>
        </View>
        <Text style={styles.balanceValue}>R$ {(saldoDisponivel ?? 0).toFixed(2)}</Text>
        <View style={styles.transferInfo}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.transferText}>Próxima transferência: {formatTransferDate(proximaTransferencia)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <Ionicons name="cash-outline" size={32} color="#E53935" />
        <Text style={styles.sectionTitle}>Comissões da Plataforma</Text>
      </View>
      <Text style={styles.sectionSubtitle}>
        Valor a ser pago à plataforma referente aos pedidos em Dinheiro e Pix (10% do valor total).
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Valor Pendente</Text>
        <Text style={styles.cardValue}>R$ {(totalComissao ?? 0).toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.payButton, totalComissao <= 0 && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={totalComissao <= 0 || paymentLoading}
      >
        {paymentLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>Efetuar Pagamento da Comissão</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.deliverySection}>
        <Text style={styles.deliveryTitle}>Configurar Taxa de Entrega</Text>
        <Text style={styles.deliverySubtitle}>Defina o valor que sua loja cobrará por entrega.</Text>

        <Text style={styles.inputLabel}>Valor da Taxa (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 5.00"
          keyboardType="numeric"
          value={taxaEntrega ?? ""}
          onChangeText={setTaxaEntrega}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveDeliveryFee} disabled={savingDeliveryFee}>
          {savingDeliveryFee ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Taxa de Entrega</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginTop: 10 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 5 },
  balanceCard: { backgroundColor: "#E8F5E9", borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 2, borderColor: "#4CAF50" },
  balanceHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  balanceLabel: { fontSize: 16, color: "#2E7D32", fontWeight: "600", marginLeft: 8 },
  balanceValue: { fontSize: 42, fontWeight: "bold", color: "#1B5E20", marginBottom: 12 },
  transferInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 8 },
  transferText: { fontSize: 14, color: "#666", marginLeft: 8, fontWeight: "500" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginLeft: 10 },
  sectionSubtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20, paddingHorizontal: 10 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 20 },
  cardLabel: { fontSize: 16, color: "#666", marginBottom: 10 },
  cardValue: { fontSize: 36, fontWeight: "bold", color: "#E53935" },
  payButton: { backgroundColor: "#4CAF50", borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 20 },
  payButtonDisabled: { backgroundColor: "#ccc" },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  divider: { height: 1, backgroundColor: "#ddd", marginVertical: 20 },
  deliverySection: { backgroundColor: "#fff", borderRadius: 12, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  deliveryTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 5 },
  deliverySubtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: { backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  saveButton: { backgroundColor: "#007AFF", borderRadius: 8, padding: 16, alignItems: "center" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
})
