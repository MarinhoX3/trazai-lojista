import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import api from '../src/api/api';
import { Ionicons } from '@expo/vector-icons';

// Interfaces para os detalhes completos do pedido
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
  itens: ItemDoPedido[];
}

const STATUS_FLUXO = ['Recebido', 'Preparando', 'A caminho', 'Finalizado'];

export default function DetalhesPedidoScreen() {
  const router = useRouter();
  const { id_pedido } = useLocalSearchParams<{ id_pedido: string }>();
  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca os detalhes completos do pedido no backend
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

  // Função para ATUALIZAR O STATUS de um pedido
  const handleAtualizarStatus = async (novoStatus: string) => {
    if (!pedido) return;
    try {
        await api.put(`/pedidos/${pedido.id}/status`, { status: novoStatus });
        // Atualiza o status na tela localmente
        setPedido(pedidoAtual => pedidoAtual ? { ...pedidoAtual, status: novoStatus } : null);
        // Se o pedido for finalizado, podemos navegar de volta
        if (novoStatus === 'Finalizado') {
            Alert.alert("Sucesso", "Pedido finalizado!", [{ text: "OK", onPress: () => router.back() }]);
        }
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert('Não foi possível atualizar o status do pedido.');
    }
  };


  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" /></View>;
  }

  if (!pedido) {
    return <View style={styles.loadingContainer}><Text>Pedido não encontrado.</Text></View>;
  }

  const statusAtualIndex = STATUS_FLUXO.indexOf(pedido.status);
  const proximoStatus = STATUS_FLUXO[statusAtualIndex + 1];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Detalhes do Pedido #${pedido.id}` }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Seção de Dados do Cliente */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados do Cliente</Text>
            <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={18} color="#555" />
                <Text style={styles.detailText}>{pedido.nome_cliente}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={18} color="#555" />
                <Text style={styles.detailText}>{pedido.telefone_cliente}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="home-outline" size={18} color="#555" />
                <Text style={styles.detailText}>{pedido.endereco_entrega}</Text>
            </View>
        </View>

        {/* Seção de Itens do Pedido */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itens do Pedido</Text>
            {pedido.itens.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemQty}>{parseInt(String(item.quantidade), 10)}x</Text>
                    <Text style={styles.itemName}>{item.nome_produto}</Text>
                    <Text style={styles.itemPrice}>R$ {parseFloat(item.preco_unitario_congelado).toFixed(2)}</Text>
                </View>
            ))}
        </View>

        {/* Seção do Total */}
        <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total do Pedido:</Text>
            <Text style={styles.totalValue}>R$ {parseFloat(pedido.valor_total).toFixed(2)}</Text>
        </View>

        {/* Seção de Ações */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gerir Pedido</Text>
            <View style={styles.statusContainer}>
                <Text style={styles.pedidoStatus}>Status Atual: {pedido.status}</Text>
            </View>
            {proximoStatus && (
                 <Pressable 
                    style={styles.actionButton} 
                    onPress={() => handleAtualizarStatus(proximoStatus)}>
                    <Text style={styles.actionButtonText}>Mover para "{proximoStatus}"</Text>
                 </Pressable>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20 },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailText: {
        fontSize: 16,
        marginLeft: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemQty: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 0.15,
    },
    itemName: {
        fontSize: 16,
        flex: 0.6,
    },
    itemPrice: {
        fontSize: 16,
        flex: 0.25,
        textAlign: 'right',
    },
    totalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#28a745',
    },
    statusContainer: {
        marginBottom: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#e0eefd',
        borderRadius: 15,
        alignSelf: 'flex-start',
    },
    pedidoStatus: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#005a9c',
    },
    actionButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
