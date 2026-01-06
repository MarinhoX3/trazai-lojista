"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importações de API e Contexto
import api, { ASSET_BASE_URL } from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";

interface Produto {
  id: number;
  nome: string;
  preco: string;
  estoque: string;
  url_foto: string | null;
}

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const CARD_MARGIN = 8;
const CONTAINER_PADDING = 16;
// Cálculo preciso para 3 colunas considerando as margens laterais e entre os cards
const CARD_WIDTH = (width - (CONTAINER_PADDING * 2) - (CARD_MARGIN * (NUM_COLUMNS - 1) * 2)) / NUM_COLUMNS;

export default function DashboardScreen() {
  const router = useRouter();
  const { loja, updateAuthLoja } = useAuthLoja();
  const insets = useSafeAreaInsets();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [contagemPedidos, setContagemPedidos] = useState(0);
  const [raioEntrega, setRaioEntrega] = useState<number | null>(null);
  const [salvandoRaio, setSalvandoRaio] = useState(false);
  const [mensagemSalva, setMensagemSalva] = useState("");

  useEffect(() => {
    if (loja && loja.raio_entrega_km != null) {
      setRaioEntrega(loja.raio_entrega_km);
    }
  }, [loja]);

  const fetchProdutos = useCallback(async () => {
    if (!loja?.id) return;
    try {
      const response = await api.get(`/produtos?id_loja=${loja.id}`);
      setProdutos(response.data);
    } catch (error) {
      console.error("Erro ao procurar produtos:", error);
    }
  }, [loja?.id]);

  const fetchContagemPedidos = useCallback(async () => {
    if (!loja?.id) return;
    try {
      const response = await api.get(`/pedidos/loja/${loja.id}/pedidos/count`);
      setContagemPedidos(response.data.count || 0);
    } catch (error) {
      console.error("Erro ao procurar contagem de pedidos:", error);
      setContagemPedidos(0);
    }
  }, [loja?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([fetchProdutos(), fetchContagemPedidos()]).finally(() =>
        setLoading(false)
      );
    }, [fetchProdutos, fetchContagemPedidos])
  );

  const handleSalvarRaio = async () => {
    if (!loja?.id || raioEntrega === null) return;
    try {
      setSalvandoRaio(true);
      await api.put(`/lojas/${loja.id}`, { raio_entrega_km: raioEntrega });
      setMensagemSalva("Atualizado!");

      if (updateAuthLoja) {
        updateAuthLoja({ raio_entrega_km: raioEntrega });
      }

      setTimeout(() => setMensagemSalva(""), 3000);
    } catch (error) {
      console.error("Erro ao guardar o raio:", error);
      setMensagemSalva("Erro!");
    } finally {
      setSalvandoRaio(false);
    }
  };

  const produtosFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return produtos;
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(termoBusca.toLowerCase())
    );
  }, [produtos, termoBusca]);

  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Sincronizando dados...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Produto }) => {
    const imageUrl = item.url_foto
      ? `${ASSET_BASE_URL}/${item.url_foto}?t=${new Date().getTime()}`
      : "https://placehold.co/200x200/f1f5f9/94a3b8?text=Sem+Foto";

    const estoqueNumerico = parseInt(item.estoque, 10);
    const lowStock = estoqueNumerico <= 5;

    return (
      <Pressable
        style={styles.produtoCard}
        onPress={() => router.push({ pathname: "/edit-product", params: { ...item } })}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.produtoImagem} />
          {lowStock && <View style={styles.dotLowStock} />}
        </View>
        
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoNome} numberOfLines={1}>{item.nome}</Text>
          <Text style={styles.produtoPreco}>R$ {item.preco}</Text>
          <Text style={[styles.estoqueText, lowStock && styles.lowStockText]}>
            {estoqueNumerico} un.
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER PREMIUM */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.welcomeText}>Gestão de Negócio</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {loja?.nome_loja || "Dashboard"}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push("/edit-loja")}>
          <Ionicons name="options-outline" size={22} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={produtosFiltrados}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {/* KPI CARDS ROW */}
            <View style={styles.kpiRow}>
              <View style={styles.statsCard}>
                <View style={styles.statsIconBg}>
                  <Ionicons name="cart" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.statsLabel}>Pedidos</Text>
                  <Text style={styles.statsValue}>{contagemPedidos}</Text>
                </View>
              </View>

              {/* QUICK RADIUS SETTING */}
              <View style={styles.radiusMiniCard}>
                <View style={styles.radiusHeader}>
                  <Text style={styles.radiusLabel}>Raio Entrega</Text>
                  {salvandoRaio && <ActivityIndicator size="small" color="#1E3A8A" />}
                </View>
                <View style={styles.radiusInputRow}>
                  <TextInput
                    style={styles.raioInput}
                    keyboardType="numeric"
                    value={raioEntrega?.toString() ?? ""}
                    onChangeText={(value) => setRaioEntrega(parseFloat(value) || 0)}
                    onBlur={handleSalvarRaio}
                    editable={!salvandoRaio}
                  />
                  <Text style={styles.kmLabel}>KM</Text>
                </View>
              </View>
            </View>

            {/* SEARCH & ADD ROW */}
            <View style={styles.searchSection}>
              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar no estoque..."
                  placeholderTextColor="#94a3b8"
                  value={termoBusca}
                  onChangeText={setTermoBusca}
                />
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push({ pathname: "/create-product", params: { lojaId: loja?.id } })}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Produtos ({produtosFiltrados.length})</Text>
          </View>
        }
        columnWrapperStyle={styles.columnRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#e2e8f0" />
            <Text style={styles.emptyText}>Nenhum item disponível.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  containerCentered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '500' },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: CONTAINER_PADDING, 
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  welcomeText: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E3A8A' },
  profileBtn: { width: 44, height: 44, backgroundColor: '#F1F5F9', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Content
  listContent: { paddingBottom: 40 },
  headerContent: { paddingHorizontal: CONTAINER_PADDING, paddingTop: 10 },
  columnRow: { justifyContent: 'flex-start', paddingHorizontal: CONTAINER_PADDING - CARD_MARGIN },

  // KPI & Radius Row
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statsCard: { 
    flex: 1.2,
    backgroundColor: '#1E3A8A', 
    borderRadius: 18, 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  statsIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  statsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statsValue: { color: '#fff', fontSize: 20, fontWeight: '900' },

  radiusMiniCard: { 
    flex: 1,
    backgroundColor: '#F8FAF6', 
    borderRadius: 18, 
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  radiusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  radiusLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  radiusInputRow: { flexDirection: 'row', alignItems: 'baseline' },
  raioInput: { fontSize: 20, fontWeight: '900', color: '#1E3A8A', marginRight: 4, minWidth: 30 },
  kmLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },

  // Search & Add
  searchSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  searchWrapper: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 15, 
    paddingHorizontal: 15, 
    height: 48,
    marginRight: 10
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '500', color: '#1E3A8A' },
  addButton: { width: 48, height: 48, backgroundColor: '#1E3A8A', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#000000ff', marginBottom: 15 },

  // 3 Column Grid Cards
  produtoCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    width: CARD_WIDTH, 
    margin: CARD_MARGIN,
    marginBottom: 16,
    // Sombra suave estilo Apple/Premium
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden'
  },
  imageContainer: { width: '100%', height: CARD_WIDTH, position: 'relative', backgroundColor: '#F8FAF6' },
  produtoImagem: { width: '100%', height: '100%', resizeMode: 'cover' },
  dotLowStock: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  
  produtoInfo: { padding: 8 },
  produtoNome: { fontSize: 11, fontWeight: '700', color: '#000000ff', marginBottom: 2 },
  produtoPreco: { fontSize: 13, fontWeight: '900', color: '#04b71cff', marginBottom: 4 },
  estoqueText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  lowStockText: { color: '#EF4444' },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#94a3b8', fontSize: 13, fontWeight: '500' }
});