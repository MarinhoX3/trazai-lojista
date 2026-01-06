"use client";

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  Linking,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importações de API e Contextos (ajustados para a sua estrutura)
import api from '../../../src/api/api';
import { useAuthLoja } from '../../../src/api/contexts/AuthLojaContext';
import { usePedidosAtivos } from '../../../src/api/contexts/PedidosAtivosContext';

interface Pedido {
  id: number;
  data_hora: string;
  valor_total: string;
  status: string;
  nome_cliente: string;
  endereco_entrega: string;
  telefone_cliente: string;
  whatsapp_cliente?: string;
  tipo_entrega: string;
  metodo_pagamento: string;
}

const STATUS_FLUXO = ['Recebido', 'Preparando', 'A caminho', 'Finalizado'];

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loja } = useAuthLoja();
  const { fetchPedidosPendentesCount } = usePedidosAtivos();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Procura os pedidos da loja na API
  const buscarPedidos = useCallback(async () => {
    if (!loja?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/pedidos/loja/${loja.id}`);
      setPedidos(response.data);
    } catch (error) {
      console.error("Erro ao procurar pedidos:", error);
      Alert.alert("Erro", "Não foi possível carregar os pedidos ativos.");
    } finally {
      setLoading(false);
    }
  }, [loja?.id]);

  useFocusEffect(
    useCallback(() => {
      buscarPedidos();
      fetchPedidosPendentesCount();
    }, [buscarPedidos, fetchPedidosPendentesCount])
  );

  // 🚀 Atualiza o status do pedido e gere a lista local
  const handleAtualizarStatus = async (idPedido: number, novoStatus: string) => {
    try {
      await api.put(`/pedidos/${idPedido}/status`, { status: novoStatus });
      
      setPedidos(pedidosAtuais => {
        if (novoStatus === 'Finalizado' || novoStatus === 'Cancelado') {
          return pedidosAtuais.filter(p => p.id !== idPedido);
        }
        return pedidosAtuais.map(p =>
          p.id === idPedido ? { ...p, status: novoStatus } : p
        );
      });
      
      fetchPedidosPendentesCount();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar o estado do pedido.');
    }
  };

  // 💬 Abre o WhatsApp para falar com o cliente
  const conversarWhatsApp = (item: Pedido) => {
    const numeroWhatsapp = item.whatsapp_cliente?.replace(/\D/g, "");
    if (!numeroWhatsapp) {
      Alert.alert("Aviso", "Este cliente não disponibilizou um contacto de WhatsApp.");
      return;
    }
    const msg = `Olá ${item.nome_cliente}! Sou da loja e gostaria de falar sobre o seu pedido #${item.id}.`;
    const url = `https://wa.me/55${numeroWhatsapp}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o WhatsApp."));
  };

  const renderPedido = ({ item }: { item: Pedido }) => {
    const statusAtualIndex = STATUS_FLUXO.indexOf(item.status);
    const proximoStatus = STATUS_FLUXO[statusAtualIndex + 1];
    const isPickup = item.tipo_entrega === "pickup";

    return (
      <View style={styles.card}>
        {/* CABEÇALHO: ID E HORA */}
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.idBadge}>
              <Text style={styles.orderId}>Pedido #{item.id}</Text>
            </View>
            <Text style={styles.orderTime}>
              Realizado às {new Date(item.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#eff6ff' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* INFO DO CLIENTE */}
        <View style={styles.clientSection}>
          <View style={styles.clientIconBg}>
            <Ionicons name="person" size={18} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{item.nome_cliente}</Text>
            <Text style={styles.clientPhone}>{item.whatsapp_cliente || item.telefone_cliente}</Text>
          </View>
          <TouchableOpacity style={styles.waBtnSmall} onPress={() => conversarWhatsApp(item)}>
            <Ionicons name="logo-whatsapp" size={20} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* LOGÍSTICA E PAGAMENTO */}
        <View style={styles.detailsRow}>
          <View style={styles.detailBox}>
            <Ionicons name={isPickup ? "storefront-outline" : "bicycle-outline"} size={16} color="#4b5563" />
            <Text style={styles.detailLabel}>{isPickup ? "Retirada" : "Entrega"}</Text>
          </View>
          <View style={styles.detailBox}>
            <Ionicons name="card-outline" size={16} color="#4b5563" />
            <Text style={styles.detailLabel} numberOfLines={1}>{item.metodo_pagamento}</Text>
          </View>
        </View>

        {!isPickup && (
          <View style={styles.addressBox}>
            <Ionicons name="location-outline" size={16} color="#94a3b8" />
            <Text style={styles.addressText} numberOfLines={2}>{item.endereco_entrega}</Text>
          </View>
        )}

        {/* VALOR TOTAL */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Valor a Receber</Text>
          <Text style={styles.priceValue}>R$ {parseFloat(item.valor_total).toFixed(2).replace('.', ',')}</Text>
        </View>

        {/* BOTÕES DE GESTÃO */}
        <View style={styles.actionArea}>
          {proximoStatus && (
            <TouchableOpacity 
              style={styles.mainActionBtn} 
              onPress={() => handleAtualizarStatus(item.id, proximoStatus)}
            >
              <Text style={styles.mainActionBtnText}>Mover para "{proximoStatus}"</Text>
              <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          
          <View style={styles.secondaryActionRow}>
            <TouchableOpacity 
              style={styles.iconActionBtn}
              onPress={() => router.push({ pathname: "/imprimir-pedido", params: { id_pedido: item.id.toString() } })}
            >
              <Ionicons name="print-outline" size={22} color="#64748b" />
              <Text style={styles.iconActionLabel}>Imprimir</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.iconActionBtn, { borderColor: '#fee2e2' }]}
              onPress={() => router.push({ pathname: "/detalhes-pedido", params: { id_pedido: item.id.toString(), cancelar: "1" } })}
            >
              <Ionicons name="close-circle-outline" size={22} color="#dc2626" />
              <Text style={[styles.iconActionLabel, { color: '#dc2626' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* CABEÇALHO PERSONALIZADO COM PADDING SUPERIOR SEGURO */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.customHeaderSubtitle}>Painel Administrativo</Text>
          <Text style={styles.customHeaderTitle}>Pedidos Ativos</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/historico-pedidos')} style={styles.navHistoryBtn}>
          <Ionicons name="time-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>A procurar novos pedidos...</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listScrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Fluxo de Atendimento</Text>
              <View style={styles.activeCountBadge}>
                <Text style={styles.activeCountText}>{pedidos.length} ativos</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={50} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Sem pedidos ativos</Text>
              <Text style={styles.emptySubtitle}>Quando receber um novo pedido, ele aparecerá aqui com um alerta sonoro.</Text>
              <TouchableOpacity 
                style={styles.emptyHistoryBtn}
                onPress={() => router.push('/historico-pedidos')}
              >
                <Text style={styles.emptyHistoryBtnText}>Ver Histórico de Pedidos</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  
  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  customHeaderSubtitle: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  customHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  navHistoryBtn: { padding: 10, backgroundColor: '#eff6ff', borderRadius: 12 },

  listScrollContent: { padding: 20 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  listTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 },
  activeCountBadge: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Cartão de Pedido
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  orderId: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  orderTime: { fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },

  // Cliente
  clientSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  clientIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#334155' },
  clientPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  waBtnSmall: { padding: 8, backgroundColor: '#f0fdf4', borderRadius: 10 },
  
  // Detalhes
  detailsRow: { flexDirection: 'row', marginBottom: 12, gap: 10 },
  detailBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flex: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  detailLabel: { marginLeft: 6, fontSize: 12, fontWeight: '600', color: '#475569' },
  
  addressBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f8fafc', padding: 10, borderRadius: 12, marginBottom: 16 },
  addressText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#64748b', lineHeight: 18 },

  priceContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#1e293b', 
    padding: 14, 
    borderRadius: 16,
    marginBottom: 20
  },
  priceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#fff' },

  // Ações
  actionArea: { gap: 12 },
  mainActionBtn: { 
    backgroundColor: '#22c55e', 
    height: 54, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  mainActionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', marginRight: 8 },
  
  secondaryActionRow: { flexDirection: 'row', gap: 10 },
  iconActionBtn: { 
    flex: 1, 
    height: 50, 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f1f5f9'
  },
  iconActionLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 2 },

  // Estado Vazio
  emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 24, elevation: 2, shadowOpacity: 0.05 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
  emptyHistoryBtn: { marginTop: 32, backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16 },
  emptyHistoryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 }
});