"use client";

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import api from "../../src/api/api";
import { useAuthLoja } from "../../src/api/contexts/AuthLojaContext";

/* ===================== TIPAGENS ===================== */

interface HorarioDia {
  ativo: boolean;
  abre: string;
  fecha: string;
}

interface HorariosFuncionamento {
  [key: string]: HorarioDia;
}

interface DiaConfig {
  key: string;
  label: string;
}

/* ===================== CONSTANTES ===================== */

const DIAS: DiaConfig[] = [
  { key: "segunda", label: "Segunda-feira" },
  { key: "terca", label: "Terça-feira" },
  { key: "quarta", label: "Quarta-feira" },
  { key: "quinta", label: "Quinta-feira" },
  { key: "sexta", label: "Sexta-feira" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

/* ===================== HELPERS ===================== */

const parseHora = (hora: string): Date => {
  const [h, m] = hora.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 8, m || 0, 0, 0);
  return d;
};

const formatHora = (date: Date): string =>
  date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

/* ===================== COMPONENTE ===================== */

export default function HorariosLojaScreen() {
  const router = useRouter();
  const { loja, updateAuthLoja } = useAuthLoja();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [abertaManual, setAbertaManual] = useState<boolean>(true);
  const [horarios, setHorarios] = useState<HorariosFuncionamento>({});

  const [picker, setPicker] = useState<{
    dia: string;
    campo: "abre" | "fecha";
  } | null>(null);

  /* ===================== LOAD ===================== */

  useEffect(() => {
    if (!loja?.id) return;

    const carregarDados = async () => {
      try {
        const res = await api.get(`/lojas/${loja.id}`);
        setAbertaManual(Boolean(res.data.loja_aberta_manual));
        setHorarios(res.data.horarios_funcionamento || {});
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os horários.");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [loja?.id]);

  /* ===================== FUNÇÕES ===================== */

  const toggleDia = (dia: string, ativo: boolean) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: {
        ativo,
        abre: prev[dia]?.abre || "08:00",
        fecha: prev[dia]?.fecha || "18:00",
      },
    }));
  };

  const abrirPicker = (dia: string, campo: "abre" | "fecha") => {
    setPicker({ dia, campo });
  };

  const onChangeHora = (_: any, selected?: Date) => {
    // No Android, o picker fecha ao selecionar ou cancelar
    if (Platform.OS === "android") {
      setPicker(null);
    }

    if (selected && picker) {
      const { dia, campo } = picker;
      setHorarios((prev) => ({
        ...prev,
        [dia]: {
          ...prev[dia],
          [campo]: formatHora(selected),
        },
      }));
    }
  };

  const salvar = async () => {
    if (!loja?.id) return;

    try {
      setSalvando(true);

      const payload = {
        loja_aberta_manual: abertaManual,
        horarios_funcionamento: horarios,
      };

      await api.put(`/lojas/${loja.id}/horarios`, payload);
      
      if (updateAuthLoja) {
        await updateAuthLoja(payload);
      }

      Alert.alert("Sucesso", "Horários atualizados com sucesso!");
      router.back();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  };

  /* ===================== RENDER ===================== */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Carregando horários...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER - Ajustado para descer mais no Android */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={26} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Horário de Funcionamento</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* STATUS MANUAL */}
          <View style={[styles.card, styles.statusCard]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Status da Loja</Text>
              <Text style={styles.description}>
                {abertaManual ? "A loja está aberta para pedidos agora." : "A loja está fechada manualmente."}
              </Text>
            </View>
            <Switch 
              value={abertaManual} 
              onValueChange={setAbertaManual}
              trackColor={{ false: "#d1d5db", true: "#bbf7d0" }}
              thumbColor={abertaManual ? "#16a34a" : "#f4f3f4"}
            />
          </View>

          <Text style={styles.sectionTitle}>Horários por dia</Text>

          {/* LISTA DE DIAS */}
          {DIAS.map((d) => {
            const diaConfig = horarios[d.key] || {
              ativo: false,
              abre: "08:00",
              fecha: "18:00",
            };

            return (
              <View key={d.key} style={[styles.cardColumn, !diaConfig.ativo && styles.cardInactive]}>
                <View style={styles.rowBetween}>
                  <View style={styles.dayInfo}>
                    <Text style={[styles.label, !diaConfig.ativo && styles.textMuted]}>{d.label}</Text>
                    {!diaConfig.ativo && <Text style={styles.closedTag}>Fechado</Text>}
                  </View>
                  <Switch
                    value={!!diaConfig.ativo}
                    onValueChange={(v) => toggleDia(d.key, v)}
                    trackColor={{ false: "#d1d5db", true: "#bbf7d0" }}
                    thumbColor={diaConfig.ativo ? "#16a34a" : "#f4f3f4"}
                  />
                </View>

                {diaConfig.ativo && (
                  <View style={styles.timeRow}>
                    <TouchableOpacity
                      style={styles.timeBtn}
                      onPress={() => abrirPicker(d.key, "abre")}
                    >
                      <Ionicons name="time-outline" size={18} color="#4b5563" />
                      <View style={styles.timeLabelGroup}>
                        <Text style={styles.timeLabel}>Abertura</Text>
                        <Text style={styles.timeValue}>{diaConfig.abre}</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.timeSeparator} />

                    <TouchableOpacity
                      style={styles.timeBtn}
                      onPress={() => abrirPicker(d.key, "fecha")}
                    >
                      <Ionicons name="time-outline" size={18} color="#4b5563" />
                      <View style={styles.timeLabelGroup}>
                        <Text style={styles.timeLabel}>Fechamento</Text>
                        <Text style={styles.timeValue}>{diaConfig.fecha}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
          
          {/* Espaçamento extra para não cobrir o conteúdo pelo footer elevado */}
          <View style={{ height: 160 }} />
        </ScrollView>

        {/* BOTÃO FIXO NO RODAPÉ ELEVADO */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, salvando && styles.saveBtnDisabled]}
            onPress={salvar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* PICKER (iOS e Android) */}
        {picker && (
          <DateTimePicker
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            value={parseHora(horarios[picker.dia]?.[picker.campo] || "08:00")}
            onChange={onChangeHora}
            {...(Platform.OS === 'ios' ? { 
              textColor: "black",
              style: { backgroundColor: 'white' } 
            } : {})}
          />
        )}
        
        {/* Fallback para fechar picker no iOS se necessário */}
        {Platform.OS === "ios" && picker && (
          <TouchableOpacity 
            style={styles.iosDoneBtn} 
            onPress={() => setPicker(null)}
          >
            <Text style={styles.iosDoneText}>Confirmar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 10, color: "#6b7280", fontSize: 14 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    // Aumentamos o paddingTop no Android para evitar colisão com a barra de status
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 12,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },

  scrollContent: { padding: 16 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    // Sombra Leve
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  statusCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#16a34a",
    marginBottom: 24,
  },

  description: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  cardColumn: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },

  cardInactive: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },

  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  closedTag: {
    marginLeft: 8,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase'
  },

  label: { fontSize: 16, fontWeight: "600", color: "#374151" },
  textMuted: { color: "#9ca3af" },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },

  timeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  timeSeparator: {
    width: 12,
  },

  timeLabelGroup: {
    marginLeft: 10,
  },

  timeLabel: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
  },

  timeValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    // Aumentamos ainda mais o paddingBottom para evitar colisão com gestos/barras de navegação
    paddingBottom: Platform.OS === 'ios' ? 44 : 55,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    // Sombra para destacar o rodapé
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20,
  },

  saveBtn: {
    backgroundColor: "#16a34a",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  saveBtnDisabled: {
    backgroundColor: "#86efac",
  },

  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  iosDoneBtn: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  iosDoneText: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 16
  }
});