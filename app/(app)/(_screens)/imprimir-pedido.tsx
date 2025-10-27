"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
  Share,
} from "react-native"
import { Stack, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
type PedidoItem = {
  nome_produto: string
  quantidade: number | string
  preco_unitario_congelado: number | string
}

type PedidoDetalhes = {
  id: number | string
  nome_loja: string
  data_hora: string
  nome_cliente: string
  telefone_cliente: string
  endereco_entrega: string
  forma_pagamento: string
  itens: PedidoItem[]
  valor_total: number | string
}

import api from "../../../src/api/api"

export default function ImprimirPedidoScreen() {
  const { id_pedido } = useLocalSearchParams<{ id_pedido: string }>()
  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/pedidos/${id_pedido}`)
        setPedido(response.data)
      } catch (error) {
        console.error("Erro ao buscar pedido:", error)
        Alert.alert("Erro", "Não foi possível carregar o pedido.")
      } finally {
        setLoading(false)
      }
    }

    if (id_pedido) {
      fetchPedido()
    }
  }, [id_pedido])

  const gerarTextoDoCupom = () => {
    if (!pedido) return ""

    const itensTexto = pedido.itens
      .map(
        (item: PedidoDetalhes["itens"][0]) =>
          `${Number.parseInt(String(item.quantidade), 10)} und - ${item.nome_produto} - R$ ${Number.parseFloat(String(item.preco_unitario_congelado)).toFixed(2)}`,
      )
      .join("\n")

    return `
━━━━━━━━━━━━━━━━━━━━━━
${pedido.nome_loja}
━━━━━━━━━━━━━━━━━━━━━━

📋 Pedido #${pedido.id}
📅 ${new Date(pedido.data_hora).toLocaleString("pt-BR")}

👤 DADOS DO CLIENTE
━━━━━━━━━━━━━━━━━━━━━━
Nome: ${pedido.nome_cliente}
Telefone: ${pedido.telefone_cliente}
Endereço: ${pedido.endereco_entrega}
Pagamento: ${pedido.forma_pagamento}

🛒 ITENS DO PEDIDO
━━━━━━━━━━━━━━━━━━━━━━
${itensTexto}

━━━━━━━━━━━━━━━━━━━━━━
💰 TOTAL: R$ ${Number.parseFloat(String(pedido.valor_total)).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━
    `.trim()
  }

  const handleCompartilhar = async () => {
    const textoCompleto = gerarTextoDoCupom()
    if (!textoCompleto) {
      Alert.alert("Erro", "Não há dados para compartilhar.")
      return
    }
    try {
      await Share.share({
        message: textoCompleto,
        title: `Cupom Pedido #${pedido?.id}`,
      })
    } catch (error) {
      console.error("Erro ao compartilhar:", error)
      Alert.alert("Erro", "Não foi possível compartilhar o cupom.")
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D80032" />
        <Text style={styles.loadingText}>Carregando pedido...</Text>
      </View>
    )
  }

  if (!pedido) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#999" />
        <Text style={styles.errorText}>Pedido não encontrado.</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Cupom Pedido #${pedido.id}` }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.cupomCard}>
          <View style={styles.header}>
            <Ionicons name="receipt-outline" size={32} color="#D80032" />
            <Text style={styles.cupomTitle}>{pedido.nome_loja}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>#{pedido.id}</Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}>
              {new Date(pedido.data_hora).toLocaleDateString("pt-BR")} às{" "}
              {new Date(pedido.data_hora).toLocaleTimeString("pt-BR")}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color="#D80032" />
              <Text style={styles.sectionTitle}>Dados do Cliente</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome:</Text>
              <Text style={styles.infoValue}>{pedido.nome_cliente}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone:</Text>
              <Text style={styles.infoValue}>{pedido.telefone_cliente}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Endereço:</Text>
              <Text style={styles.infoValue}>{pedido.endereco_entrega}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pagamento:</Text>
              <Text style={styles.infoValue}>{pedido.forma_pagamento}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cart-outline" size={20} color="#D80032" />
              <Text style={styles.sectionTitle}>Itens do Pedido</Text>
            </View>
            {pedido.itens.map((item: PedidoDetalhes["itens"][0], index: number) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{Number.parseInt(String(item.quantidade), 10)}x</Text>
                  </View>
                  <Text style={styles.itemName}>{item.nome_produto}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {Number.parseFloat(String(item.preco_unitario_congelado)).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total do Pedido</Text>
            <Text style={styles.totalValue}>R$ {Number.parseFloat(String(pedido.valor_total)).toFixed(2)}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
          onPress={handleCompartilhar}
        >
          <Ionicons name="share-social-outline" size={24} color="#fff" />
          <Text style={styles.shareButtonText}>Compartilhar Cupom</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
  cupomCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  cupomTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  badge: {
    backgroundColor: "#D80032",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    flex: 1,
  },
  itemCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: "#D80032",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 36,
    alignItems: "center",
  },
  quantityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  itemName: {
    fontSize: 14,
    color: "#1a1a1a",
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D80032",
  },
  totalContainer: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D80032",
  },
  shareButton: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#D80032",
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D80032",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
})
