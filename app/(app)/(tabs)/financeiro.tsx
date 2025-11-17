"use client";

import { useState, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";
import api from "../../../src/api/api";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStripe, StripeProvider } from "@stripe/stripe-react-native";

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
    const stripe = useStripe();

    const [totalComissao, setTotalComissao] = useState(0);
    const [comissaoId, setComissaoId] = useState<number | null>(null);

    const [saldoDisponivel, setSaldoDisponivel] = useState(0);
    const [saldoACaminho, setSaldoACaminho] = useState(0);
    const [contaDestino, setContaDestino] = useState("Não definida");
    const [saldoTotalAPI, setSaldoTotalAPI] = useState(0);

    const [proximaTransferencia, setProximaTransferencia] =
        useState<string | null>(null);
    const [repassesFuturos, setRepassesFuturos] = useState<RepasseFuturo[]>([]);

    const [taxaEntrega, setTaxaEntrega] = useState<string>("");

    const [dataPrimeiroPendente, setDataPrimeiroPendente] = useState<
        string | null
    >(null);
    const [diasPendente, setDiasPendente] = useState(0);

    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [savingDeliveryFee, setSavingDeliveryFee] = useState(false);

    const insets = useSafeAreaInsets();

    const calcularDias = (dataString: string | null): number => {
        if (!dataString) return 0;

        const data = new Date(dataString);
        const hoje = new Date();

        const utc1 = Date.UTC(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate()
        );
        const utc2 = Date.UTC(
            data.getFullYear(),
            data.getMonth(),
            data.getDate()
        );

        return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
    };

    const fetchDadosFinanceiros = useCallback(async () => {
        if (!loja?.id) return;

        setLoading(true);

        try {
            const [saldoResponse, comissoesResponse, lojaResponse] =
                await Promise.all([
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

            /** COMISSÕES */
            const { valorPendente, comissaoId, data_primeiro_pendente } =
                comissoesResponse.data;

            setTotalComissao(cleanValue(valorPendente));
            setComissaoId(comissaoId ?? null);

            // salva data e calcula dias
            setDataPrimeiroPendente(data_primeiro_pendente ?? null);

            const dias = calcularDias(data_primeiro_pendente);
            setDiasPendente(dias);

            /** TAXA ENTREGA */
            const taxaEntregaValue = cleanValue(
                lojaResponse.data.taxa_entrega || 0
            );
            setTaxaEntrega(taxaEntregaValue.toFixed(2).replace(".", ","));
        } catch (err) {
            Alert.alert("Erro", "Não foi possível carregar os dados financeiros.");
        }

        setLoading(false);
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
        if (parts.length > 2) {
            cleanedText = parts[0] + "," + parts.slice(1).join("");
        }
        setTaxaEntrega(cleanedText);
    };

    const handlePayment = async () => {
        if (totalComissao <= 0 || !loja?.id) {
            Alert.alert("Aviso", "Não há comissão pendente.");
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

            const { error: presentError } =
                await stripe.presentPaymentSheet();

            if (presentError) {
                Alert.alert(
                    "Atenção",
                    presentError.message.includes("Canceled")
                        ? "Pagamento cancelado."
                        : presentError.message
                );
                return;
            }

            await api.post("/payments/confirmar-pagamento", {
                lojaId: loja.id,
                paymentIntentId: clientSecret.split("_secret")[0],
            });

            Alert.alert("Sucesso!", "Comissão paga com sucesso.");
            fetchDadosFinanceiros();
        } catch (err) {
            Alert.alert("Erro", "Falha ao processar pagamento.");
        }

        setPaymentLoading(false);
    };

    const handleSaveDeliveryFee = async () => {
        if (!loja?.id) {
            Alert.alert("Erro", "Loja não identificada.");
            return;
        }

        const taxaNum = cleanValue(taxaEntrega.replace(",", "."));
        if (taxaNum < 0) {
            Alert.alert("Erro", "Valor inválido.");
            return;
        }

        setSavingDeliveryFee(true);
        try {
            await api.put(`/lojas/${loja.id}/taxa-entrega`, {
                taxa_entrega: taxaNum,
            });

            Alert.alert("Sucesso", "Taxa salva!");
        } catch {
            Alert.alert("Erro", "Falha ao salvar taxa.");
        }
        setSavingDeliveryFee(false);
    };

    const formatTransferDate = (dateString: string | null | undefined) => {
        if (!dateString) return "A definir";

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Inválida";

            return date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch {
            return "Erro";
        }
    };

    const totalSaldo = saldoTotalAPI;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                    Carregando dados financeiros...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{
                paddingBottom: insets.bottom + 20,
                padding: 20,
            }}
        >
            <View style={styles.header}>
                <Ionicons
                    name="wallet-outline"
                    size={60}
                    color="#4CAF50"
                />
                <Text style={styles.title}>Financeiro</Text>
                <Text style={styles.subtitle}>
                    Acompanhe seus ganhos e pagamentos
                </Text>
            </View>

            {/* --------------------------- SALDO --------------------------- */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                    <Ionicons name="trending-up" size={24} color="#4CAF50" />
                    <Text style={styles.balanceLabel}>
                        Saldo Total (Disponível + Futuro)
                    </Text>
                </View>

                <Text style={styles.balanceValue}>
                    {formatCurrency(totalSaldo)}
                </Text>

                <View style={styles.transferDetailContainer}>
                    <View style={styles.detailRow}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={16}
                            color="#2E7D32"
                        />
                        <Text style={styles.detailText}>
                            Disponível: {formatCurrency(saldoDisponivel)}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons
                            name="time-outline"
                            size={16}
                            color="#FFA500"
                        />
                        <Text style={styles.detailText}>
                            A caminho: {formatCurrency(saldoACaminho)}
                        </Text>
                    </View>
                </View>

                <View style={styles.transferInfo}>
                    <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#666"
                    />
                    <Text style={styles.transferText}>
                        Próxima transferência:{" "}
                        {formatTransferDate(proximaTransferencia)}
                    </Text>
                </View>

                <View style={styles.accountInfo}>
                    <Ionicons
                        name="business-outline"
                        size={16}
                        color="#333"
                    />
                    <Text style={styles.accountText}>
                        Conta: {contaDestino}
                    </Text>
                </View>
            </View>

            {/* ----------------------- REPASSES FUTUROS ----------------------- */}
            <View style={styles.repassesSection}>
                <Text style={styles.repassesTitle}>💸 Repasses Futuros</Text>

                {repassesFuturos.length > 0 ? (
                    repassesFuturos.map((repasse, index) => (
                        <View style={styles.repasseRow} key={index}>
                            <Text style={styles.repasseDate}>
                                Chega em{" "}
                                {new Date(repasse.data).toLocaleDateString(
                                    "pt-BR",
                                    {
                                        day: "numeric",
                                        month: "short",
                                    }
                                )}
                            </Text>
                            <Text style={styles.repasseValue}>
                                {formatCurrency(cleanValue(repasse.valor))}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={{ color: "gray", fontSize: 14 }}>
                        Nenhum repasse futuro.
                    </Text>
                )}
            </View>

            <View style={styles.divider} />

            {/* --------------------- COMISSÕES ---------------------- */}
            <View style={styles.sectionHeader}>
                <Ionicons
                    name="cash-outline"
                    size={32}
                    color="#E53935"
                />
                <Text style={styles.sectionTitle}>Comissões da Plataforma</Text>
            </View>

            <Text style={styles.sectionSubtitle}>
                Pagamento referente aos pedidos em Dinheiro / Pix.  
                Prazo máximo: 30 dias.
            </Text>


            {/* ---------------------- CARDS DE ALERTA ---------------------- */}
            {diasPendente >= 30 && (
                <View style={styles.reminderCard}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={24}
                        color="#B00020"
                    />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.reminderTitle}>
                            Comissão Vencida
                        </Text>
                        <Text style={styles.reminderText}>
                            Sua comissão venceu há {diasPendente - 30} dia(s).
                        </Text>
                    </View>
                </View>
            )}

            {diasPendente > 20 && diasPendente < 30 && (
                <View style={styles.reminderCard}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={24}
                        color="#B45309"
                    />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.reminderTitle}>
                            Prestes a vencer
                        </Text>
                        <Text style={styles.reminderText}>
                            Faltam {30 - diasPendente} dias.
                        </Text>
                    </View>
                </View>
            )}

            {diasPendente > 0 && diasPendente <= 20 && (
                <View style={styles.reminderCard}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={24}
                        color="#B45309"
                    />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.reminderTitle}>
                            Comissão pendente
                        </Text>
                        <Text style={styles.reminderText}>
                            Ainda dentro do prazo de 30 dias.
                        </Text>
                    </View>
                </View>
            )}

            {/* ------------------ VALOR E BOTÃO DE PAGAMENTO ------------------ */}
            <View style={styles.card}>
                <Text style={styles.cardLabel}>Valor Pendente</Text>
                <Text style={styles.cardValue}>
                    {formatCurrency(totalComissao)}
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.payButton,
                    totalComissao <= 0 && styles.payButtonDisabled,
                ]}
                disabled={totalComissao <= 0 || paymentLoading}
                onPress={handlePayment}
            >
                {paymentLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.payButtonText}>
                        Pagar Comissão
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* ------------------ TAXA DE ENTREGA ------------------ */}
            <View style={styles.deliverySection}>
                <Text style={styles.deliveryTitle}>Taxa de Entrega</Text>
                <Text style={styles.deliverySubtitle}>
                    Defina o valor cobrado por entrega.
                </Text>

                <Text style={styles.inputLabel}>Valor (R$)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 5,00"
                    keyboardType="numeric"
                    value={taxaEntrega}
                    onChangeText={handleTaxaEntregaChange}
                />

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveDeliveryFee}
                    disabled={savingDeliveryFee}
                >
                    {savingDeliveryFee ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            Salvar Taxa
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

/* ---------- ESTILOS ---------- */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
    loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
    header: { alignItems: "center", marginBottom: 20 },
    title: { fontSize: 26, fontWeight: "bold", color: "#333" },
    subtitle: { fontSize: 14, color: "#666", marginTop: 4 },

    balanceCard: {
        backgroundColor: "#E8F5E9",
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: "#4CAF50",
    },
    balanceHeader: { flexDirection: "row", alignItems: "center" },
    balanceLabel: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: "600",
        color: "#2E7D32",
    },
    balanceValue: {
        fontSize: 40,
        fontWeight: "bold",
        color: "#1B5E20",
        marginVertical: 12,
    },

    transferDetailContainer: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 4,
    },
    detailText: { marginLeft: 8, color: "#333" },

    transferInfo: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    transferText: { marginLeft: 8, color: "#666" },

    accountInfo: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    accountText: { marginLeft: 8, color: "#333", fontWeight: "600" },

    repassesSection: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    repassesTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
    repasseRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderBottomColor: "#eee",
        borderBottomWidth: 1,
    },
    repasseDate: { color: "#555" },
    repasseValue: { fontWeight: "bold", color: "#0B7709" },

    divider: { height: 1, backgroundColor: "#ddd", marginVertical: 25 },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionTitle: { fontSize: 20, marginLeft: 12, fontWeight: "bold" },
    sectionSubtitle: {
        textAlign: "center",
        fontSize: 14,
        marginVertical: 10,
        color: "#555",
    },

    reminderCard: {
        flexDirection: "row",
        backgroundColor: "#FEF3C7",
        padding: 16,
        borderRadius: 12,
        borderColor: "#FCD34D",
        borderWidth: 1,
        marginBottom: 15,
        alignItems: "center",
    },
    reminderTitle: { fontSize: 16, fontWeight: "bold", color: "#B45309" },
    reminderText: { color: "#7C2D12" },

    card: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 20,
    },
    cardLabel: { fontSize: 16, color: "#666" },
    cardValue: { fontSize: 36, fontWeight: "bold", color: "#E53935" },

    payButton: {
        backgroundColor: "#4CAF50",
        padding: 16,
        alignItems: "center",
        borderRadius: 8,
    },
    payButtonDisabled: { backgroundColor: "#ccc" },
    payButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

    deliverySection: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
    },
    deliveryTitle: { fontSize: 20, fontWeight: "bold" },
    deliverySubtitle: { color: "#666", marginBottom: 20 },
    inputLabel: { fontWeight: "600", marginBottom: 5 },
    input: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 12,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: "#007AFF",
        padding: 16,
        alignItems: "center",
        borderRadius: 8,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
