import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import api from '../../src/api/api';
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
  nome_loja: string;
  forma_pagamento: string; // Campo para a forma de pagamento
  itens: ItemDoPedido[];
}

export default function ImprimirPedidoScreen() {
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

  // Função para gerar o HTML do cupom
  const gerarHtmlDoCupom = () => {
    if (!pedido) return '';

    const itensHtml = pedido.itens.map(item => `
      <tr>
        <td>${parseInt(String(item.quantidade), 10)} und</td>
        <td>${item.nome_produto}</td>
        <td style="text-align: right;">R$ ${parseFloat(item.preco_unitario_congelado).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
            .container { padding: 20px; text-align: center; }
            h1 { font-size: 24px; margin: 0; }
            h2 { font-size: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-top: 20px; }
            p { margin: 5px 0; font-size: 14px; }
            table { width: 100%; margin-top: 20px; border-collapse: collapse; }
            th, td { padding: 8px 0; text-align: left; font-size: 14px; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${pedido.nome_loja}</h1>
            <p>Pedido #${pedido.id}</p>
            <p>${new Date(pedido.data_hora).toLocaleString('pt-BR')}</p>
            
            <h2>Dados do Cliente</h2>
            <p><b>Nome:</b> ${pedido.nome_cliente}</p>
            <p><b>Telefone:</b> ${pedido.telefone_cliente}</p>
            <p><b>Endereço:</b> ${pedido.endereco_entrega}</p>
            <p><b>Forma de Pagamento:</b> ${pedido.forma_pagamento}</p>
            
            <h2>Itens do Pedido</h2>
            <table>
              ${itensHtml}
            </table>
            
            <p class="total">Total: R$ ${parseFloat(pedido.valor_total).toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleImprimir = async () => {
    const htmlContent = gerarHtmlDoCupom();
    if (!htmlContent) {
      Alert.alert("Erro", "Não há dados para imprimir.");
      return;
    }
    try {
      await Print.printAsync({
        html: htmlContent,
      });
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      Alert.alert("Erro", "Não foi possível abrir a tela de impressão.");
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" /></View>;
  }

  if (!pedido) {
    return <View style={styles.loadingContainer}><Text>Pedido não encontrado.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Cupom Pedido #${pedido.id}` }} />
      <ScrollView>
        <View style={styles.cupomContainer}>
            <Text style={styles.cupomTitle}>{pedido.nome_loja}</Text>
            <Text style={styles.cupomSubtitle}>Pedido #{pedido.id} - {new Date(pedido.data_hora).toLocaleTimeString('pt-BR')}</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cliente</Text>
                {/* CORREÇÃO: Padronizado para "Rótulo em negrito: Valor" */}
                <Text><Text style={{fontWeight: 'bold'}}>Nome:</Text> {pedido.nome_cliente}</Text>
                <Text><Text style={{fontWeight: 'bold'}}>Telefone:</Text> {pedido.telefone_cliente}</Text>
                <Text><Text style={{fontWeight: 'bold'}}>Endereço:</Text> {pedido.endereco_entrega}</Text>
                <Text><Text style={{fontWeight: 'bold'}}>Forma de Pagamento:</Text> {pedido.forma_pagamento}</Text> 
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Itens</Text>
                {pedido.itens.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemQty}>{parseInt(String(item.quantidade), 10)} und</Text>
                        <Text style={styles.itemName}>{item.nome_produto}</Text>
                        <Text style={styles.itemPrice}>R$ {parseFloat(item.preco_unitario_congelado).toFixed(2)}</Text>
                    </View>
                ))}
            </View>
            
            <Text style={styles.totalText}>Total: R$ {parseFloat(pedido.valor_total).toFixed(2)}</Text>

            <Pressable style={styles.printButton} onPress={handleImprimir}>
                <Ionicons name="print" size={24} color="#fff" />
                <Text style={styles.printButtonText}>Imprimir Cupom</Text>
            </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cupomContainer: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 8 },
    cupomTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
    cupomSubtitle: { fontSize: 14, color: 'gray', textAlign: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' },
    itemQty: { flex: 0.2, fontWeight: 'bold' },
    itemName: { flex: 0.5 },
    itemPrice: { flex: 0.3, textAlign: 'right' },
    totalText: { fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
    printButton: { 
        flexDirection: 'row', 
        gap: 10, 
        backgroundColor: '#007BFF', 
        padding: 15, 
        marginTop: 30, 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    printButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
