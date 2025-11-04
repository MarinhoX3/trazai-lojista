"use client"
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from "react-native"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

export default function AjudaScreen() {
  const router = useRouter()

  const handleContactSupport = () => {
    const whatsappNumber = "5585996574629"
    const message = "Olá, preciso de ajuda com o app TRAZAÍ"
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url)
        } else {
          alert("Não foi possível abrir o WhatsApp. Por favor, entre em contato pelo número: (85) 99657-4629")
        }
      })
      .catch((err) => {
        console.error("Erro ao abrir WhatsApp:", err)
        alert("Erro ao abrir WhatsApp. Número para contato: (85) 99657-4629")
      })
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Central de Ajuda",
          headerShown: true,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="help-circle" size={60} color="#DC2626" />
          <Text style={styles.headerTitle}>Central de Ajuda</Text>
          <Text style={styles.headerSubtitle}>Tudo o que você precisa saber sobre o TRAZAÍ</Text>
        </View>

        {/* Como Funciona */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Como Funciona</Text>
          </View>
          <Text style={styles.sectionText}>
            O TRAZAÍ conecta sua loja a milhares de clientes. Você cadastra seus produtos, recebe pedidos em tempo real
            e gerencia tudo pelo app. Simples, rápido e seguro!
          </Text>
        </View>

        {/* Vantagens */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Ionicons name="star" size={24} color="#DC2626" />
    <Text style={styles.sectionTitle}>Vantagens do App</Text>
  </View>

  <View style={styles.benefitBox}>
    <Ionicons name="rocket" size={20} color="#16A34A" />
    <Text style={styles.benefitText}>
      <Text style={styles.benefitBold}>Aumente suas vendas</Text> alcançando clientes online em toda sua região
    </Text>
  </View>

  <View style={styles.bulletPoint}>
    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
    <Text style={styles.bulletText}>Gestão completa de pedidos em tempo real</Text>
  </View>

  <View style={styles.bulletPoint}>
    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
    <Text style={styles.bulletText}>Pagamentos online seguros com Stripe</Text>
  </View>

  <View style={styles.bulletPoint}>
    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
    <Text style={styles.bulletText}>Sem mensalidade para anunciar produtos</Text>
  </View>

  <View style={styles.bulletPoint}>
    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
    <Text style={styles.bulletText}>Taxa de entrega 100% para o lojista</Text>
  </View>

  <View style={styles.bulletPoint}>
    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
    <Text style={styles.bulletText}>Plataforma sempre atualizada e com suporte ativo</Text>
  </View>
</View>


        {/* Prazos de Recebimento */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Prazos de Recebimento</Text>
          </View>
          <Text style={styles.sectionText}>Confira quando você recebe o pagamento de cada tipo de transação:</Text>

          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card" size={20} color="#6772E5" />
              <Text style={styles.paymentMethod}>Cartão de Crédito</Text>
            </View>
            <Text style={styles.paymentDays}>D+30</Text>
            <Text style={styles.paymentDescription}>Prazo obrigatório de antifraude no Brasil</Text>
          </View>

          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card-outline" size={20} color="#16A34A" />
              <Text style={styles.paymentMethod}>Cartão de Débito</Text>
            </View>
            <Text style={styles.paymentDays}>D+2</Text>
            <Text style={styles.paymentDescription}>Liquidação bancária mais rápida</Text>
          </View>

          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="flash" size={20} color="#0EA5E9" />
              <Text style={styles.paymentMethod}>Pix via Stripe</Text>
            </View>
            <Text style={styles.paymentDays}>D+1</Text>
            <Text style={styles.paymentDescription}>
              Pix é liquidação imediata, mas Stripe protege contra chargeback/fraude
            </Text>
          </View>
        </View>

        {/* Prazos de Entrega */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bicycle" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Prazos de Entrega</Text>
          </View>
          <Text style={styles.sectionText}>
            Você define o prazo de entrega dos seus produtos. Recomendamos ser realista para garantir a satisfação dos
            clientes. A taxa de entrega também é configurável na seção Financeiro.
          </Text>
        </View>

        {/* Como Gerenciar Pedidos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Como Gerenciar Pedidos</Text>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Receba o Pedido</Text>
              <Text style={styles.stepDescription}>Novos pedidos aparecem na aba "Pedidos" com status "Recebido"</Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Prepare o Pedido</Text>
              <Text style={styles.stepDescription}>Mova para "Preparando" quando começar a separar os produtos</Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Envie para Entrega</Text>
              <Text style={styles.stepDescription}>Quando estiver pronto, mova para "Saiu para Entrega"</Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Finalize</Text>
              <Text style={styles.stepDescription}>Após a entrega, marque como "Entregue" para concluir</Text>
            </View>
          </View>
        </View>

        {/* Comissões e Taxas */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Ionicons name="cash" size={24} color="#DC2626" />
    <Text style={styles.sectionTitle}>Comissões e Taxas</Text>
  </View>

  <Text style={styles.sectionText}>
    A plataforma cobra comissão para manter o app funcionando, oferecer suporte e cobrir custos
    de tecnologia e segurança.
  </Text>

  <Text style={styles.sectionText}>
    ✔️ A comissão é de <Text style={styles.bold}>10% sobre o valor do pedido</Text> para qualquer tipo de pagamento.
  </Text>

  {/* Tabela */}
  <View style={styles.table}>
    <View style={styles.tableRowHeader}>
      <Text style={styles.th}>Pagamento</Text>
      <Text style={styles.th}>Comissão</Text>
      <Text style={styles.th}>Tarifas Stripe</Text>
      <Text style={styles.th}>Lojista Recebe</Text>
    </View>

    <View style={styles.tableRow}>
      <Text style={styles.td}>Cartão / Pix</Text>
      <Text style={styles.td}>10%</Text>
      <Text style={styles.td}>Sim (~3%)</Text>
      <Text style={styles.td}>~87%</Text>
    </View>

    <View style={styles.tableRow}>
      <Text style={styles.td}>Dinheiro</Text>
      <Text style={styles.td}>10%</Text>
      <Text style={styles.td}>Não</Text>
      <Text style={styles.td}>90%</Text>
    </View>

    <View style={styles.tableRow}>
      <Text style={styles.td}>Taxa de Entrega</Text>
      <Text style={styles.td}>0%</Text>
      <Text style={styles.td}>Não</Text>
      <Text style={styles.td}>100%</Text>
    </View>
  </View>

  {/* Exemplos Práticos */}
  <Text style={[styles.sectionText, { marginTop: 10 }]}>
    <Text style={styles.bold}>Exemplos de recebimentos:</Text>
  </Text>

  <View style={styles.exampleBox}>
    <Text style={styles.exampleText}>Pedido de R$ 100,00 no Cartão → Lojista recebe ~R$ 87,00</Text>
    <Text style={styles.exampleText}>Pedido de R$ 100,00 no Pix → Lojista recebe ~R$ 87,00</Text>
    <Text style={styles.exampleText}>Pedido de R$ 100,00 em Dinheiro → Lojista recebe R$ 90,00</Text>
  </View>

  <Text style={styles.sectionText}>
    As tarifas Stripe aparecem detalhadas no seu painel de pagamentos dentro do app.
  </Text>
</View>


        {/* FAQ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Como adiciono produtos?</Text>
            <Text style={styles.faqAnswer}>
              Na tela inicial, clique no botão vermelho "+ Adicionar Produto" e preencha as informações.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Posso editar um produto?</Text>
            <Text style={styles.faqAnswer}>
              Sim! Clique no produto na tela inicial para editar preço, estoque, descrição e foto.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Como configuro pagamentos online?</Text>
            <Text style={styles.faqAnswer}>
              Vá em Perfil → Configurar Pagamentos. Você será direcionado para criar uma conta Stripe (gratuito e
              seguro).
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Posso cancelar um pedido?</Text>
            <Text style={styles.faqAnswer}>
              Entre em contato com o suporte para cancelamentos. Pedidos pagos online precisam de estorno.
            </Text>
          </View>
        </View>

        {/* Suporte */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset" size={24} color="#DC2626" />
            <Text style={styles.sectionTitle}>Precisa de Ajuda?</Text>
          </View>
          <Text style={styles.sectionText}>Nossa equipe está pronta para ajudar! Entre em contato:</Text>
          <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.supportButtonText}>Falar com Suporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 30, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#1F2937", marginTop: 15 },
  headerSubtitle: { fontSize: 16, color: "#6B7280", marginTop: 8, textAlign: "center" },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937", marginLeft: 10 },
  sectionText: { fontSize: 15, color: "#4B5563", lineHeight: 22, marginBottom: 10 },
  bold: { fontWeight: "600", color: "#1F2937" },
  benefitBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", padding: 15, borderRadius: 8, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: "#16A34A" },
  benefitText: { flex: 1, fontSize: 15, color: "#166534", marginLeft: 10, lineHeight: 20 },
  benefitBold: { fontWeight: "bold" },
  bulletPoint: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  bulletText: { fontSize: 15, color: "#4B5563", marginLeft: 10 },
  paymentCard: { backgroundColor: "#F9FAFB", padding: 15, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  paymentHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  paymentMethod: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginLeft: 8 },
  paymentDays: { fontSize: 24, fontWeight: "bold", color: "#DC2626", marginBottom: 5 },
  paymentDescription: { fontSize: 14, color: "#6B7280", lineHeight: 18 },
  stepCard: { flexDirection: "row", marginBottom: 15 },
  stepNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#DC2626", justifyContent: "center", alignItems: "center", marginRight: 12 },
  stepNumberText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 4 },
  stepDescription: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  faqItem: { marginBottom: 20 },
  faqQuestion: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 6 },
  faqAnswer: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  supportButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#DC2626", padding: 16, borderRadius: 8, marginTop: 10 },
  table: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 6,
  marginVertical: 10,
},
tableRowHeader: {
  flexDirection: "row",
  backgroundColor: "#F3F4F6",
  paddingVertical: 6,
},
tableRow: {
  flexDirection: "row",
  borderTopWidth: 1,
  borderTopColor: "#E5E7EB",
  paddingVertical: 6,
},
th: {
  flex: 1,
  fontSize: 12,
  fontWeight: "700",
  color: "#1F2937",
  textAlign: "center",
},
td: {
  flex: 1,
  fontSize: 12,
  color: "#4B5563",
  textAlign: "center",
},
exampleBox: {
  backgroundColor: "#EFF6FF",
  padding: 12,
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: "#3B82F6",
  marginBottom: 10,
},
exampleText: {
  fontSize: 14,
  color: "#1E3A8A",
  marginBottom: 4,
},

  supportButtonText: { fontSize: 16, fontWeight: "600", color: "#fff", marginLeft: 8 },
})
