import React from "react";
import { 
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert 
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

export default function AjudaScreen() {
  const handleContactSupport = async () => {
    const phone = "5585996574629";
    const message = "Olá! Preciso de ajuda com o app TRAZAÍ.";

    const appUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) await Linking.openURL(appUrl);
      else await Linking.openURL(webUrl);
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível abrir o WhatsApp. Número para contato: (85) 99657-4629"
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Central de Ajuda", headerShown: true }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* HEADER */}
        <View style={styles.header}>
          <Ionicons name="help-circle" size={60} color="#DC2626" />
          <Text style={styles.headerTitle}>Central de Ajuda</Text>
          <Text style={styles.headerSubtitle}>Tudo o que você precisa saber sobre o TRAZAÍ</Text>
        </View>

        {/* COMO FUNCIONA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Como Funciona</Text>
          </View>

          <Text style={styles.sectionText}>
            O TRAZAÍ conecta sua loja a clientes da sua região. Você cadastra produtos, recebe pedidos
            em tempo real, gerencia entregas, controla pagamentos e acompanha seu desempenho.
          </Text>
        </View>

        {/* VANTAGENS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Vantagens do App</Text>
          </View>

          <View style={styles.benefitBox}>
            <Ionicons name="rocket" size={20} color="#16A34A" />
            <Text style={styles.benefitText}>Aumente suas vendas alcançando clientes online</Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={styles.bulletText}>Gestão completa de pedidos em tempo real</Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={styles.bulletText}>Pagamentos com cartão descontam comissão automaticamente</Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={styles.bulletText}>Pix direto para o lojista (valor cai na hora)</Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={styles.bulletText}>Sem mensalidade para anunciar produtos</Text>
          </View>

          <View style={styles.bulletPoint}>
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            <Text style={styles.bulletText}>Taxa de entrega 100% para o lojista</Text>
          </View>
        </View>

        {/* PRAZOS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Prazos de Recebimento</Text>
          </View>

          <Text style={styles.sectionText}>Veja quando cada valor cai na sua conta:</Text>

          {/* Cartão de Crédito */}
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card" size={20} color="#6772E5" />
              <Text style={styles.paymentMethod}>Cartão de Crédito</Text>
            </View>
            <Text style={styles.paymentDays}>D+30</Text>
            <Text style={styles.paymentDescription}>Prazo padrão antifraude no Brasil.</Text>
          </View>

          {/* Cartão de Débito */}
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card-outline" size={20} color="#16A34A" />
              <Text style={styles.paymentMethod}>Cartão de Débito</Text>
            </View>
            <Text style={styles.paymentDays}>D+2</Text>
            <Text style={styles.paymentDescription}>Liquidação entre bancos.</Text>
          </View>

          {/* Pix Direto */}
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="flash" size={20} color="#0EA5E9" />
              <Text style={styles.paymentMethod}>Pix Direto para o Lojista</Text>
            </View>

            <Text style={[styles.paymentDays, { color: "#16A34A" }]}>Imediato</Text>

            <Text style={styles.paymentDescription}>
              O pagamento cai diretamente na chave Pix cadastrada pela loja.
            </Text>
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.paymentDescription, { fontWeight: "600" }]}>
                🔎 Comissão conforme o plano da loja:
              </Text>

              <Text style={styles.paymentDescription}>• Plano Novo → 5%</Text>
              <Text style={styles.paymentDescription}>• Plano Ativo → 8%</Text>
              <Text style={styles.paymentDescription}>• Plano Destaque → 10%</Text>
            </View>

            <Text style={[styles.paymentDescription, { color: "#DC2626", marginTop: 6 }]}>
              ⚠️ Comissão gerada no app — deve ser paga depois na área "Financeiro".
            </Text>
          </View>

          {/* Dinheiro */}
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="cash-outline" size={20} color="#16A34A" />
              <Text style={styles.paymentMethod}>Dinheiro (Pagamento na Entrega)</Text>
            </View>

            <Text style={[styles.paymentDays, { color: "#16A34A" }]}>Imediato</Text>

            <Text style={styles.paymentDescription}>
              Você recebe o valor diretamente do cliente no momento da entrega.
            </Text>

            <View style={{ marginTop: 6 }}>
              <Text style={[styles.paymentDescription, { fontWeight: "600" }]}>
                🔎 Comissão conforme o plano da loja:
              </Text>

              <Text style={styles.paymentDescription}>• Plano Novo → 5%</Text>
              <Text style={styles.paymentDescription}>• Plano Ativo → 8%</Text>
              <Text style={styles.paymentDescription}>• Plano Destaque → 10%</Text>
            </View>

            <Text style={[styles.paymentDescription, { color: "#DC2626", marginTop: 6 }]}>
              ⚠️ Comissão gerada no app — deve ser paga depois na área "Financeiro".
            </Text>
          </View>
        </View>

        {/* COMISSÕES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Comissões e Taxas</Text>
          </View>

          <Text style={styles.sectionText}>
            As comissões mantêm a plataforma funcionando e garantindo atualizações constantes.
          </Text>

          <Text style={styles.sectionText}>
            🔸 <Text style={styles.bold}>Cartão:</Text> comissão automática, descontada no pagamento.
          </Text>

          <Text style={styles.sectionText}>
            🔸 <Text style={styles.bold}>Pix:</Text> recebimento direto. A comissão é gerada manualmente no app.
          </Text>

          <Text style={styles.sectionText}>
            🔸 <Text style={styles.bold}>Dinheiro:</Text> comissão manual, paga também na aba Financeiro.
          </Text>

          <Text style={styles.sectionText}>
            ⚠️ Prazo máximo de pagamento: <Text style={styles.bold}>30 dias</Text>.
            Após isso, a loja pode ser <Text style={styles.bold}>bloqueada</Text>.
          </Text>
        </View>

        {/* EVOLUÇÃO DOS PLANOS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Como minha loja muda de plano?</Text>
          </View>

          <Text style={styles.sectionText}>
            Sua loja progride automaticamente com o tempo. Nada precisa ser feito manualmente.
          </Text>

          {/* Timeline */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Plano Novo — 5%</Text>
                <Text style={styles.timelineDescription}>Dias 0 a 30 após o cadastro</Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Plano Ativo — 8%</Text>
                <Text style={styles.timelineDescription}>Dias 31 a 90</Text>
              </View>
            </View>

            <View style={styles.timelineLine} />

            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Plano Destaque — 10%</Text>
                <Text style={styles.timelineDescription}>A partir do dia 91+</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionText, { marginTop: 15 }]}>
            Esses percentuais valem para pedidos pagos em dinheiro ou Pix direto.
            No cartão, a comissão é descontada automaticamente.
          </Text>
        </View>

        {/* SUPORTE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Precisa de Ajuda?</Text>
          </View>

          <Text style={styles.sectionText}>Fale diretamente com o suporte do TRAZAÍ.</Text>

          <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.supportButtonText}>Falar com Suporte</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: { alignItems: "center", marginBottom: 30, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#1F2937", marginTop: 15 },
  headerSubtitle: { fontSize: 16, color: "#6B7280", marginTop: 8, textAlign: "center" },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937", marginLeft: 10 },

  sectionText: { fontSize: 15, color: "#4B5563", lineHeight: 22, marginBottom: 10 },
  bold: { fontWeight: "600", color: "#1F2937" },

  benefitBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#16A34A",
  },
  benefitText: { flex: 1, fontSize: 15, color: "#166534", marginLeft: 10, lineHeight: 20 },

  bulletPoint: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  bulletText: { fontSize: 15, color: "#4B5563", marginLeft: 10 },

  paymentCard: {
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  paymentHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  paymentMethod: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginLeft: 8 },
  paymentDays: { fontSize: 24, fontWeight: "bold", color: "#DC2626", marginBottom: 5 },
  paymentDescription: { fontSize: 14, color: "#6B7280", lineHeight: 18 },

  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  supportButtonText: { fontSize: 16, fontWeight: "600", color: "#fff", marginLeft: 8 },

  /* TIMELINE */
  timelineContainer: { marginTop: 10, paddingLeft: 10 },
  timelineStep: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  timelineDot: {
    width: 14,
    height: 14,
    backgroundColor: "#DC2626",
    borderRadius: 7,
    marginRight: 12,
  },
  timelineLine: {
    width: 2,
    height: 22,
    backgroundColor: "#DC2626",
    marginLeft: 6,
    marginBottom: 12,
  },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  timelineDescription: { fontSize: 14, color: "#6B7280" },
});
