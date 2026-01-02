import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
  SafeAreaView,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import api, { ASSET_BASE_URL } from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Produto {
  id: number;
  nome: string;
  preco: string;
  estoque: string;
  url_foto: string | null;
}

const { width } = Dimensions.get("window");
const ITEM_MARGIN = 10;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function DashboardScreen() {
  const router = useRouter();
  const { loja, updateAuthLoja } = useAuthLoja(); // ✅ Agora pegamos updateAuthLoja
  const insets = useSafeAreaInsets();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState("");
  const [contagemPedidos, setContagemPedidos] = useState(0);
  const [raioEntrega, setRaioEntrega] = useState<number | null>(null);
  const [salvandoRaio, setSalvandoRaio] = useState(false);
  const [mensagemSalva, setMensagemSalva] = useState("");

  // 🔹 Atualiza o raio assim que a loja for carregada
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
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  }, [loja?.id]);

  const fetchContagemPedidos = useCallback(async () => {
    if (!loja?.id) return;
    try {
      const response = await api.get(`/pedidos/loja/${loja.id}/pedidos/count`);
      setContagemPedidos(response.data.count || 0);
    } catch (error) {
      console.error("Erro ao buscar contagem de pedidos:", error);
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

  // ✅ Função para salvar o novo raio de entrega
  const handleSalvarRaio = async () => {
    if (!loja?.id || raioEntrega === null) return;
    try {
      setSalvandoRaio(true);
      await api.put(`/lojas/${loja.id}`, { raio_entrega_km: raioEntrega });
      setMensagemSalva("Raio atualizado com sucesso!");

      // ✅ Atualiza o contexto local da loja
      if (updateAuthLoja) {
        updateAuthLoja({ raio_entrega_km: raioEntrega });
      }

      setTimeout(() => setMensagemSalva(""), 3000);
    } catch (error) {
      console.error("Erro ao salvar raio:", error);
      setMensagemSalva("Erro ao salvar o raio.");
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>A carregar produtos...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Produto }) => {
    const imageUrl = item.url_foto
      ? `${ASSET_BASE_URL}/${item.url_foto}?t=${new Date().getTime()}`
      : "https://placehold.co/400x300/e2e8f0/e2e8f0?text=Sem+Imagem";

    const estoqueNumerico = Number.parseInt(item.estoque, 10);
    const estoqueCor = estoqueNumerico <= 5 ? "red" : "#666";

    return (
      <Pressable
        style={styles.produtoCard}
        onPress={() =>
          router.push({ pathname: "/edit-product", params: { ...item } })
        }
      >
        <Image source={{ uri: imageUrl }} style={styles.produtoCardImagem} />
        <View style={styles.produtoCardInfo}>
          <Text style={styles.produtoCardNome} numberOfLines={1}>
            {item.nome}
          </Text>
          <View style={styles.precoEstoqueContainer}>
            <Text style={styles.produtoCardPreco}>R$ {item.preco}</Text>
            <Text
              style={[styles.produtoCardEstoque, { color: estoqueCor }]}
            >{`Estoque: ${estoqueNumerico} und`}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Painel da Loja</Text>
        <Text style={styles.dashboardSubtitle}>
          Pedidos ativos: {contagemPedidos}
        </Text>
      </View>

      {/* 🧭 Raio de Entrega */}
      <View style={styles.raioContainer}>
        <Text style={styles.raioLabel}>Raio de Entrega (km):</Text>
        <TextInput
          style={styles.raioInput}
          keyboardType="numeric"
          value={raioEntrega?.toString() ?? ""}
          onChangeText={(value) => setRaioEntrega(parseFloat(value) || 0)}
          onBlur={handleSalvarRaio} // ✅ Correção aqui
          editable={!salvandoRaio}
        />
        {salvandoRaio && <ActivityIndicator size="small" color="#FF0000" />}
      </View>

      {mensagemSalva ? (
        <Text
          style={{
            color: mensagemSalva.includes("Erro") ? "red" : "#008000",
            fontSize: 13,
            textAlign: "center",
            marginBottom: 5,
          }}
        >
          {mensagemSalva}
        </Text>
      ) : null}

      <View style={styles.topControls}>
        <TextInput
          style={styles.barraBusca}
          placeholder="Buscar produto..."
          placeholderTextColor="#888"
          value={termoBusca}
          onChangeText={setTermoBusca}
        />
        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={() =>
            router.push({
              pathname: "/create-product",
              params: { lojaId: loja?.id },
            })
          }
        >
          <Text style={styles.botaoTexto}>+ Adicionar Produto</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={produtosFiltrados}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>
            Nenhum produto encontrado. Clique em "Adicionar Produto" para
            começar!
          </Text>
        }
        contentContainerStyle={styles.listaContentContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  dashboardHeader: { alignItems: "center", marginTop: 10 },
  dashboardTitle: { fontSize: 25, fontWeight: "bold", color: "#000000ff" },
  dashboardSubtitle: { fontSize: 15, color: "#000000ff", marginTop: 4 },
  raioContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  raioLabel: { fontSize: 16, color: "#000000ff", marginRight: 10 },
  raioInput: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    width: 70,
    textAlign: "center",
    fontSize: 16,
    color: "#000000ff",
    padding: 5,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#333" },
  topControls: {
    paddingHorizontal: ITEM_MARGIN,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  barraBusca: {
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 25,
    width: "100%",
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#333",
    elevation: 3,
    marginBottom: 10,
  },
  botaoAdicionar: {
    backgroundColor: "#1c9cd7ff",
    paddingVertical: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    elevation: 5,
  },
  botaoTexto: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  listaContentContainer: { paddingBottom: 100, paddingHorizontal: ITEM_MARGIN },
  row: { justifyContent: "space-between", marginBottom: ITEM_MARGIN },
  produtoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: ITEM_WIDTH,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  produtoCardImagem: {
    width: "100%",
    height: ITEM_WIDTH * 0.75,
    resizeMode: "cover",
  },
  produtoCardInfo: { padding: 10 },
  produtoCardNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  precoEstoqueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  produtoCardPreco: { fontSize: 14, color: "#15a232ff", fontWeight: "600" },
  produtoCardEstoque: { fontSize: 12, fontWeight: "bold" },
  emptyListText: { fontSize: 16, color: "#666", textAlign: "center" },
});
