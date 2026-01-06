"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  Modal,
  StatusBar,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importação da API (ajuste conforme o seu projeto)
import api from "../../../src/api/api";

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

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    "Morada incorreta",
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
      console.error("Erro ao procurar detalhes:", error);
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
      setPedido((prev) => (prev ? { ...prev, status: novoStatus } : null));

      if (novoStatus === "Finalizado" || novoStatus === "Cancelado") {
        Alert.alert("Sucesso", `Pedido ${novoStatus.toLowerCase()}!`, [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Sucesso", `Estado atualizado para "${novoStatus}".`);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o estado.");
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
      Alert.alert("Cancelado", "Pedido cancelado com sucesso.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao cancelar o pedido.");
    }
  };

  const conversarWhatsApp = () => {
    if (!pedido?.telefone_cliente) return;
    const phone = pedido.telefone_cliente.replace(/\D/g, "");
    const message = `Olá ${pedido.nome_cliente}! Sou da loja e estou a entrar em contacto sobre o seu pedido #${pedido.id}.`;
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o WhatsApp."));
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>A carregar detalhes...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
        <Text style={styles.loadingText}>Pedido não encontrado.</Text>
        <TouchableOpacity style={styles.backBtnEmpty} onPress={() => router.back()}>
          <Text style={styles.backBtnEmptyText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCancelado = pedido.status === "Cancelado";
  const isFinalizado = pedido.status === "Finalizado";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* CABEÇALHO PERSONALIZADO */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
          <Text style={styles.headerSubtitle}>#{pedido.id}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD DE STATUS ATUAL */}
        <View style={[styles.statusCard, isCancelado ? styles.statusCardCancel : isFinalizado ? styles.statusCardFinal : null]}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Estado Atual</Text>
            <Text style={[styles.statusValue, isCancelado && { color: '#991b1b' }, isFinalizado && { color: '#166534' }]}>
              {pedido.status}
            </Text>
          </View>
          <Ionicons 
            name={isCancelado ? "close-circle" : isFinalizado ? "checkmark-circle" : "time"} 
            size={32} 
            color={isCancelado ? "#dc2626" : isFinalizado ? "#16a34a" : "#2563eb"} 
          />
        </View>

        {/* DADOS DO CLIENTE */}
        <Text style={styles.sectionLabel}>Informações do Cliente</Text>
        <View style={styles.card}>
          <View style={styles.clientMainRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{pedido.nome_cliente.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.clientName}>{pedido.nome_cliente}</Text>
              <Text style={styles.clientPhone}>{pedido.telefone_cliente}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${pedido.telefone_cliente}`)}>
              <Ionicons name="call" size={20} color="#2563eb" />
              <Text style={styles.actionBtnText}>Ligar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#dcfce7' }]} onPress={conversarWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
              <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.addressRow} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.endereco_entrega)}`)}>
            <View style={styles.addressIconBg}>
              <Ionicons name="location" size={18} color="#64748b" />
            </View>
            <Text style={styles.addressText}>{pedido.endereco_entrega}</Text>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* ITENS DO PEDIDO */}
        <Text style={styles.sectionLabel}>Itens do Pedido</Text>
        <View style={styles.card}>
          {pedido.itens.map((item, index) => (
            <View key={index} style={[styles.itemRow, index === pedido.itens.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.qtyBox}>
                <Text style={styles.qtyText}>{item.quantidade}x</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.nome_produto}</Text>
                <Text style={styles.itemUnit}>R$ {parseFloat(item.preco_unitario_congelado).toFixed(2).replace('.', ',')} / un</Text>
              </View>
              <Text style={styles.itemSubtotal}>
                R$ {(item.quantidade * parseFloat(item.preco_unitario_congelado)).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
          
          <View style={styles.paymentInfoRow}>
            <Ionicons name="wallet-outline" size={16} color="#64748b" />
            <Text style={styles.paymentMethodLabel}>Pagamento via {pedido.forma_pagamento}</Text>
          </View>
        </View>

        {/* RESUMO FINANCEIRO */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total do Pedido</Text>
          <Text style={styles.totalValue}>R$ {parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')}</Text>
        </View>

        {/* SECÇÃO DE CANCELAMENTO (SE APLICÁVEL) */}
        {isCancelado && (
          <View style={styles.cancelNoticeCard}>
            <View style={styles.cancelHeader}>
              <Ionicons name="alert-circle" size={20} color="#be123c" />
              <Text style={styles.cancelTitle}>Pedido Cancelado</Text>
            </View>
            <Text style={styles.cancelInfo}>
              Cancelado por: <Text style={{ fontWeight: '700' }}>{pedido.cancelado_por || "Sistema"}</Text>
            </Text>
            {pedido.motivo_cancelamento && (
              <Text style={styles.cancelReason}>Motivo: {pedido.motivo_cancelamento}</Text>
            )}
          </View>
        )}

        {/* BOTÕES DE GESTÃO (APENAS SE NÃO CANCELADO/FINALIZADO) */}
        {!isCancelado && !isFinalizado && (
          <View style={styles.managementSection}>
            <Text style={styles.sectionLabel}>Ações de Gestão</Text>
            
            {pedido.status === "Recebido" && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAtualizarStatus("Preparando")}>
                <Text style={styles.btnPrimaryText}>Iniciar Preparação</Text>
                <Ionicons name="play-circle" size={22} color="#fff" />
              </TouchableOpacity>
            )}

            {pedido.status === "Preparando" && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAtualizarStatus("A caminho")}>
                <Text style={styles.btnPrimaryText}>Despachar para Entrega</Text>
                <Ionicons name="bicycle" size={22} color="#fff" />
              </TouchableOpacity>
            )}

            {pedido.status === "A caminho" && (
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#16a34a' }]} onPress={() => handleAtualizarStatus("Finalizado")}>
                <Text style={styles.btnPrimaryText}>Confirmar Entrega / Finalizar</Text>
                <Ionicons name="checkmark-done-circle" size={22} color="#fff" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.btnCancelOutline} onPress={() => setShowCancelModal(true)}>
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text style={styles.btnCancelText}>Cancelar Pedido</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE CANCELAMENTO */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancelar Pedido</Text>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Por favor, indique o motivo do cancelamento deste pedido:</Text>

            {motivos.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.reasonOption, motivoCancelamento === m && styles.reasonOptionSelected]}
                onPress={() => setMotivoCancelamento(m)}
              >
                <View style={[styles.radio, motivoCancelamento === m && styles.radioActive]} />
                <Text style={[styles.reasonText, motivoCancelamento === m && styles.reasonTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalBackBtn} onPress={() => setShowCancelModal(false)}>
                <Text style={styles.modalBackBtnText}>Voltar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalConfirmBtn, !motivoCancelamento && { opacity: 0.5 }]} 
                onPress={confirmarCancelamento}
                disabled={!motivoCancelamento}
              >
                <Text style={styles.modalConfirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  backBtnEmpty: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2563eb', borderRadius: 12 },
  backBtnEmptyText: { color: '#fff', fontWeight: '700' },

  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleWrapper: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
  backBtn: { padding: 4 },

  scrollContent: { padding: 20 },

  // Status Card
  statusCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#dbeafe'
  },
  statusCardCancel: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  statusCardFinal: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  statusValue: { fontSize: 20, fontWeight: '800', color: '#2563eb' },

  // Cards & Sections
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },

  // Client Details
  clientMainRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  clientName: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  clientPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: '#eff6ff' },
  actionBtnText: { marginLeft: 8, fontWeight: '700', color: '#2563eb', fontSize: 13 },
  
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  addressIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addressText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  qtyBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#334155' },
  itemUnit: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  itemSubtotal: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  paymentInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  paymentMethodLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginLeft: 6 },

  // Total Card
  totalCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  totalLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#fff' },

  // Management Section
  managementSection: { marginTop: 10 },
  btnPrimary: { backgroundColor: '#2563eb', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnCancelOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: '#fee2e2', marginTop: 16, gap: 8 },
  btnCancelText: { color: '#dc2626', fontWeight: '700' },

  // Cancel Notice Card
  cancelNoticeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderLeftWidth: 4, borderLeftColor: '#be123c', marginBottom: 24 },
  cancelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cancelTitle: { fontSize: 15, fontWeight: '800', color: '#be123c' },
  cancelInfo: { fontSize: 13, color: '#4b5563' },
  cancelReason: { fontSize: 13, color: '#991b1b', marginTop: 6, fontWeight: '600', fontStyle: 'italic' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", padding: 24 },
  modalBox: { backgroundColor: "#fff", borderRadius: 32, padding: 24, elevation: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  modalSubtitle: { fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 20 },
  reasonOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: '#f8fafc', marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  reasonOptionSelected: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 12 },
  radioActive: { borderColor: '#dc2626', backgroundColor: '#dc2626' },
  reasonText: { fontSize: 15, color: '#475569', fontWeight: '600' },
  reasonTextActive: { color: '#991b1b' },
  modalActionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBackBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  modalBackBtnText: { fontWeight: '700', color: '#64748b' },
  modalConfirmBtn: { flex: 1.5, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626' },
  modalConfirmBtnText: { fontWeight: '800', color: '#fff' }
});