"use client"

import { useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native"
import { Stack } from "expo-router"
import api from "../../../src/api/api"
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext"
import { Ionicons } from "@expo/vector-icons"

interface HistoricoItem {
  id: number
  data_hora: string
  valor_total: string
  status: string
  nome_cliente: string
}

const CustomDatePicker = ({
  visible,
  onClose,
  onSelect,
  initialDate,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (date: Date) => void
  initialDate: Date
}) => {
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate())
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear())

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay)
    onSelect(newDate)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Data</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerContainer}>
            {/* Day Selector */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Dia</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map(
                  (day: number) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextSelected]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </ScrollView>
            </View>

            {/* Month Selector */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Mês</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text style={[styles.pickerItemText, selectedMonth === index && styles.pickerItemTextSelected]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year Selector */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Ano</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextSelected]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default function HistoricoPedidosScreen() {
  const [pedidos, setPedidos] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(false)
  const { loja } = useAuthLoja()

  const [dataInicio, setDataInicio] = useState(new Date())
  const [dataFim, setDataFim] = useState(new Date())
  const [showPickerInicio, setShowPickerInicio] = useState(false)
  const [showPickerFim, setShowPickerFim] = useState(false)

  const buscarHistoricoFiltrado = useCallback(async () => {
    if (!loja?.id) return

    setLoading(true)
    try {
      const inicioFormatado = dataInicio.toISOString().split("T")[0]
      const fimFormatado = dataFim.toISOString().split("T")[0]

      const response = await api.get(`/pedidos/loja/${loja.id}/historico`, {
        params: {
          data_inicio: inicioFormatado,
          data_fim: fimFormatado,
        },
      })

      setPedidos(response.data)
      if (response.data.length === 0) {
        Alert.alert("Nenhum resultado", "Nenhum pedido encontrado para o período selecionado.")
      }
    } catch (error) {
      console.error("Erro ao buscar histórico de pedidos:", error)
      Alert.alert("Erro", "Não foi possível buscar o histórico de pedidos.")
    } finally {
      setLoading(false)
    }
  }, [loja?.id, dataInicio, dataFim])

  const renderItem = ({ item }: { item: HistoricoItem }) => (
    <View style={[styles.pedidoCard, item.status === "Cancelado" && styles.cardCancelado]}>
      <View style={styles.cardHeader}>
        <View style={styles.clienteInfo}>
          <Ionicons name="person-circle-outline" size={20} color="#666" />
          <Text style={styles.clienteNome}>{item.nome_cliente}</Text>
        </View>
        <View
          style={[styles.statusBadge, item.status === "Cancelado" ? styles.statusCancelado : styles.statusFinalizado]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.data_hora).toLocaleDateString("pt-BR")} às{" "}
            {new Date(item.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.valorTotal}>R$ {Number.parseFloat(item.valor_total).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Histórico de Pedidos" }} />

      <View style={styles.filterSection}>
        <Text style={styles.titulo}>Histórico de Pedidos</Text>

        <View style={styles.dateFilterContainer}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPickerInicio(true)}>
            <Ionicons name="calendar" size={20} color="#D80032" />
            <View style={styles.dateButtonContent}>
              <Text style={styles.dateLabel}>Data Início</Text>
              <Text style={styles.dateValue}>{dataInicio.toLocaleDateString("pt-BR")}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPickerFim(true)}>
            <Ionicons name="calendar" size={20} color="#D80032" />
            <View style={styles.dateButtonContent}>
              <Text style={styles.dateLabel}>Data Fim</Text>
              <Text style={styles.dateValue}>{dataFim.toLocaleDateString("pt-BR")}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={buscarHistoricoFiltrado}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.filterButtonText}>Filtrar Pedidos</Text>
        </TouchableOpacity>
      </View>

      <CustomDatePicker
        visible={showPickerInicio}
        onClose={() => setShowPickerInicio(false)}
        onSelect={setDataInicio}
        initialDate={dataInicio}
      />
      <CustomDatePicker
        visible={showPickerFim}
        onClose={() => setShowPickerFim(false)}
        onSelect={setDataFim}
        initialDate={dataFim}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D80032" />
          <Text style={styles.loadingText}>Carregando pedidos...</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          style={styles.lista}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.textoVazio}>Nenhum pedido encontrado</Text>
              <Text style={styles.textoVazioSubtitle}>Use o filtro acima para buscar pedidos</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  filterSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 20,
  },
  dateFilterContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 10,
  },
  dateButtonContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  filterButton: {
    backgroundColor: "#D80032",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  lista: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pedidoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCancelado: {
    backgroundColor: "#fff5f5",
    borderLeftWidth: 4,
    borderLeftColor: "#ff4444",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clienteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusFinalizado: {
    backgroundColor: "#e8f5e9",
  },
  statusCancelado: {
    backgroundColor: "#ffebee",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 12,
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  valorTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  textoVazio: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  textoVazioSubtitle: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  datePickerContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  pickerScroll: {
    maxHeight: 200,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
  },
  pickerItem: {
    padding: 12,
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: "#D80032",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  pickerItemTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "#D80032",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
