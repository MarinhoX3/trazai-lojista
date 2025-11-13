"use client"

import { useState, useCallback, useRef } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext"
import api from "../../../src/api/api"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useStripe, StripeProvider } from '@stripe/stripe-react-native'

// --- Tipagens ---
interface RepasseFuturo {
    data: string;
    valor: string;
}

// --- Funções Auxiliares de Tratamento de Dados ---

/**
 * Funcao CRUCIAL para garantir que a string do backend vire um numero valido.
 */
const cleanValue = (value: string | number | undefined): number => {
    let cleaned: string;
    if (typeof value === 'string') {
        cleaned = value.trim().replace(',', '.');
    } else {
        cleaned = String(value || '0').trim().replace(',', '.');
    }
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
};

/**
 * Formata um número para o padrão monetário brasileiro (R$ X,XX)
 */
const formatCurrency = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// --- Componente de Configuração da Stripe ---

export default function App() {
    return (
        <StripeProvider publishableKey="pk_live_51RhcOpDK4gB80CI0e18vr6pZQDfX3jKom5lbMWEWJnxunMh4LqU6JZk7qH4pI8lONxtmVZfzWQaKAvfXwkR0fpZb00m8CtjxcG">
            <Financeiro />
        </StripeProvider>
    );
}

// --- Componente Principal (Financeiro) ---

function Financeiro() {
    const { loja } = useAuthLoja()
    const stripe = useStripe()

    // Estados existentes
    const [totalComissao, setTotalComissao] = useState(0)
    const [comissaoId, setComissaoId] = useState<number | null>(null)
    const [saldoDisponivel, setSaldoDisponivel] = useState(0)
    const [proximaTransferencia, setProximaTransferencia] = useState<string | null>(null)
    const [taxaEntrega, setTaxaEntrega] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [savingDeliveryFee, setSavingDeliveryFee] = useState(false)
    const [repassesFuturos, setRepassesFuturos] = useState<RepasseFuturo[]>([]);

    // NOVOS ESTADOS
    const [saldoACaminho, setSaldoACaminho] = useState(0); 
    const [contaDestino, setContaDestino] = useState('Não definida'); 
    
    // ✅ NOVO ESTADO: Armazena o saldo total da API
    const [saldoTotalAPI, setSaldoTotalAPI] = useState(0); 


    const insets = useSafeAreaInsets()

    const fetchDadosFinanceiros = useCallback(async () => {
        if (!loja?.id) return;

        setLoading(true);

        try {
            // ✅ Otimização: Busca paralela e robusta de dados
            const [saldoResponse, comissoesResponse, lojaResponse] = await Promise.all([
                api.get(`/financeiro/saldo/${loja.id}`),
                api.get(`/payments/comissoes-pendentes/${loja.id}`),
                api.get(`/lojas/${loja.id}`),
            ]);
            
            const saldoData = saldoResponse.data;

            // --- Processamento de Saldo ---
            setSaldoDisponivel(cleanValue(saldoData.saldo_disponivel)); 
            setSaldoACaminho(cleanValue(saldoData.saldo_acaminho));
            
            // ✅ CAPTURA O CAMPO 'saldo_total' AQUI
            setSaldoTotalAPI(cleanValue(saldoData.saldo_total));
            
            // Informações de Transferência
            setProximaTransferencia(saldoData.proximaTransferencia || null);
            setRepassesFuturos(saldoData.repasses_futuros || []);
            setContaDestino(saldoData.contaDestino || 'Não definida'); 

            // --- Comissões pendentes ---
            const { valorPendente, comissaoId } = comissoesResponse.data;

            setTotalComissao(cleanValue(valorPendente));
            setComissaoId(comissaoId ?? null);

            // --- Taxa de entrega ---
            const taxaEntregaValue = cleanValue(lojaResponse.data.taxa_entrega || 0);
            setTaxaEntrega(taxaEntregaValue.toFixed(2).replace('.', ','));

        } catch (err) {
            console.error("Erro ao carregar financeiro:", err);
            Alert.alert("Erro", "Não foi possível carregar os dados financeiros.");
        }

        setLoading(false);
    }, [loja?.id]);

    useFocusEffect(
        useCallback(() => {
            if (loja?.id) {
                fetchDadosFinanceiros()
            }
        }, [loja?.id, fetchDadosFinanceiros])
    )

    const handleTaxaEntregaChange = (text: string) => {
        let cleanedText = text.replace(/[^0-9,.]/g, '');
        cleanedText = cleanedText.replace('.', ',');
        const parts = cleanedText.split(',');
        if (parts.length > 2) {
            cleanedText = parts[0] + ',' + parts.slice(1).join('');
        }
        setTaxaEntrega(cleanedText);
    };

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
                Alert.alert("Atenção", presentError.message.includes("Canceled") ? "Pagamento cancelado pelo usuário." : presentError.message);
                return;
            }

            await api.post("/payments/confirmar-pagamento", {
                lojaId: loja.id,
                paymentIntentId: clientSecret.split("_secret")[0],
            });

            Alert.alert("Sucesso!", "Pagamento da comissão confirmado.");
            fetchDadosFinanceiros();

        } catch (error) {
            console.error("Pagamento erro:", error);
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

        const taxaNum = cleanValue(taxaEntrega.replace(",", "."))
        
        if (taxaNum < 0) {
            Alert.alert("Erro", "Por favor, insira um valor válido para a taxa de entrega.")
            return
        }

        setSavingDeliveryFee(true)
        try {
            await api.put(`/lojas/${loja.id}/taxa-entrega`, { taxa_entrega: taxaNum })
            Alert.alert("Sucesso", "Taxa de entrega salva com sucesso!")
        } catch (error) {
            console.error("Erro ao salvar taxa:", error);
            Alert.alert("Erro", "Não foi possível salvar a taxa de entrega.")
        } finally {
            setSavingDeliveryFee(false)
        }
    }

    const formatTransferDate = (dateString: string | null | undefined) => {
        if (!dateString) return "A definir";
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "Data Inválida";
            }
            return date.toLocaleDateString("pt-BR", { 
                day: "2-digit", 
                month: "2-digit", 
                year: "numeric" 
            });
        } catch {
            return "Erro de Formato";
        }
    };

    // Usamos o saldoTotalAPI, mas mantemos a variável totalSaldo como alias
    const totalSaldo = saldoTotalAPI; 


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

            {/* ✅ CARD DE SALDO TOTAL E CONTA DESTINO */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                    <Ionicons name="trending-up" size={24} color="#4CAF50" />
                    <Text style={styles.balanceLabel}>Saldo Total (Disponível + Futuro)</Text>
                </View>
                {/* 🎯 CORRIGIDO: Agora usa o valor total vindo da API */}
                <Text style={styles.balanceValue}>{formatCurrency(totalSaldo)}</Text>
                
                <View style={styles.transferDetailContainer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#2E7D32" />
                        <Text style={styles.detailText}>Disponível para Repasse: {formatCurrency(saldoDisponivel)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color="#FFA500" />
                        <Text style={styles.detailText}>A Caminho do Seu Banco: {formatCurrency(saldoACaminho)}</Text>
                    </View>
                </View>
                
                <View style={styles.transferInfo}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.transferText}>Próxima transferência: {formatTransferDate(proximaTransferencia)}</Text>
                </View>
                <View style={styles.accountInfo}>
                    <Ionicons name="business-outline" size={16} color="#333" />
                    <Text style={styles.accountText}>Conta Destino: {contaDestino.length > 30 ? contaDestino.substring(0, 30) + '...' : contaDestino}</Text>
                </View>
            </View>

            {/* 💸 Repasses futuros */}
            <View style={styles.repassesSection}>
                <Text style={styles.repassesTitle}>
                    💸 Repasses Futuros
                </Text>
                {Array.isArray(repassesFuturos) && repassesFuturos.length > 0 ? (
                    repassesFuturos.map((repasse, index) => (
                        <View
                            key={index}
                            style={styles.repasseRow}
                        >
                            <Text style={styles.repasseDate}>
                                Deve chegar em{" "}
                                {new Date(repasse.data).toLocaleDateString("pt-BR", {
                                    day: "numeric",
                                    month: "short",
                                })}
                            </Text>
                            <Text style={styles.repasseValue}>
                                {formatCurrency(cleanValue(repasse.valor))}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={{ color: "gray", fontSize: 14 }}>Nenhum repasse futuro no momento.</Text>
                )}
            </View>


            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
                <Ionicons name="cash-outline" size={32} color="#E53935" />
                <Text style={styles.sectionTitle}>Comissões da Plataforma</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
                Valor a ser pago à plataforma referente aos pedidos em Dinheiro e Pix a cada 30 dias! (10% do valor total). 
            </Text>

            <View style={styles.card}>
                <Text style={styles.cardLabel}>Valor Pendente</Text>
                <Text style={styles.cardValue}>{formatCurrency(totalComissao)}</Text>
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
                    placeholder="Ex: 5,00"
                    keyboardType="numeric"
                    value={taxaEntrega ?? ""}
                    onChangeText={handleTaxaEntregaChange}
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

// --- Estilos ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    scrollContent: { padding: 20 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
    loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
    header: { alignItems: "center", marginBottom: 20 },
    title: { fontSize: 24, fontWeight: "bold", color: "#333", marginTop: 10 },
    subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 5 },
    
    // Estilos do Card de Saldo
    balanceCard: { backgroundColor: "#E8F5E9", borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 2, borderColor: "#4CAF50" },
    balanceHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    balanceLabel: { fontSize: 16, color: "#2E7D32", fontWeight: "600", marginLeft: 8 },
    balanceValue: { fontSize: 42, fontWeight: "bold", color: "#1B5E20", marginBottom: 12 },
    transferDetailContainer: { marginBottom: 15, padding: 10, backgroundColor: '#fff', borderRadius: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    detailText: { fontSize: 14, marginLeft: 8, color: '#333' },

    transferInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 8, marginTop: 10 },
    transferText: { fontSize: 14, color: "#666", marginLeft: 8, fontWeight: "500" },
    accountInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 8, marginTop: 8 },
    accountText: { fontSize: 14, color: "#333", marginLeft: 8, fontWeight: "500" },
    
    // Estilos da Sessão de Repasses Futuros
    repassesSection: { backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 20 },
    repassesTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#333" },
    repasseRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 6,
    },
    repasseDate: { color: "#666", fontSize: 15 },
    repasseValue: { fontWeight: "bold", color: "#0B7709", fontSize: 15 },


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