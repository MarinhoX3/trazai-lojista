import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, TextInput, SafeAreaView, Image } from 'react-native';
import { useFocusEffect, useRouter, Link } from 'expo-router';
import React, { useState, useCallback, useMemo } from 'react';
import api, { ASSET_BASE_URL } from '../src/api/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuthLoja } from '../src/api/contexts/AuthLojaContext';

interface Produto {
  id: number;
  nome: string;
  preco: string;
  estoque: string;
  url_foto: string | null;
}

export default function DashboardScreen() {
  const router = useRouter(); 
  const { loja } = useAuthLoja();

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
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  }, [loja?.id]);

  const fetchContagemPedidos = useCallback(async () => {
    if (!loja?.id) return;
    try {
        const response = await api.get(`/pedidos/loja/${loja.id}/pedidos/count`);
        setContagemPedidos(response.data.count);
    } catch (error) {
        console.error("Erro ao buscar contagem de pedidos:", error);
    }
  }, [loja?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([fetchProdutos(), fetchContagemPedidos()]).finally(() => setLoading(false));
    }, [fetchProdutos, fetchContagemPedidos])
  );

  const produtosFiltrados = useMemo(() => 
    produtos.filter(produto => 
      produto.nome.toLowerCase().includes(termoBusca.toLowerCase())
    ), 
    [produtos, termoBusca]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>A carregar...</Text>
      </View>
    );
  }
  
  const renderItem = ({ item }: { item: Produto }) => {
    const imageUrl = item.url_foto
      ? `${ASSET_BASE_URL}/${item.url_foto}?t=${new Date().getTime()}`
      : 'https://placehold.co/80x80/e2e8f0/e2e8f0?text=Produto';

    return (
      <Link href={{ pathname: "/edit-product", params: { ...item } }} asChild>
        <Pressable>
          <View style={styles.produtoContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.produtoImagem}
              onError={(e) => console.log(`Erro ao carregar a imagem ${item.nome}:`, e.nativeEvent.error)}
            />
            <View style={styles.produtoInfo}>
              <Text style={styles.produtoNome}>{item.nome}</Text>
              <Text>Preço: R$ {item.preco}</Text>
              <Text>Estoque: {parseInt(item.estoque)} und</Text>
            </View>
          </View>
        </Pressable>
      </Link>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, width: '100%' }}>
        <Text style={styles.titulo}>Painel da Loja</Text>
        
        <View style={styles.actionsContainer}>
          <Link href={{ pathname: "/create-product", params: { lojaId: loja?.id } }} asChild>
            <Pressable style={styles.botaoAdicionar}>
              <Text style={styles.botaoTexto}>Adicionar Novo Produto</Text>
            </Pressable>
          </Link>
        </View>

        <TextInput
          style={styles.barraBusca}
          placeholder="Buscar produto pelo nome..."
          placeholderTextColor="#888"
          value={termoBusca}
          onChangeText={setTermoBusca}
        />
        
        <FlatList
          data={produtosFiltrados}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text>Nenhum produto encontrado.</Text>}
          style={styles.lista}
          contentContainerStyle={styles.listaContentContainer}
        />
      </View>

      {/* --- BARRA DE NAVEGAÇÃO ATUALIZADA --- */}
      <View style={styles.footerNav}>
        <Pressable style={styles.footerButton}>
            <Ionicons name="home" size={24} color="#007BFF" />
            <Text style={[styles.footerButtonText, { color: '#007BFF'}]}>Início</Text>
        </Pressable>
        <Pressable style={styles.footerButton} onPress={() => router.push('/pedidos-loja')}>
            <Ionicons name="receipt-outline" size={24} color="#555" />
            <Text style={styles.footerButtonText}>Pedidos</Text>
            {contagemPedidos > 0 && (
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{contagemPedidos}</Text>
                </View>
            )}
        </Pressable>
        {/* --- NOVO BOTÃO ADICIONADO --- */}
        <Pressable style={styles.footerButton} onPress={() => router.push('/financeiro' as any)}>
            <Ionicons name="wallet-outline" size={24} color="#555" />
            <Text style={styles.footerButtonText}>Financeiro</Text>
        </Pressable>
        <Pressable style={styles.footerButton} onPress={() => router.push('/edit-loja')}>
            <Ionicons name="person-circle-outline" size={24} color="#555" />
            <Text style={styles.footerButtonText}>Meu Perfil</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40, 
    marginBottom: 20,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  botaoAdicionar: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  barraBusca: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    width: '90%',
    alignSelf: 'center',
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  lista: {
    width: '100%',
    paddingHorizontal: 20,
  },
  listaContentContainer: {
    paddingBottom: 60,
  },
  produtoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  produtoImagem: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 15,
    backgroundColor: '#e0e0e0',
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 45,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  footerButton: {
    alignItems: 'center',
    flex: 1,
  },
  footerButtonText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: 20,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f8f8f8'
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
