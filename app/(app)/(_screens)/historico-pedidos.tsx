"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importações de API e Contexto (Caminhos relativos mantidos conforme o seu projeto local)
import api from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";

interface HistoricoItem {
  id: number;
  data_hora: string;
  valor_total: string;
  status: string;
  nome_cliente: string;
  motivo_cancelamento?: string;
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Componente do Seletor de Datas Personalizado
const CustomDatePicker = ({
  visible,
  onClose,
  onSelect,
  initialDate,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate: Date;
  title: string;
}) => {
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    onSelect(newDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeModalBtn}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerContainer}>
            {/* Dia */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Dia</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextSelected]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Mês */}
            <View style={[styles.pickerColumn, { flex: 2 }]}>
              <Text style={styles.pickerLabel}>Mês</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text style={[styles.pickerItemText, selectedMonth === index && styles.pickerItemTextSelected]}>{month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Ano */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Ano</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextSelected]}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirmar Seleção</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loja } = useAuthLoja();

  const [pedidos, setPedidos] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFim, setDataFim] = useState(new Date());
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFim, setShowPickerFim] = useState(false);

  const buscarHistoricoFiltrado = useCallback(async () => {
    if (!loja?.id) return;
    setLoading(true);
    try {
      const inicioFormatado = dataInicio.toISOString().split("T")[0];
      const fimFormatado = dataFim.toISOString().split("T")[0];

      const response = await api.get(`/pedidos/loja/${loja.id}/historico`, {
        params: { data_inicio: inicioFormatado, data_fim: fimFormatado },
      });
      setPedidos(response.data);
    } catch (error) {
      console.error("Erro ao procurar histórico:", error);
      Alert.alert("Erro", "Não foi possível carregar o histórico de pedidos.");
    } finally {
      setLoading(false);
    }
  }, [loja?.id, dataInicio, dataFim]);

  useFocusEffect(
    useCallback(() => {
      buscarHistoricoFiltrado();
    }, [buscarHistoricoFiltrado])
  );

  const renderItem = ({ item }: { item: HistoricoItem }) => {
    const isCancelado = item.status === "Cancelado";
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`detalhes-pedido?id_pedido=${item.id}`)}
        activeOpacity={0.7}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>Pedido #{item.id}</Text>
          </View>
          <View style={[styles.statusBadge, isCancelado ? styles.badgeCancelado : styles.badgeFinalizado]}>
            <Text style={[styles.statusText, isCancelado ? styles.textCancelado : styles.textFinalizado]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.clientRow}>
          <View style={styles.clientIconBg}>
            <Ionicons name="person" size={14} color="#2563eb" />
          </View>
          <Text style={styles.clientName}>{item.nome_cliente}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
            <Text style={styles.detailText}>
              {new Date(item.data_hora).toLocaleDateString("pt-BR")}
            </Text>
          </View>
          <Text style={styles.totalValue}>
            R$ {parseFloat(item.valor_total).toFixed(2).replace(".", ",")}
          </Text>
        </View>

        {isCancelado && item.motivo_cancelamento && (
          <View style={styles.cancelBox}>
            <Ionicons name="alert-circle-outline" size={14} color="#be123c" />
            <Text style={styles.cancelText} numberOfLines={1}>
              Motivo: {item.motivo_cancelamento}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER PERSONALIZADO COM INSET */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Histórico</Text>
          <Text style={styles.headerSubtitle}>Gestão de Pedidos</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* PAINEL DE FILTROS SUPERIOR */}
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Ionicons name="options-outline" size={16} color="#94a3b8" />
          <Text style={styles.filterTitle}>Filtrar Período</Text>
        </View>
        
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowPickerInicio(true)}>
            <Text style={styles.dateLabel}>Desde</Text>
            <Text style={styles.dateValue}>{dataInicio.toLocaleDateString("pt-BR")}</Text>
          </TouchableOpacity>
          
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={16} color="#cbd5e1" />
          </View>

          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowPickerFim(true)}>
            <Text style={styles.dateLabel}>Até</Text>
            <Text style={styles.dateValue}>{dataFim.toLocaleDateString("pt-BR")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={buscarHistoricoFiltrado} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchBtnText}>Atualizar Lista</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CustomDatePicker
        title="Data Inicial"
        visible={showPickerInicio}
        onClose={() => setShowPickerInicio(false)}
        onSelect={setDataInicio}
        initialDate={dataInicio}
      />
      <CustomDatePicker
        title="Data Final"
        visible={showPickerFim}
        onClose={() => setShowPickerFim(false)}
        onSelect={setDataFim}
        initialDate={dataFim}
      />

      {loading && pedidos.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>A procurar registos...</Text>
        </View>
      ) : (
        <FlatList
          data={pedidos}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={50} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Sem pedidos registados</Text>
              <Text style={styles.emptySubtitle}>Não foram encontrados pedidos para as datas selecionadas.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  
  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitleWrapper: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  backBtn: { padding: 4 },

  // Painel de Filtros
  filterCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 10
  },
  filterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  filterTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  dateSelector: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  arrowContainer: { paddingHorizontal: 8 },
  dateLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  searchBtn: { 
    backgroundColor: '#2563eb', 
    height: 52, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 8 },

  // Cartões de Histórico
  listContent: { padding: 20, paddingTop: 24 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderIdBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderIdText: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeFinalizado: { backgroundColor: '#dcfce7' },
  badgeCancelado: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  textFinalizado: { color: '#166534' },
  textCancelado: { color: '#991b1b' },

  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  clientIconBg: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  clientName: { fontSize: 15, fontWeight: '700', color: '#334155' },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },
  
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#16a34a' },

  cancelBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#fff1f2', 
    padding: 8, 
    borderRadius: 12, 
    marginTop: 12 
  },
  cancelText: { fontSize: 12, color: '#be123c', fontWeight: '600', flex: 1 },

  // Estado Vazio
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 24, elevation: 2, shadowOpacity: 0.05 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", padding: 24 },
  modalContent: { backgroundColor: "#fff", borderRadius: 32, padding: 24, elevation: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  closeModalBtn: { padding: 4 },
  datePickerContainer: { flexDirection: "row", gap: 8, marginBottom: 24, height: 200 },
  pickerColumn: { flex: 1.5 },
  pickerLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textAlign: "center", marginBottom: 8, textTransform: 'uppercase' },
  pickerScroll: { backgroundColor: "#f8fafc", borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  pickerItem: { paddingVertical: 12, alignItems: "center" },
  pickerItemSelected: { backgroundColor: "#2563eb" },
  pickerItemText: { fontSize: 15, color: "#475569", fontWeight: '700' },
  pickerItemTextSelected: { color: "#fff", fontWeight: "900" },
  confirmButton: { backgroundColor: "#2563eb", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});