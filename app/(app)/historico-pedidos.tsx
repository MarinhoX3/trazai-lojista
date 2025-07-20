import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Button, Platform, Alert } from 'react-native'; // NOVO: Adicionado Button, Platform, Alert
import { Stack } from 'expo-router';
import api from '../../src/api/api';
import { useAuthLoja } from '../../src/api/contexts/AuthLojaContext';
// NOVO: Importa o componente de calendário
import DateTimePicker from '@react-native-community/datetimepicker'; 

interface HistoricoItem {
  id: number;
  data_hora: string;
  valor_total: string;
  status: string;
  nome_cliente: string;
}

export default function HistoricoPedidosScreen() {
  const [pedidos, setPedidos] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(false); // Inicia como false
  const { loja } = useAuthLoja();

  // NOVO: Estados para controlar as datas e a visibilidade dos calendários
  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFim, setDataFim] = useState(new Date());
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFim, setShowPickerFim] = useState(false);

  // NOVO: A função de busca agora é acionada pelo botão "Filtrar"
  const buscarHistoricoFiltrado = useCallback(async () => {
    if (!loja?.id) return;
    
    setLoading(true);
    try {
      // Formata as datas para o padrão AAAA-MM-DD
      const inicioFormatado = dataInicio.toISOString().split('T')[0];
      const fimFormatado = dataFim.toISOString().split('T')[0];

      const response = await api.get(`/pedidos/loja/${loja.id}/historico`, {
        params: {
          data_inicio: inicioFormatado,
          data_fim: fimFormatado,
        },
      });
      
      setPedidos(response.data);
      if (response.data.length === 0) {
        Alert.alert("Nenhum resultado", "Nenhum pedido encontrado para o período selecionado.");
      }
    } catch (error) {
      console.error("Erro ao buscar histórico de pedidos:", error);
      Alert.alert("Erro", "Não foi possível buscar o histórico de pedidos.");
    } finally {
      setLoading(false);
    }
  }, [loja?.id, dataInicio, dataFim]); // NOVO: Depende das datas também

  // NOVO: Funções para atualizar as datas quando o usuário seleciona no calendário
  const onChangeDataInicio = (event: any, selectedDate?: Date) => {
    setShowPickerInicio(false); // Esconde o calendário
    if (selectedDate) {
      setDataInicio(selectedDate);
    }
  };

  const onChangeDataFim = (event: any, selectedDate?: Date) => {
    setShowPickerFim(false); // Esconde o calendário
    if (selectedDate) {
      setDataFim(selectedDate);
    }
  };

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
      <Text style={styles.titulo}>Histórico de Pedidos</Text>
      
      {/* NOVO: Seção com os botões de filtro */}
      <View style={styles.filtroContainer}>
        <View style={styles.datePickerButton}>
            <Button onPress={() => setShowPickerInicio(true)} title={`Início: ${dataInicio.toLocaleDateString('pt-BR')}`} />
        </View>
        <View style={styles.datePickerButton}>
            <Button onPress={() => setShowPickerFim(true)} title={`Fim: ${dataFim.toLocaleDateString('pt-BR')}`} />
        </View>
      </View>
      <Button onPress={buscarHistoricoFiltrado} title="Filtrar Pedidos" color="#007BFF" />

      {/* NOVO: Renderização condicional dos calendários */}
      {showPickerInicio && (
        <DateTimePicker value={dataInicio} mode="date" display="default" onChange={onChangeDataInicio} />
      )}
      {showPickerFim && (
        <DateTimePicker value={dataFim} mode="date" display="default" onChange={onChangeDataFim} />
      )}

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
          ListEmptyComponent={<Text style={styles.textoVazio}>Nenhum pedido para exibir. Use o filtro acima.</Text>}
          contentContainerStyle={{ paddingTop: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

// NOVO: Adicionado alguns estilos para os filtros
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
    titulo: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    filtroContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingHorizontal: 15,
    },
    datePickerButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    lista: { width: '100%', paddingHorizontal: 15 },
    pedidoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22 },
    cardCancelado: { backgroundColor: '#fff0f0' },
    clienteNome: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    pedidoDetalhe: { fontSize: 15, color: '#333', marginBottom: 5 },
    statusContainer: { marginTop: 10, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 15, alignSelf: 'flex-start' },
    statusFinalizado: { backgroundColor: '#d4edda' },
    statusCancelado: { backgroundColor: '#f8d7da' },
    pedidoStatus: { fontSize: 14, fontWeight: 'bold' },
    textoVazio: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' }
});