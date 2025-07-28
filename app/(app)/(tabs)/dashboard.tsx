import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable, // Mantido Pressable
  TextInput,
  SafeAreaView,
  Image,
  Dimensions,
  TouchableOpacity, // Adicionado TouchableOpacity para o botão de adicionar
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router'; // Removido Link
import React, { useState, useCallback, useMemo } from 'react';
import api, { ASSET_BASE_URL } from '../../../src/api/api';
import { useAuthLoja } from '../../../src/api/contexts/AuthLojaContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Produto {
  id: number;
  nome: string;
  preco: string;
  estoque: string; // Manter como string para exibição, mas pode ser number no backend
  url_foto: string | null;
}

const { width } = Dimensions.get('window');
const ITEM_MARGIN = 10;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function DashboardScreen() {
  const router = useRouter();
  const { loja } = useAuthLoja();
  const insets = useSafeAreaInsets();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [contagemPedidos, setContagemPedidos] = useState(0);

  const fetchProdutos = useCallback(async () => {
    if (!loja?.id) return;
    try {
      const response = await api.get(`/produtos?id_loja=${loja.id}`);
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
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
      console.error('Erro ao buscar contagem de pedidos:', error);
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

  const produtosFiltrados = useMemo(
    () =>
      produtos.filter((produto) =>
        produto.nome.toLowerCase().includes(termoBusca.toLowerCase())
      ),
    [produtos, termoBusca]
  );

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
      : 'https://placehold.co/400x300/e2e8f0/e2e8f0?text=Sem+Imagem';

    // Determina a cor do estoque
    const estoqueNumerico = parseInt(item.estoque, 10);
    const estoqueCor = estoqueNumerico <= 5 ? 'red' : '#666'; // Vermelho se <= 5, cinza caso contrário

    return (
      <Pressable
        style={styles.produtoCard}
        onPress={() => router.push({ pathname: '/edit-product', params: { ...item } })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.produtoCardImagem}
          onError={(e) =>
            console.log(
              `Erro ao carregar a imagem ${item.nome}:`,
              e.nativeEvent.error
            )
          }
        />
        <View style={styles.produtoCardInfo}>
          <Text style={styles.produtoCardNome} numberOfLines={1}>{item.nome}</Text>
          <View style={styles.precoEstoqueContainer}>
            <Text style={styles.produtoCardPreco}>R$ {item.preco}</Text>
            <Text style={[styles.produtoCardEstoque, { color: estoqueCor }]}>
              Estoque: {estoqueNumerico} und
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Barra de Busca e Botão Adicionar Produto */}
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
          onPress={() => router.push({ pathname: '/create-product', params: { lojaId: loja?.id } })}
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
        // CORREÇÃO: ListEmptyComponent simplificado para um Text direto
        ListEmptyComponent={<Text style={styles.emptyListText}>Nenhum produto encontrado. Clique em "Adicionar Produto" para começar!</Text>}
        contentContainerStyle={styles.listaContentContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  topControls: {
    paddingHorizontal: ITEM_MARGIN,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: -20,
  },
  barraBusca: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: '100%',
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  botaoAdicionar: {
    backgroundColor: '#FF0000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  listaContentContainer: {
    paddingBottom: 100,
    paddingHorizontal: ITEM_MARGIN,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: ITEM_MARGIN,
  },
  produtoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: ITEM_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  produtoCardImagem: {
    width: '100%',
    height: ITEM_WIDTH * 0.75,
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  produtoCardInfo: {
    padding: 10,
  },
  produtoCardNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  precoEstoqueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  produtoCardPreco: {
    fontSize: 15,
    color: '#FF0000',
    fontWeight: '600',
  },
  produtoCardEstoque: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyListContainer: { // Este estilo agora é redundante para ListEmptyComponent, mas pode ser mantido para referência
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
