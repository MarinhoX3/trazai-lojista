import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import api from '../src/api/api';
import { useAuthLoja } from '../src/api/contexts/AuthLojaContext';
import { Ionicons } from '@expo/vector-icons';

// Interface para definir o formato de um Pedido com todos os detalhes
interface Pedido {
  id: number;
  data_hora: string;
  valor_total: string;
  status: string;
  nome_cliente: string;
  endereco_entrega: string;
  telefone_cliente: string;
}

// Lista de status possíveis para os botões.
const STATUS_FLUXO = ['Recebido', 'Preparando', 'A caminho', 'Finalizado'];

export default function PedidosLojaScreen() {
  const router = useRouter(); // Hook de navegação
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const { loja } = useAuthLoja();

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
      console.error("Erro ao buscar pedidos da loja:", error);
    } finally {
      setLoading(false);
    }
  }, [loja?.id]);

  useFocusEffect(
    useCallback(() => {
      buscarPedidos();
    }, [buscarPedidos])
  );

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
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert('Não foi possível atualizar o status do pedido.');
    }
  };

  const renderItem = ({ item }: { item: Pedido }) => {
    const statusAtualIndex = STATUS_FLUXO.indexOf(item.status);
    const proximoStatus = STATUS_FLUXO[statusAtualIndex + 1];

    return (
        <View style={styles.pedidoCard}>
            <Text style={styles.clienteNome}>Pedido de: {item.nome_cliente}</Text>
            <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#555" />
                <Text style={styles.pedidoDetalhe}>Data: {new Date(item.data_hora).toLocaleString('pt-BR')}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color="#555" />
                <Text style={styles.pedidoDetalhe}>Telefone: {item.telefone_cliente}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="home-outline" size={16} color="#555" />
                <Text style={styles.pedidoDetalhe}>Endereço: {item.endereco_entrega}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#555" />
                <Text style={styles.pedidoDetalhe}>Total: R$ {parseFloat(item.valor_total).toFixed(2)}</Text>
            </View>
            <View style={styles.statusContainer}>
                <Text style={styles.pedidoStatus}>Status Atual: {item.status}</Text>
            </View>
            
            <View style={styles.actionsContainer}>
                {proximoStatus && (
                     <Pressable 
                        style={styles.actionButton} 
                        onPress={() => handleAtualizarStatus(item.id, proximoStatus)}>
                        <Text style={styles.actionButtonText}>Mover para "{proximoStatus}"</Text>
                     </Pressable>
                )}
                {/* Botão de Impressão */}
                <Pressable 
                    style={[styles.actionButton, styles.printButton]} 
                    // CORREÇÃO: Usamos 'as any' para contornar o erro de tipo e convertemos o ID para string.
                    onPress={() => router.push({ pathname: '/imprimir-pedido' as any, params: { id_pedido: item.id.toString() } })}>
                    <Ionicons name="print-outline" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Imprimir Cupom</Text>
                </Pressable>
            </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
            title: 'Pedidos Ativos',
            headerRight: () => (
                <Pressable onPress={() => router.push('/historico-pedidos')} style={{ marginRight: 15 }}>
                    <Ionicons name="archive-outline" size={24} color="#007BFF" />
                </Pressable>
            )
        }} 
      />
      {loading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.lista}
          ListHeaderComponent={<Text style={styles.titulo}>Gerir Pedidos Ativos</Text>}
          ListEmptyComponent={<Text style={styles.textoVazio}>Nenhum pedido ativo no momento.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titulo: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    lista: {
        width: '100%',
        paddingHorizontal: 15,
    },
    pedidoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    clienteNome: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    pedidoDetalhe: {
        fontSize: 15,
        color: '#333',
        marginLeft: 8,
        flexShrink: 1
    },
    statusContainer: {
        marginTop: 10,
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
    actionsContainer: {
        marginTop: 15,
        flexDirection: 'column',
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    printButton: {
        backgroundColor: '#6c757d',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    textoVazio: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: 'gray',
    }
});
