"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Importações de API e Contexto
import api from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";

export default function RelatorioVendas() {
  const { loja } = useAuthLoja();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [diasFiltro, setDiasFiltro] = useState<0 | 7 | 30 | null>(0);
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>({
    total_vendido: 0,
    total_pedidos: 0,
    cartao_app: 0,
    pix: 0,
    dinheiro: 0,
    maquininha: 0,
    pedidos_lista: [],
  });

  const carregar = async () => {
    if (!loja?.id) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/financeiro/relatorio-vendas/${loja.id}?dias=${diasFiltro}`
      );
      setDados(res.data);
    } catch (err) {
      console.log("Erro ao procurar relatório", err);
      Alert.alert("Erro", "Não foi possível carregar os dados do relatório.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [diasFiltro]);

  const formatarData = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
  };

  const StatCard = ({ titulo, valor, icon, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.statTitle}>{titulo}</Text>
        <Text style={styles.statValue}>{formatCurrency(valor)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* CABEÇALHO */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatório de Vendas</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={carregar}>
          <Ionicons name="reload" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* FILTROS (CHIPS) */}
        <View style={styles.filterWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterScroll}
          >
            {[
              { label: "Hoje", value: 0 },
              { label: "7 dias", value: 7 },
              { label: "30 dias", value: 30 },
              { label: "Todos", value: null },
            ].map((item) => (
              <TouchableOpacity
                key={String(item.value)}
                style={[styles.filterChip, diasFiltro === item.value && styles.filterChipActive]}
                onPress={() => setDiasFiltro(item.value as any)}
              >
                <Text style={[styles.filterLabel, diasFiltro === item.value && styles.filterLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.loadingText}>A atualizar dados...</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            
            {/* CARTÃO DE DESTAQUE - TOTAL BRUTO */}
            <View style={styles.mainTotalCard}>
              <View>
                <Text style={styles.mainTotalLabel}>Total Bruto Vendido</Text>
                <Text style={styles.mainTotalValue}>{formatCurrency(dados.total_vendido)}</Text>
              </View>
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>{dados.total_pedidos} pedidos</Text>
              </View>
            </View>

            {/* MEIOS DE PAGAMENTO */}
            <Text style={styles.sectionLabel}>Meios de Pagamento</Text>
            <View style={styles.statsGrid}>
              <StatCard titulo="Cartão no App" valor={dados.cartao_app} icon="card-outline" color="#2563eb" />
              <StatCard titulo="Pix" valor={dados.pix} icon="qr-code-outline" color="#16a34a" />
              <StatCard titulo="Dinheiro" valor={dados.dinheiro} icon="cash-outline" color="#ea580c" />
              <StatCard titulo="Maquininha" valor={dados.maquininha} icon="hardware-chip-outline" color="#64748b" />
            </View>

            {/* LISTAGEM DE PEDIDOS */}
            <View style={styles.listHeader}>
              <Text style={styles.sectionLabel}>Histórico de Vendas</Text>
              <Text style={styles.listCount}>{dados.pedidos_lista.length} itens</Text>
            </View>

            {dados.pedidos_lista.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyStateText}>Nenhuma venda registada neste período.</Text>
              </View>
            ) : (
              dados.pedidos_lista.map((p: any) => (
                <View key={p.id} style={styles.pedidoCard}>
                  <View style={styles.pedidoIconBg}>
                    <Ionicons name="bag-check" size={20} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.pedidoId}>Pedido #{p.id}</Text>
                    <Text style={styles.pedidoDate}>{formatarData(p.data_hora)}</Text>
                  </View>
                  <Text style={styles.pedidoPrice}>{formatCurrency(Number(p.valor_total))}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },

  // Filtros
  filterWrapper: { backgroundColor: '#fff', paddingVertical: 12 },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: { 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#f1f5f9', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  filterChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterLabelActive: { color: '#fff' },

  // Loading
  loadingBox: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94a3b8', fontWeight: '500' },

  // Cartão Principal
  mainTotalCard: { 
    backgroundColor: '#1e293b', 
    borderRadius: 24, 
    padding: 24, 
    marginTop: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  mainTotalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  mainTotalValue: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  orderBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  orderBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Estatísticas
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { 
    width: '48%', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statTitle: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginTop: 2 },

  // Listagem
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listCount: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  pedidoCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  pedidoIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  pedidoId: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  pedidoDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  pedidoPrice: { fontSize: 15, fontWeight: '800', color: '#16a34a' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { marginTop: 12, color: '#94a3b8', textAlign: 'center', fontSize: 14 }
});