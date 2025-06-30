import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import api from '../src/api/api';
import { useAuthLoja } from '../src/api/contexts/AuthLojaContext';

interface HistoricoItem {
  id: number;
  data_hora: string;
  valor_total: string;
  status: string;
  nome_cliente: string;
}

export default function HistoricoPedidosScreen() {
  const [pedidos, setPedidos] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { loja } = useAuthLoja();

  const buscarHistorico = useCallback(async () => {
    if (!loja?.id) {
        setLoading(false);
        return;
    }
    try {
      setLoading(true);
      const response = await api.get(`/pedidos/loja/${loja.id}/historico`);
      setPedidos(response.data);
    } catch (error) {
      console.error("Erro ao buscar histórico de pedidos:", error);
    } finally {
      setLoading(false);
    }
  }, [loja?.id]);

  useFocusEffect(useCallback(() => { buscarHistorico(); }, [buscarHistorico]));

  const renderItem = ({ item }: { item: HistoricoItem }) => (
    <View style={[styles.pedidoCard, item.status === 'Cancelado' && styles.cardCancelado]}>
      <Text style={styles.clienteNome}>Pedido de: {item.nome_cliente}</Text>
      <Text style={styles.pedidoDetalhe}>Data: {new Date(item.data_hora).toLocaleString('pt-BR')}</Text>
      <Text style={styles.pedidoDetalhe}>Total: R$ {parseFloat(item.valor_total).toFixed(2)}</Text>
      <View style={[styles.statusContainer, item.status === 'Cancelado' ? styles.statusCancelado : styles.statusFinalizado]}>
        <Text style={styles.pedidoStatus}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Histórico de Pedidos' }} />
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
          ListHeaderComponent={<Text style={styles.titulo}>Histórico de Pedidos</Text>}
          ListEmptyComponent={<Text style={styles.textoVazio}>Nenhum pedido no histórico.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    titulo: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    lista: { width: '100%', paddingHorizontal: 15 },
    pedidoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 15, elevation: 2 },
    cardCancelado: { backgroundColor: '#fff0f0' },
    clienteNome: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    pedidoDetalhe: { fontSize: 15, color: '#333', marginBottom: 5 },
    statusContainer: { marginTop: 10, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, alignSelf: 'flex-start' },
    statusFinalizado: { backgroundColor: '#d4edda' },
    statusCancelado: { backgroundColor: '#f8d7da' },
    pedidoStatus: { fontSize: 14, fontWeight: 'bold' },
    textoVazio: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' }
});
