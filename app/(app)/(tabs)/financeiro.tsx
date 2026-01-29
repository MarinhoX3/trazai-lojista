"use client";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";

interface RepasseFuturo {
  data: string;
  valor: string;
}

const cleanValue = (value: string | number | undefined): number => {
  let cleaned: string;
  if (typeof value === "string") {
    cleaned = value.trim().replace(",", ".");
  } else {
    cleaned = String(value || "0").trim().replace(",", ".");
  }
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (value: number): string => {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
};

export default function App() {
  return (
    <StripeProvider publishableKey="pk_live_51RhcOpDK4gB80CI0e18vr6pZQDfX3jKom5lbMWEWJnxunMh4LqU6JZk7qH4pI8lONxtmVZfzWQaKAvfXwkR0fpZb00m8CtjxcG">
      <Financeiro />
    </StripeProvider>
  );
}

function Financeiro() {
  const { loja } = useAuthLoja();
  const router = useRouter();
  const stripe = useStripe();
  const insets = useSafeAreaInsets();

  const [stripeWarning, setStripeWarning] = useState(false);
  const [stripeMessage, setStripeMessage] = useState(
    "Você ainda não conectou sua loja ao Stripe para receber pagamentos."
  );

  const [totalComissao, setTotalComissao] = useState(0);
  const [comissaoId, setComissaoId] = useState<number | null>(null);

  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [saldoACaminho, setSaldoACaminho] = useState(0);
  const [contaDestino, setContaDestino] = useState("Não definida");
  const [saldoTotalAPI, setSaldoTotalAPI] = useState(0);

  const [proximaTransferencia, setProximaTransferencia] = useState<string | null>(null);
  const [repassesFuturos, setRepassesFuturos] = useState<RepasseFuturo[]>([]);
  const [taxaEntrega, setTaxaEntrega] = useState<string>("");
  const [dataPrimeiroPendente, setDataPrimeiroPendente] = useState<string | null>(null);
  const [diasPendente, setDiasPendente] = useState(0);

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  const calcularDias = (dataString: string | null): number => {
    if (!dataString) return 0;
    const data = new Date(dataString);
    const hoje = new Date();
    const utc1 = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const utc2 = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate());
    return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
  };

  const fetchDadosFinanceiros = useCallback(async () => {
    if (!loja?.id) return;
    setLoading(true);
    try {
      const [saldoResponse, comissoesResponse, lojaResponse] = await Promise.all([
        api.get(`/financeiro/saldo/${loja.id}`),
        api.get(`/payments/comissoes-pendentes/${loja.id}`),
        api.get(`/lojas/${loja.id}`),
      ]);

      const saldoData = saldoResponse.data;
      setSaldoDisponivel(cleanValue(saldoData.saldo_disponivel));
      setSaldoACaminho(cleanValue(saldoData.saldo_acaminho));
      setSaldoTotalAPI(cleanValue(saldoData.saldo_total));
      setContaDestino(saldoData.contaDestino || "Não definida");
      setProximaTransferencia(saldoData.proximaTransferencia || null);
      setRepassesFuturos(saldoData.repasses_futuros || []);

      const { valorPendente, comissaoId: cid, data_primeiro_pendente } = comissoesResponse.data;
      setTotalComissao(cleanValue(valorPendente));
      setComissaoId(cid ?? null);
      setDataPrimeiroPendente(data_primeiro_pendente ?? null);
      setDiasPendente(calcularDias(data_primeiro_pendente));

      const taxaValue = cleanValue(lojaResponse.data.taxa_entrega || 0);
      setTaxaEntrega(taxaValue.toFixed(2).replace(".", ","));
    } catch (err: any) {
  console.log("ERRO FINANCEIRO:", err?.response?.data || err);

  // Só mostra aviso se for erro REAL de Stripe
  if (err?.response?.data?.code === "STRIPE_NOT_CONFIGURED") {
    setStripeMessage(err.response.data.message);
    setStripeWarning(true);
  } else {
    Alert.alert("Erro", "Não foi possível carregar os dados financeiros.");
  }
}
 finally {
      setLoading(false);
    }
  }, [loja?.id]);

  useFocusEffect(
    useCallback(() => {
      if (loja?.id) fetchDadosFinanceiros();
    }, [loja?.id, fetchDadosFinanceiros])
  );

  const handleTaxaEntregaChange = (text: string) => {
    let cleanedText = text.replace(/[^0-9,.]/g, "");
    cleanedText = cleanedText.replace(".", ",");
    const parts = cleanedText.split(",");
    if (parts.length > 2) cleanedText = parts[0] + "," + parts.slice(1).join("");
    setTaxaEntrega(cleanedText);
  };

  const handlePayment = async () => {
    if (totalComissao <= 0 || !loja?.id) {
      Alert.alert("Aviso", "Não há comissão pendente.");
      return;
    }
    setPaymentLoading(true);
    try {
      const response = await api.post("/checkout/create-payment-intent-comissao", {
        amount: Math.round(totalComissao * 100),
        loja_id: loja.id,
      });

      const { paymentIntent, ephemeralKey, customer } = response.data;
      const { error: initError } = await stripe.initPaymentSheet({
        merchantDisplayName: "TrazAí Plataforma",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
      });

      if (initError) {
        Alert.alert("Erro", initError.message);
        return;
      }

      const { error: presentError } = await stripe.presentPaymentSheet();

if (presentError) {
  if (presentError.code === "Canceled") {
    // Usuário cancelou — não é erro
    console.log("Pagamento cancelado pelo usuário");
    return;
  }

  Alert.alert("Erro no pagamento", presentError.message);
  return;
}

      Alert.alert("Sucesso!", "Comissão paga com sucesso.");
      let paymentIntentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
      if (paymentIntentId && paymentIntentId.includes("_secret")) {
        paymentIntentId = paymentIntentId.split("_secret")[0];
      }

      await api.post("/payments/confirmar-pagamento-comissao", {
        loja_id: loja.id,
        paymentIntentId,
      });
      fetchDadosFinanceiros();
    } catch (err) {
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

  const taxaNum = cleanValue(taxaEntrega);

  if (taxaNum < 0) {
    Alert.alert("Erro", "Valor inválido.");
    return;
  }

  setSavingDeliveryFee(true);

  try {
    await api.put(
      `/lojas/${loja.id}/taxa-entrega`,
      { taxa_entrega: taxaNum },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    Alert.alert("Sucesso", "Taxa de entrega atualizada!");
    fetchDadosFinanceiros(); // 🔥 atualiza a tela
  } catch (err: any) {
    console.log("ERRO APP:", err?.response?.data || err);
    Alert.alert(
      "Erro",
      err?.response?.data?.message || "Falha ao salvar taxa."
    );
  } finally {
    setSavingDeliveryFee(false);
  }
};


  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>A carregar dados financeiros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Financeiro</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchDadosFinanceiros}>
          <Ionicons name="refresh" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >


        {/* BOTÃO RELATÓRIO */}
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => router.push("/(app)/relatorio-vendas" as any)}
        >
          <View style={styles.reportIconBg}>
            <Ionicons name="stats-chart" size={20} color="#2563eb" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.reportTitle}>Relatório de Vendas</Text>
            <Text style={styles.reportSubtitle}>Análise detalhada de faturamento</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>

        {/* SECÇÃO: COMISSÕES */}
        <Text style={styles.sectionTitle}>Comissões da Plataforma</Text>
        
        {/* ALERTAS DE COMISSÃO */}
        {diasPendente > 0 && (
          <View style={[
            styles.alertCard, 
            diasPendente >= 30 ? styles.alertError : styles.alertWarning
          ]}>
            <Ionicons 
              name={diasPendente >= 30 ? "alert-circle" : "time-outline"} 
              size={24} 
              color={diasPendente >= 30 ? "#dc2626" : "#b45309"} 
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.alertTitle, { color: diasPendente >= 30 ? "#991b1b" : "#92400e" }]}>
                {diasPendente >= 30 ? "Comissão Vencida" : "Comissão Pendente"}
              </Text>
              <Text style={[styles.alertMsg, { color: diasPendente >= 30 ? "#b91c1c" : "#a16207" }]}>
                {diasPendente >= 30 
                  ? `Vencida há ${diasPendente - 30} dias. Regularize para evitar bloqueios.` 
                  : `Faltam ${30 - diasPendente} dias para o vencimento.`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Valor Total Pendente</Text>
          <Text style={[styles.cardValue, { color: totalComissao > 0 ? '#dc2626' : '#10b981' }]}>
            {formatCurrency(totalComissao)}
          </Text>
          <Text style={styles.cardInfo}>Referente a pedidos em Dinheiro ou Pix</Text>
          
          <TouchableOpacity
            style={[styles.payBtn, totalComissao <= 0 && { backgroundColor: '#f1f5f9' }]}
            disabled={totalComissao <= 0 || paymentLoading}
            onPress={handlePayment}
          >
            {paymentLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color={totalComissao <= 0 ? "#94a3b8" : "#fff"} />
                <Text style={[styles.payBtnText, totalComissao <= 0 && { color: '#94a3b8' }]}>
                  Pagar Comissão
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* SECÇÃO: TAXA DE ENTREGA */}
        <Text style={styles.sectionTitle}>Definições de Entrega</Text>
        <View style={styles.card}>
          <View style={styles.inputHeader}>
            <Ionicons name="bicycle-outline" size={20} color="#4b5563" />
            <Text style={styles.inputLabel}>Taxa de Entrega Padrão</Text>
          </View>
          <Text style={styles.cardDescription}>Defina o valor fixo cobrado por cada entrega realizada pela sua loja.</Text>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0,00"
              keyboardType="numeric"
              value={taxaEntrega}
              onChangeText={handleTaxaEntregaChange}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingDeliveryFee && { opacity: 0.7 }]}
            onPress={handleSaveDeliveryFee}
            disabled={savingDeliveryFee}
          >
            {savingDeliveryFee ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar Alteração</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL STRIPE WARNING */}
      {stripeWarning && (
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconBg}>
              <Ionicons name="warning" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.modalTitle}>Stripe não configurado</Text>
            <Text style={styles.modalMsg}>{stripeMessage}</Text>
            
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setStripeWarning(false);
                router.push("/(app)/(tabs)/edit-loja" as any);

              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Configurar Agora</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setStripeWarning(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Lembrar mais tarde</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  containerCentered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '500' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  refreshBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },

  // Main Balance Card
  mainBalanceCard: { 
    backgroundColor: '#2563eb', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 12 },
  balanceFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)' 
  },
  balanceSubItem: { flex: 1 },
  balanceSubLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  balanceSubValue: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 2 },
  balanceDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 16 },

  // Report Button
  reportButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  reportIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  reportSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Sections & Cards
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardLabel: { fontSize: 14, color: '#64748b', fontWeight: '600', textAlign: 'center' },
  cardValue: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginVertical: 8 },
  cardInfo: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  cardDescription: { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 18 },

  // Alertas
  alertCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1 },
  alertWarning: { backgroundColor: '#fffbeb', borderColor: '#fef3c7' },
  alertError: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  alertTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  alertMsg: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Buttons
  payBtn: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 },
  saveBtn: { backgroundColor: '#2563eb', height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Inputs
  inputHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: '#334155', marginLeft: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 },
  currencyPrefix: { fontSize: 16, fontWeight: '700', color: '#94a3b8', marginRight: 4 },
  textInput: { flex: 1, height: 48, fontSize: 18, fontWeight: '700', color: '#1e293b' },

  // Modal
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 28, padding: 24, width: '100%', alignItems: 'center' },
  modalIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fffbeb', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  modalMsg: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalPrimaryBtn: { backgroundColor: '#2563eb', width: '100%', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalPrimaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalCloseBtn: { marginTop: 16, padding: 8 },
  modalCloseText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 }
});