// app/pedidos-loja.tsx

import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, 
  ActivityIndicator, Pressable, Alert, Linking 
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import api from '../../../src/api/api';
import { useAuthLoja } from '../../../src/api/contexts/AuthLojaContext';
import { Ionicons } from '@expo/vector-icons';
import { usePedidosAtivos } from '../../../src/api/contexts/PedidosAtivosContext';

// Interface do Pedido
interface Pedido {
  id: number;
  data_hora: string;
  valor_total: string;
  status: string;
  nome_cliente: string;
  endereco_entrega: string;
  telefone_cliente: string;
  whatsapp_cliente?: string;

  tipo_entrega: string;        // 👈 novo
  metodo_pagamento: string;    // 👈 novo
}


const STATUS_FLUXO = ['Recebido', 'Preparando', 'A caminho', 'Finalizado'];

export default function PedidosLojaScreen() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const { loja } = useAuthLoja();
  const { fetchPedidosPendentesCount } = usePedidosAtivos();

 const buscarPedidos = useCallback(async () => {
  if (!loja?.id) {
    setLoading(false);
    return;
  }
  try {
    setLoading(true);
    const response = await api.get(`/pedidos/loja/${loja.id}`);
    
    // ADICIONE ESTE LOG AQUI:
    console.log("CONTEUDO DA API PEDIDOS:", JSON.stringify(response.data, null, 2));

    setPedidos(response.data);
  } catch (error) {
    console.error("Erro ao buscar pedidos da loja:", error);
    Alert.alert("Erro", "Não foi possível carregar os pedidos.");
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

      Alert.alert('Sucesso', `Status atualizado para "${novoStatus}"!`);
      fetchPedidosPendentesCount();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  // FUNÇÃO DE WHATSAPP
  const conversarWhatsApp = (item: Pedido) => {
  const numeroWhatsapp = item.whatsapp_cliente?.replace(/\D/g, "");

  if (!numeroWhatsapp) {
    Alert.alert("Atenção", "Este cliente não cadastrou WhatsApp.");
    return;
  }

  const msg = `Olá ${item.nome_cliente}! Estou falando sobre o pedido #${item.id}.`;

  const url = `https://wa.me/55${numeroWhatsapp}?text=${encodeURIComponent(msg)}`;

  Linking.openURL(url).catch(() =>
    Alert.alert("Erro", "Não foi possível abrir o WhatsApp.")
  );
};

const renderItem = ({ item }: { item: Pedido }) => {

  const textoPagamento = (() => {
    switch (item.metodo_pagamento) {
      case "Pix":
        return "Pix";
      case "Cartão de Crédito":
        return "Cartão";
      case "Pagamento na Entrega":
        return "Dinheiro na entrega";
      default:
        return item.metodo_pagamento || "Não informado";
    }
  })();

  const statusAtualIndex = STATUS_FLUXO.indexOf(item.status);
  const proximoStatus = STATUS_FLUXO[statusAtualIndex + 1];

  return (
    <View style={styles.pedidoCard}>
      <Text style={styles.clienteNome}>Pedido de: {item.nome_cliente}</Text>

      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={16} color="#555" />
        <Text style={styles.pedidoDetalhe}>
          Data: {new Date(item.data_hora).toLocaleString("pt-BR")}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="bicycle-outline" size={16} color="#555" />
        <Text style={styles.pedidoDetalhe}>
          Entrega: {item.tipo_entrega === "pickup" ? "Retirada na loja" : "Entrega"}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="card-outline" size={16} color="#555" />
        <Text style={styles.pedidoDetalhe}>
          Pagamento: 
  {item.status === "Aguardando Pagamento"
    ? `${textoPagamento} (aguardando pagamento)`
    : textoPagamento}

        </Text>
      </View>

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#555" />
          <Text style={styles.pedidoDetalhe}>
           WhatsApp: {item.whatsapp_cliente || "Não informado"}
        </Text>

        </View>

        <View style={styles.detailRow}>
          <Ionicons name="home-outline" size={16} color="#555" />
          <Text style={styles.pedidoDetalhe}>Endereço: {item.endereco_entrega}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#555" />
          <Text style={styles.pedidoDetalhe}>
            Total: R$ {parseFloat(item.valor_total).toFixed(2)}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.pedidoStatus}>Status Atual: {item.status}</Text>
        </View>

        {/* BOTÕES PRINCIPAIS */}
        <View style={styles.actionsContainer}>
          {proximoStatus && (
            <Pressable
              style={styles.actionButton}
              onPress={() => handleAtualizarStatus(item.id, proximoStatus)}
            >
              <Text style={styles.actionButtonText}>
                Mover para "{proximoStatus}"
              </Text>
            </Pressable>
          )}

          {item.status !== "Finalizado" && item.status !== "Cancelado" && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: "#dc3545" }]}
              onPress={() =>
                router.push({
                  pathname: "/detalhes-pedido",
                  params: { id_pedido: item.id.toString(), cancelar: "1" },
                })
              }
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Cancelar Pedido</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.actionButton, styles.printButton]}
            onPress={() =>
              router.push({
                pathname: "/imprimir-pedido",
                params: { id_pedido: item.id.toString() },
              })
            }
          >
            <Ionicons name="print-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Imprimir Cupom</Text>
          </Pressable>
        </View>

        {/* SEPARADOR */}
        <View style={styles.separator} />

        {/* BOTÃO DE WHATSAPP SEPARADO */}
        <Pressable
          style={[styles.whatsappButton]}
          onPress={() => conversarWhatsApp(item)}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.whatsappText}>Conversar com Cliente</Text>
        </Pressable>
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
          ),
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
  contentContainerStyle={{ paddingBottom: 20 }}
  // Adicione isso para quando a lista estiver vazia:
  ListEmptyComponent={
    <View style={{ marginTop: 50, alignItems: 'center', paddingHorizontal: 20 }}>
      <Ionicons name="cart-outline" size={64} color="#ccc" />
      <Text style={{ color: '#666', fontSize: 16, marginTop: 10, textAlign: 'center' }}>
        Nenhum pedido ativo no momento.
      </Text>
      
      {/* BOTÃO PARA IR AO HISTÓRICO */}
      <Pressable 
        style={[styles.actionButton, { marginTop: 20, width: '100%', backgroundColor: '#007BFF' }]}
        onPress={() => router.push('/historico-pedidos')}
      >
        <Ionicons name="time-outline" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Ver Histórico de Pedidos</Text>
      </Pressable>
    </View>
  }
/>
      )}
    </SafeAreaView>
  );
}

// STYLESHEET COMPLETO E CORRIGIDO
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
    flexShrink: 1,
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
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  printButton: {
    backgroundColor: '#6c757d',
  },

  // SEPARADOR
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 12,
  },

  // BOTÃO WHATSAPP
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#25D366",
  },
  whatsappText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
});
