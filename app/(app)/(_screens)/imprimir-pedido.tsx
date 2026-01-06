"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  StatusBar,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importação da API (Ajuste o caminho conforme o seu projeto local)
import api from "../../../src/api/api";

type PedidoItem = {
  nome_produto: string;
  quantidade: number | string;
  preco_unitario_congelado: number | string;
};

type PedidoDetalhes = {
  id: number | string;
  nome_loja: string;
  data_hora: string;
  nome_cliente: string;
  telefone_cliente: string;
  endereco_entrega: string;
  forma_pagamento: string;
  itens: PedidoItem[];
  valor_total: number | string;
};

export default function App() {
  const { id_pedido } = useLocalSearchParams<{ id_pedido: string }>();
  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/pedidos/${id_pedido}/detalhes`);
        setPedido(response.data);
      } catch (error) {
        console.error("Erro ao procurar pedido:", error);
        Alert.alert("Erro", "Não foi possível carregar os dados para impressão.");
      } finally {
        setLoading(false);
      }
    };

    if (id_pedido) fetchPedido();
  }, [id_pedido]);

  const formatCurrency = (val: number | string) => {
    return `R$ ${Number.parseFloat(String(val)).toFixed(2).replace(".", ",")}`;
  };

  const gerarTextoDoCupom = () => {
    if (!pedido) return "";
    const itensTexto = pedido.itens
      .map(
        (item) =>
          `${Number.parseInt(String(item.quantidade), 10)}x ${item.nome_produto} - ${formatCurrency(item.preco_unitario_congelado)}`
      )
      .join("\n");

    return `
--- ${pedido.nome_loja.toUpperCase()} ---
Pedido #${pedido.id}
Data: ${new Date(pedido.data_hora).toLocaleString("pt-BR")}

CLIENTE: ${pedido.nome_cliente}
CONTATO: ${pedido.telefone_cliente}
ENDEREÇO: ${pedido.endereco_entrega}
PAGAMENTO: ${pedido.forma_pagamento}

ITENS:
${itensTexto}

TOTAL: ${formatCurrency(pedido.valor_total)}
--------------------------
Gerado por TrazAí Lojista
    `.trim();
  };

  const handleImprimir = async () => {
    if (!pedido) return;

    const itensHtml = pedido.itens
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px dashed #eee;">
            <span style="font-weight: bold;">${item.quantidade}x</span> ${item.nome_produto}
          </td>
          <td style="padding: 8px 0; border-bottom: 1px dashed #eee; text-align: right;">
            ${formatCurrency(item.preco_unitario_congelado)}
          </td>
        </tr>
      `
      )
      .join("");

    const html = `
      <html>
        <body style="font-family: 'Courier New', Courier, monospace; padding: 20px; color: #333;">
          <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 10px;">
            <h1 style="margin: 0; font-size: 22px;">${pedido.nome_loja}</h1>
            <p style="margin: 5px 0;">PEDIDO #${pedido.id}</p>
          </div>
          <p style="font-size: 12px; text-align: center;">${new Date(pedido.data_hora).toLocaleString("pt-BR")}</p>
          
          <div style="margin: 20px 0; font-size: 14px;">
            <p><strong>CLIENTE:</strong> ${pedido.nome_cliente}</p>
            <p><strong>ENDEREÇO:</strong> ${pedido.endereco_entrega}</p>
            <p><strong>PAGAMENTO:</strong> ${pedido.forma_pagamento}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 1px solid #333;">
                <th style="text-align: left; padding-bottom: 5px;">Item</th>
                <th style="text-align: right; padding-bottom: 5px;">Preço</th>
              </tr>
            </thead>
            <tbody>${itensHtml}</tbody>
          </table>

          <div style="margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px;">
            TOTAL: ${formatCurrency(pedido.valor_total)}
          </div>
          
          <p style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
            Obrigado pela preferência!<br/>TrazAí Plataforma de Entregas
          </p>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível processar a impressão.");
    }
  };

  const handleCompartilhar = async () => {
    const text = gerarTextoDoCupom();
    if (!text) return;
    try {
      await Share.share({ message: text, title: `Pedido #${pedido?.id}` });
    } catch (error) {
      Alert.alert("Erro", "Falha ao partilhar.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>A gerar cupom...</Text>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="alert-circle-outline" size={60} color="#94a3b8" />
        <Text style={styles.errorText}>Pedido não encontrado.</Text>
        <TouchableOpacity style={styles.backBtnEmpty} onPress={() => router.back()}>
          <Text style={styles.backBtnEmptyText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER PERSONALIZADO */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Impressão de Cupom</Text>
        <TouchableOpacity onPress={handleCompartilhar} style={styles.headerBtn}>
          <Ionicons name="share-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* RECIBO VISUAL */}
        <View style={styles.receiptContainer}>
          <View style={styles.receiptHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="receipt" size={30} color="#2563eb" />
            </View>
            <Text style={styles.storeName}>{pedido.nome_loja}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>PEDIDO #{pedido.id}</Text>
            </View>
          </View>

          <View style={styles.dashedLine} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Dados da Entrega</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color="#64748b" />
              <Text style={styles.infoText}>{pedido.nome_cliente}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={styles.infoText} numberOfLines={2}>{pedido.endereco_entrega}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="wallet-outline" size={16} color="#64748b" />
              <Text style={styles.infoText}>{pedido.forma_pagamento}</Text>
            </View>
          </View>

          <View style={styles.dashedLine} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Itens do Pedido</Text>
            {pedido.itens.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantidade}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.nome_produto}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.preco_unitario_congelado)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>VALOR TOTAL</Text>
            <Text style={styles.totalValue}>{formatCurrency(pedido.valor_total)}</Text>
          </View>

          <View style={styles.receiptFooter}>
            <Text style={styles.footerText}>Gerado em {new Date(pedido.data_hora).toLocaleString("pt-BR")}</Text>
            <Text style={styles.footerBrand}>TRAZAÍ LOJISTA</Text>
          </View>
          
          {/* Efeito de recorte de papel no fundo (opcional visual) */}
          <View style={styles.zigzag} />
        </View>

        {/* BOTÃO DE IMPRESSÃO */}
        <TouchableOpacity style={styles.printBtn} onPress={handleImprimir}>
          <Ionicons name="print" size={24} color="#fff" />
          <Text style={styles.printBtnText}>Imprimir Recibo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOutlineBtn} onPress={handleCompartilhar}>
          <Ionicons name="share-social-outline" size={20} color="#64748b" />
          <Text style={styles.shareOutlineBtnText}>Partilhar por WhatsApp/E-mail</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  errorText: { marginTop: 12, color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  backBtnEmpty: { marginTop: 20, backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnEmptyText: { color: '#fff', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  headerBtn: { padding: 8 },

  scrollContent: { padding: 20 },

  // Receipt Design
  receiptContainer: {
    backgroundColor: '#fff',
    borderRadius: 2, // Quase reto para parecer papel
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  receiptHeader: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  storeName: { fontSize: 22, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
  idBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  idBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  
  dashedLine: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', marginVertical: 20 },
  
  section: { marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#334155', fontWeight: '500' },
  
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemQty: { width: 30, fontSize: 14, fontWeight: '800', color: '#2563eb' },
  itemName: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '500' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginLeft: 10 },
  
  totalBox: { 
    marginTop: 10, 
    paddingTop: 20, 
    borderTopWidth: 2, 
    borderTopColor: '#1e293b',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  totalLabel: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#2563eb' },
  
  receiptFooter: { marginTop: 30, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  footerBrand: { fontSize: 12, fontWeight: '900', color: '#cbd5e1', letterSpacing: 2 },

  zigzag: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#f1f5f9', // Cor do fundo da página
    // Simulação visual de dentes de serra (limitado em RN puro, mas o contraste ajuda)
  },

  // Buttons
  printBtn: { 
    backgroundColor: '#2563eb', 
    height: 60, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
    elevation: 4,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  printBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  shareOutlineBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 16, 
    padding: 15, 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: '#cbd5e1',
    gap: 8
  },
  shareOutlineBtnText: { color: '#64748b', fontWeight: '700', fontSize: 14 }
});