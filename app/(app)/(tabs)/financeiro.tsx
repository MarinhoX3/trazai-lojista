// JavaScript Document
"use client";

import { useState, useCallback, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";
import api from "../../../src/api/api";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStripe, StripeProvider } from "@stripe/stripe-react-native";
import { MotiView } from "moti";

function Financeiro() {
  const { loja } = useAuthLoja();
  const stripe = useStripe();

  const [totalComissao, setTotalComissao] = useState(0);
  const [comissaoId, setComissaoId] = useState<number | null>(null);
  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [proximaTransferencia, setProximaTransferencia] = useState<string | null>(null);
  const [taxaEntrega, setTaxaEntrega] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false);
  const [repassesFuturos, setRepassesFuturos] = useState<any[]>([]);

  const fetchedLojaIdRef = useRef<number | null>(null);
  const insets = useSafeAreaInsets();

  const fetchDadosFinanceiros = useCallback(async () => {
    if (!loja?.id) return;

    setLoading(true);

    try {
      const saldoResponse = await api.get(`/financeiro/saldo/${loja.id}`);
      setSaldoDisponivel(Number(saldoResponse.data.saldo_disponivel) || 0);
      setProximaTransferencia(saldoResponse.data.proximaTransferencia || null);
      setRepassesFuturos(saldoResponse.data.repasses_futuros || []);

      const comissoesResponse = await api.get(`/payments/comissoes-pendentes/${loja.id}`);
      const { valorPendente, comissaoId } = comissoesResponse.data;

      setTotalComissao(Number(valorPendente) || 0);
      setComissaoId(comissaoId ?? null);

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
        fetchDadosFinanceiros();
      }
    }, [loja?.id, fetchDadosFinanceiros])
  );

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
      Alert.alert("Erro", "Loja não identificada.");
      return;
    }

    const taxaNum = Number.parseFloat(taxaEntrega.replace(",", "."));
    if (isNaN(taxaNum) || taxaNum < 0) {
      Alert.alert("Erro", "Por favor, insira um valor válido para a taxa de entrega.");
      return;
    }

    setSavingDeliveryFee(true);
    try {
      await api.put(`/lojas/${loja.id}/taxa-entrega`, { taxa_entrega: taxaNum });
      Alert.alert("Sucesso", "Taxa de entrega salva com sucesso!");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a taxa de entrega.");
    } finally {
      setSavingDeliveryFee(false);
    }
  };

  const formatTransferDate = (dateString: string | null) => {
    if (!dateString) return "A definir";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "A definir";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando dados financeiros...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
    >
      {/* ... todo o seu layout aqui (sem alterações) ... */}
    </ScrollView>
  );
}

// ⚡ export default ÚNICO e no topo do módulo
export default function Screen() {
  return (
    <StripeProvider publishableKey="pk_live_51RhcOpDK4gB80CI0e18vr6pZQDfX3jKom5lbMWEWJnxunMh4LqU6JZk7qH4pI8lONxtmVZfzWQaKAvfXwkR0fpZb00m8CtjxcG">
      <Financeiro />
    </StripeProvider>
  );
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
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#222", marginBottom: 12 },
  sectionSubtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20, paddingHorizontal: 10 },

  // Unified card style (removed duplicate keys)
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

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

  cardPrimary: {
    backgroundColor: "#E9F8EF",
    borderRadius: 16,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#0B7709",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  saldoValor: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#0B7709",
    marginBottom: 10,
  },

  transferenciaBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },

  transferenciaTexto: {
    marginLeft: 6,
    color: "#444",
    fontWeight: "500",
    fontSize: 14,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },

  textMuted: {
    color: "#888",
    fontSize: 14,
  },

  repasseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },

  repasseData: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  repasseLegenda: {
    fontSize: 12,
    color: "#888",
  },

  repasseValor: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0B7709",
  },

  valorComissao: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#E53935",
    marginBottom: 6,
  },

  cardDescricao: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },

  botaoPagamento: {
    backgroundColor: "#0B7709",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  botaoDesativado: {
    backgroundColor: "#ccc",
  },

  botaoSalvar: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },

  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

});
