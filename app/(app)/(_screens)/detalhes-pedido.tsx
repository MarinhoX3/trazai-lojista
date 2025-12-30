import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import api from "../../../src/api/api";
import { Ionicons } from "@expo/vector-icons";

interface ItemDoPedido {
  quantidade: number;
  preco_unitario_congelado: string;
  nome_produto: string;
}

interface PedidoDetalhes {
  id: number;
  data_hora: string;
  valor_total: string;
  status: string;
  endereco_entrega: string;
  nome_cliente: string;
  telefone_cliente: string;
  forma_pagamento: string;
  motivo_cancelamento?: string;
  cancelado_por?: string;
  itens: ItemDoPedido[];
}

export default function DetalhesPedidoScreen() {
  const router = useRouter();
  const { id_pedido, cancelar } = useLocalSearchParams<{
    id_pedido?: string;
    cancelar?: string;
  }>();

  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");

  const motivos = [
    "Cliente desistiu",
    "Produto indisponível",
    "Endereço incorreto",
    "Problema no pagamento",
    "Outro motivo",
  ];

  const buscarDetalhes = useCallback(async () => {
    if (!id_pedido) return;
    try {
      setLoading(true);
      const response = await api.get(`/pedidos/${id_pedido}/detalhes`);
      setPedido(response.data);
    } catch (error) {
      console.error("Erro ao buscar detalhes do pedido:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes do pedido.");
    } finally {
      setLoading(false);
    }
  }, [id_pedido]);

  useEffect(() => {
    buscarDetalhes();
  }, [buscarDetalhes]);

  useEffect(() => {
    if (
      cancelar === "1" &&
      pedido &&
      pedido.status !== "Cancelado" &&
      pedido.status !== "Finalizado"
    ) {
      setShowCancelModal(true);
    }
  }, [cancelar, pedido]);

  const handleAtualizarStatus = async (novoStatus: string) => {
    if (!pedido) return;
    try {
      await api.put(`/pedidos/${pedido.id}/status`, { status: novoStatus });
      Alert.alert("Sucesso!", `O pedido foi marcado como "${novoStatus}".`);

      setPedido((pedidoAtual) =>
        pedidoAtual ? { ...pedidoAtual, status: novoStatus } : null
      );

      if (novoStatus === "Finalizado" || novoStatus === "Cancelado") {
        router.back();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      Alert.alert("Erro", "Não foi possível atualizar o status do pedido.");
    }
  };

  const confirmarCancelamento = async () => {
    if (!pedido) return;
    if (!motivoCancelamento) {
      Alert.alert("Aviso", "Selecione um motivo para o cancelamento.");
      return;
    }

    try {
      await api.put(`/pedidos/${pedido.id}/status`, {
        status: "Cancelado",
        motivo: motivoCancelamento,
        cancelado_por: "lojista",
      });

      setShowCancelModal(false);
      Alert.alert("Pedido cancelado!", "O pedido foi cancelado com sucesso.");

      setPedido((prev) =>
        prev
          ? {
              ...prev,
              status: "Cancelado",
              motivo_cancelamento: motivoCancelamento,
              cancelado_por: "lojista",
            }
          : null
      );

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível cancelar o pedido.");
    }
  };

  // Ligar para cliente
  const ligarParaCliente = () => {
    if (pedido?.telefone_cliente) {
      Linking.openURL(`tel:${pedido.telefone_cliente}`);
    }
  };

  // Abrir endereço no mapa
  const abrirNoMapa = () => {
    if (pedido?.endereco_entrega) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        pedido.endereco_entrega
      )}`;
      Linking.openURL(url);
    }
  };

  // WhatsApp — NOVO
  const conversarWhatsApp = () => {
    if (!pedido?.telefone_cliente) {
      Alert.alert("Erro", "Número do cliente indisponível.");
      return;
    }

    const phone = pedido.telefone_cliente;
    const message = `Olá ${pedido.nome_cliente}! Estou entrando em contato sobre o pedido #${pedido.id} do TRAZAÍ.`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Pedido não encontrado.</Text>
      </View>
    );
  }

  const cancelado = pedido.status === "Cancelado";

  const labelCanceladoPor = (valor?: string) => {
    if (!valor) return "Desconhecido";
    if (valor.toLowerCase() === "lojista") return "Lojista";
    if (valor.toLowerCase() === "cliente") return "Cliente";
    return valor;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Detalhes do Pedido #${pedido.id}` }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Dados do Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Cliente</Text>

          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={18} color="#555" />
            <Text style={styles.detailText}>{pedido.nome_cliente}</Text>
          </View>

          <TouchableOpacity onPress={ligarParaCliente} style={styles.detailRow}>
            <Ionicons name="call-outline" size={18} color="#007BFF" />
            <Text style={[styles.detailText, styles.linkText]}>
              {pedido.telefone_cliente}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={abrirNoMapa} style={styles.detailRow}>
            <Ionicons name="home-outline" size={18} color="#007BFF" />
            <Text style={[styles.detailText, styles.linkText]}>
              {pedido.endereco_entrega}
            </Text>
          </TouchableOpacity>

          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={18} color="#555" />
            <Text style={styles.detailText}>
              Forma de Pagamento: {pedido.forma_pagamento}
            </Text>
          </View>
        </View>

        {/* Itens do Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
{pedido.itens.map((item, index) => {

  const qtd = Number(item.quantidade);

  const quantidadeFormatada = Number.isInteger(qtd)
    ? qtd.toString()
    : qtd.toFixed(2).replace(".", ",");

  return (
    <View key={index} style={styles.itemRow}>
      <Text style={styles.itemQty}>
        {quantidadeFormatada}x
      </Text>

      <Text style={styles.itemName}>{item.nome_produto}</Text>

      <Text style={styles.itemPrice}>
        R$ {parseFloat(item.preco_unitario_congelado).toFixed(2)}
      </Text>
    </View>
  );
})}

        </View>

        {/* Total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total do Pedido:</Text>
          <Text style={styles.totalValue}>
            R$ {parseFloat(pedido.valor_total).toFixed(2)}
          </Text>
        </View>

        {/* Cancelamento */}
        {cancelado && (
          <View style={[styles.section, styles.cancelSection]}>
            <Text style={styles.sectionTitle}>Informações de Cancelamento</Text>

            <View style={styles.detailRow}>
              <Ionicons name="close-circle-outline" size={20} color="#dc3545" />
              <Text style={[styles.detailText, styles.cancelStatusText]}>
                Este pedido foi cancelado.
              </Text>
            </View>

            {pedido.cancelado_por && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={18} color="#555" />
                <Text style={styles.detailText}>
                  Cancelado por: {labelCanceladoPor(pedido.cancelado_por)}
                </Text>
              </View>
            )}

            {pedido.motivo_cancelamento && (
              <View style={styles.detailRow}>
                <Ionicons name="alert-circle-outline" size={18} color="#555" />
                <Text style={styles.detailText}>
                  Motivo: {pedido.motivo_cancelamento}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* GERIR PEDIDO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gerir Pedido</Text>

          <View style={styles.statusContainer}>
            <Text style={styles.pedidoStatus}>
              Status Atual: {pedido.status}
            </Text>
          </View>

          {/* WhatsApp - NOVO */}
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={conversarWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.whatsappButtonText}>
              Conversar com o Cliente
            </Text>
          </TouchableOpacity>

          {/* Ações de status */}
          {!cancelado && pedido.status === "Recebido" && (
            <Pressable
              style={styles.actionButton}
              onPress={() => handleAtualizarStatus("Preparando")}
            >
              <Text style={styles.actionButtonText}>
                Marcar como "Preparando"
              </Text>
            </Pressable>
          )}

          {!cancelado && pedido.status === "Preparando" && (
            <Pressable
              style={styles.actionButton}
              onPress={() => handleAtualizarStatus("A caminho")}
            >
              <Text style={styles.actionButtonText}>
                Marcar como "A caminho"
              </Text>
            </Pressable>
          )}

          {!cancelado && pedido.status === "A caminho" && (
            <Pressable
              style={[styles.actionButton, styles.finalizarButton]}
              onPress={() => handleAtualizarStatus("Finalizado")}
            >
              <Text style={styles.actionButtonText}>Finalizar Pedido</Text>
            </Pressable>
          )}

          {/* Cancelar */}
          {pedido.status !== "Finalizado" && !cancelado && (
            <Pressable
              style={[styles.actionButton, styles.cancelarButton]}
              onPress={() => setShowCancelModal(true)}
            >
              <Text style={styles.actionButtonText}>Cancelar Pedido</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cancelar Pedido</Text>
            <Text style={styles.modalSubtitle}>
              Selecione o motivo do cancelamento:
            </Text>

            {motivos.map((m) => (
              <Pressable
                key={m}
                style={[
                  styles.motivoOption,
                  motivoCancelamento === m && styles.motivoOptionSelected,
                ]}
                onPress={() => setMotivoCancelamento(m)}
              >
                <Text style={styles.motivoText}>{m}</Text>
              </Pressable>
            ))}

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCancelModal(false);
                  setMotivoCancelamento("");
                }}
              >
                <Text style={styles.modalCancelText}>Voltar</Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirmButton}
                onPress={confirmarCancelamento}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  detailText: { fontSize: 16, marginLeft: 10, flex: 1 },
  linkText: { color: "#007BFF" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemQty: { fontSize: 16, fontWeight: "bold", flex: 0.15 },
  itemName: { fontSize: 16, flex: 0.6 },
  itemPrice: { fontSize: 16, flex: 0.25, textAlign: "right" },
  totalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    marginBottom: 20,
  },
  totalLabel: { fontSize: 18, fontWeight: "bold" },
  totalValue: { fontSize: 22, fontWeight: "bold", color: "#28a745" },
  statusContainer: {
    marginBottom: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#e0eefd",
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  pedidoStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#005a9c",
  },

  /* WHATSAPP BUTTON */
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  whatsappButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  actionButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  finalizarButton: { backgroundColor: "#28a745" },
  cancelarButton: { backgroundColor: "#dc3545" },
  actionButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  /* Cancelamento */
  cancelSection: { borderLeftWidth: 4, borderLeftColor: "#dc3545" },
  cancelStatusText: { color: "#dc3545", fontWeight: "600" },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: { width: "85%", backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalSubtitle: { fontSize: 16, marginBottom: 15, color: "#555" },
  motivoOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
  },
  motivoOptionSelected: { backgroundColor: "#cfe2ff" },
  motivoText: { fontSize: 16 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalCancelButton: {
    padding: 12,
    backgroundColor: "#ddd",
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  modalConfirmButton: {
    padding: 12,
    backgroundColor: "#d93025",
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  modalCancelText: { fontSize: 16, color: "#555" },
  modalConfirmText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
});
