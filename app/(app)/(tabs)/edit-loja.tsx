"use client";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import * as MailComposer from "expo-mail-composer";


import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import api, { ASSET_BASE_URL } from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";

export default function EditLojaScreen() {
  const router = useRouter();
  const { loja, token, logout } = useAuthLoja();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [logo, setLogo] = useState<any>(null);
  const [logoAtualUrl, setLogoAtualUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);

  // MÉTODOS DE PAGAMENTO
  const [aceitaPix, setAceitaPix] = useState(true);
  const [aceitaCartao, setAceitaCartao] = useState(true);
  const [aceitaDinheiro, setAceitaDinheiro] = useState(true);
  const [aceitaMaquininha, setAceitaMaquininha] = useState(true);
  const [taxaStripe, setTaxaStripe] = useState("5");
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);
  const [aceitaEntrega, setAceitaEntrega] = useState(true);
  const [aceitaRetirada, setAceitaRetirada] = useState(true);
  const [loadingEntrega, setLoadingEntrega] = useState(false);
  
 const falarComSuporte = async () => {
  const suporteEmail = "trazai_shop_suporte@hotmail.com";

  const isAvailable = await MailComposer.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert("Erro", "Nenhum aplicativo de e-mail disponível.");
    return;
  }

  await MailComposer.composeAsync({
    recipients: [suporteEmail],
    subject: "Suporte - App Lojista",
    body:
      `Olá, equipe de suporte.\n\n` +
      `Loja: ${nome}\n` +
      `E-mail da loja: ${loja?.email_login || "Não informado"}\n` +
      `ID da loja: ${loja?.id}\n\n` +
      `Descreva abaixo o problema:\n`,
  });
};


  /* HEADER */
  const HeaderBar = ({ title }: { title: string }) => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
     <TouchableOpacity
  style={styles.menuItem}
  onPress={falarComSuporte}
>
        <Ionicons name="arrow-back" size={24} color="#1f2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} /> 
    </View>
  );

  /* LOAD INICIAL */
  useEffect(() => {
    if (!loja?.id) return;

    const loadAll = async () => {
      try {
        const res = await api.get(`/lojas/${loja.id}`);
        setAceitaEntrega(!!res.data.aceita_entrega);
        setAceitaRetirada(!!res.data.aceita_retirada);
        setNome(res.data.nome_loja || "");
        setTelefone(res.data.telefone_contato || "");
        setEndereco(res.data.endereco_loja || "");
        setLogoAtualUrl(res.data.url_logo || null);

        const mp = await api.get(`/pedidos/loja/${loja.id}/metodos-pagamento`);
        setAceitaPix(!!mp.data.aceita_pix);
        setAceitaCartao(!!mp.data.aceita_cartao);
        setAceitaDinheiro(!!mp.data.aceita_dinheiro);
        setAceitaMaquininha(!!mp.data.aceita_maquininha);
      } catch {
        Alert.alert("Erro", "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [loja?.id]);

  /* ALTERAR LOGO */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) setLogo(result.assets[0]);
  };

  const displayImageUri =
    logo?.uri ||
    (logoAtualUrl
      ? `${ASSET_BASE_URL}/${logoAtualUrl}?t=${Date.now()}`
      : "https://placehold.co/150x150/e2e8f0/e2e8f0?text=Logo");

  const salvarLogo = async () => {
    if (!loja?.id || !logo) return;
    const formData = new FormData();
    const ext = logo.uri.split(".").pop();

    formData.append("logo", {
      uri: Platform.OS === "android" ? logo.uri : logo.uri.replace("file://", ""),
      name: `logo.${ext}`,
      type: `image/${ext}`,
    } as any);

    try {
      await api.put(`/lojas/${loja.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Sucesso", "Logo atualizada com sucesso!");
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o logo.");
    }
  };

  const salvarMetodosPagamento = async () => {
    if (!loja?.id) return;
    try {
      setLoadingPagamentos(true);
      await api.put(`/pedidos/loja/${loja.id}/metodos-pagamento`, {
        aceita_pix: aceitaPix ? 1 : 0,
        aceita_cartao: aceitaCartao ? 1 : 0,
        aceita_dinheiro: aceitaDinheiro ? 1 : 0,
        aceita_maquininha: aceitaMaquininha ? 1 : 0,
        taxa_cartao_stripe: Number(taxaStripe) || 0,
      });
      Alert.alert("Sucesso", "Opções de pagamento atualizadas!");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar os métodos.");
    } finally {
      setLoadingPagamentos(false);
    }
  };

  const salvarEntregaRetirada = async () => {
  if (!loja?.id) return;

  try {
    setLoadingEntrega(true);

    await api.put(`/lojas/${loja.id}/entrega`, {
      aceita_entrega: aceitaEntrega ? 1 : 0,
      aceita_retirada: aceitaRetirada ? 1 : 0,
    });

    Alert.alert("Sucesso", "Configurações de entrega atualizadas!");
  } catch {
    Alert.alert("Erro", "Não foi possível salvar as opções de entrega.");
  } finally {
    setLoadingEntrega(false);
  }
};

  const handleLogout = async () => {
    Alert.alert("Sair da conta", "Deseja realmente encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login" as any);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10, color: "#6b7280" }}>Carregando dados...</Text>
      </View>
    );
  }

  /* STRIPE CONNECT */
const handleConnectStripe = async () => {
  if (!loja?.id || !token) {
    Alert.alert("Erro", "Loja não identificada.");
    return;
  }

  setStripeLoading(true);

  try {
    const res = await api.post(
      "/lojas/criar-link-stripe",
      { id_loja: loja.id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.data?.url) {
      Alert.alert("Erro", "URL do Stripe não recebida.");
      return;
    }

    await Linking.openURL(res.data.url);
  } catch (e: any) {
    console.log("ERRO STRIPE >>>", e?.response?.data || e);
    Alert.alert("Erro", "Não foi possível abrir o Stripe.");
  } finally {
    setStripeLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <HeaderBar title="Configurações da Loja" />

      <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* SEÇÃO LOGO */}
        <View style={styles.sectionCardCentered}>
          <Pressable onPress={pickImage} style={styles.imageWrapper}>
            <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.imageHint}>Toque para alterar a imagem</Text>
          
          {logo && (
            <TouchableOpacity style={styles.saveLogoBtn} onPress={salvarLogo}>
              <Text style={styles.saveLogoBtnText}>Confirmar nova logo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* INFORMAÇÕES GERAIS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>
          <TouchableOpacity onPress={() => router.push("/editar-dados-loja" as any)}>
            <Text style={styles.editLink}>Editar Dados</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color="#6b7280" />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Nome da Loja</Text>
              <Text style={styles.infoValue}>{nome}</Text>
            </View>
          </View>
          
          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#6b7280" />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{telefone}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <View style={styles.infoTextGroup}>
              <Text style={styles.infoLabel}>Endereço</Text>
              <Text style={styles.infoValue}>{endereco}</Text>
            </View>
          </View>
        </View>

       {/* PAGAMENTOS ONLINE (STRIPE) */}
{/* PAGAMENTOS ONLINE (STRIPE) */}
<Text style={styles.sectionTitle}>Pagamentos Online</Text>

<View style={styles.card}>
  <Text style={styles.cardDescription}>
    Receba pagamentos por Cartão de Crédito diretamente no aplicativo
    utilizando a plataforma Stripe, com repasses automáticos.
  </Text>

  <TouchableOpacity
    style={[
      styles.stripeButton,
      stripeLoading && { opacity: 0.6 }
    ]}
    onPress={handleConnectStripe}
    disabled={stripeLoading}
  >
    {stripeLoading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <>
        <Ionicons name="card-outline" size={20} color="#fff" />
        <Text style={styles.stripeButtonText}>
          Configurar Stripe
        </Text>
      </>
    )}
  </TouchableOpacity>

  <Text
    style={{
      marginTop: 10,
      fontSize: 12,
      color: "#6b7280",
      textAlign: "center",
    }}
  >
    Você será redirecionado para o ambiente seguro do Stripe para concluir
    a configuração da sua conta bancária e dados fiscais.
  </Text>
</View>

{/* HORÁRIO DE FUNCIONAMENTO */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => router.push("/horarios-loja" as any)}
>
  <Ionicons name="time-outline" size={22} color="#2563eb" />
  <Text style={styles.menuItemText}>Horário de Funcionamento</Text>
  <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
</TouchableOpacity>

<Text style={styles.sectionTitle}>Entrega e Retirada</Text>

<View style={styles.card}>
  <View style={styles.payRow}>
    <View style={styles.payRowLeft}>
      <View style={[styles.iconCircle, { backgroundColor: '#ecfeff' }]}>
        <Ionicons name="bicycle-outline" size={20} color="#0891b2" />
      </View>
      <Text style={styles.payTextText}>Entrega</Text>
    </View>

    <Switch
      value={aceitaEntrega}
      onValueChange={setAceitaEntrega}
    />
  </View>

  <View style={styles.payRow}>
    <View style={styles.payRowLeft}>
      <View style={[styles.iconCircle, { backgroundColor: '#fefce8' }]}>
        <Ionicons name="walk-outline" size={20} color="#ca8a04" />
      </View>
      <Text style={styles.payTextText}>Retirada no local</Text>
    </View>

    <Switch
      value={aceitaRetirada}
      onValueChange={setAceitaRetirada}
    />
  </View>

  <TouchableOpacity
    style={[styles.saveOptionsBtn, loadingEntrega && { opacity: 0.7 }]}
    onPress={salvarEntregaRetirada}
  >
    <Text style={styles.saveOptionsBtnText}>
      {loadingEntrega ? "Salvando..." : "Salvar Opções"}
    </Text>
  </TouchableOpacity>
</View>

        {/* MÉTODOS DE PAGAMENTO */}
        <Text style={styles.sectionTitle}>Métodos de Pagamento</Text>
        <View style={styles.card}>
          <View style={styles.payRow}>
            <View style={styles.payRowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="qr-code" size={20} color="#16a34a" />
              </View>
              <Text style={styles.payTextText}>Pix</Text>
            </View>
            <Switch 
              value={aceitaPix} 
              onValueChange={setAceitaPix} 
              trackColor={{ false: "#d1d5db", true: "#bbf7d0" }}
              thumbColor={aceitaPix ? "#16a34a" : "#f4f3f4"}
            />
          </View>

          <View style={styles.payRow}>
            <View style={styles.payRowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#fff7ed' }]}>
                <Ionicons name="cash-outline" size={20} color="#ea580c" />
              </View>
              <Text style={styles.payTextText}>Dinheiro na entrega</Text>
            </View>
            <Switch value={aceitaDinheiro} onValueChange={setAceitaDinheiro} />
          </View>

          <View style={styles.payRow}>
            <View style={styles.payRowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#f3f4f6' }]}>
                <Ionicons name="hardware-chip-outline" size={20} color="#4b5563" />
              </View>
              <Text style={styles.payTextText}>Maquininha Própria</Text>
            </View>
            <Switch value={aceitaMaquininha} onValueChange={setAceitaMaquininha} />
          </View>

          <View style={styles.payRow}>
            <View style={styles.payRowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color="#2563eb" />
              </View>
              <Text style={styles.payTextText}>Cartão no App</Text>
            </View>
            <Switch value={aceitaCartao} onValueChange={setAceitaCartao} />
          </View>

          {aceitaCartao && (
            <View style={styles.taxContainer}>
              <Text style={styles.taxLabel}>Taxa de acréscimo para o cliente (%)</Text>
              <TextInput
                style={styles.taxInput}
                value={taxaStripe}
                keyboardType="numeric"
                onChangeText={setTaxaStripe}
                placeholder="Ex: 5"
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.saveOptionsBtn, loadingPagamentos && { opacity: 0.7 }]} 
            onPress={salvarMetodosPagamento}
          >
            <Text style={styles.saveOptionsBtnText}>
              {loadingPagamentos ? "Salvando..." : "Salvar Configurações"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LINKS DE SUPORTE */}
        <Text style={styles.sectionTitle}>Suporte</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/ajuda" as any)}>
          <Ionicons name="help-circle-outline" size={22} color="#16a34a" />
          <Text style={styles.menuItemText}>Central de Ajuda</Text>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`mailto:suporte@exemplo.com`)}>
          <Ionicons name="chatbubbles-outline" size={22} color="#2563eb" />
          <Text style={styles.menuItemText}>Falar com o Suporte</Text>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>

        {/* LOGOUT */}
        <View style={styles.logoutSection}>
           <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={styles.logoutBtnText}>Sair da Conta</Text>
           </TouchableOpacity>
           <Text style={styles.versionText}>TrazAí - Painel Lojista</Text>
        </View>

      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  containerCentered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 60 },

  headerContainer: {
    backgroundColor: "#fff",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  backButton: { width: 40 },
  headerTitle: { fontWeight: "700", fontSize: 17, color: '#1f2937' },

  // Perfil / Logo
  sectionCardCentered: { alignItems: "center", marginBottom: 24 },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#e5e7eb', borderWidth: 3, borderColor: '#fff' },
  cameraIconBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#2563eb', 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff'
  },
  imageHint: { color: "#6b7280", marginTop: 8, fontSize: 13 },
  saveLogoBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginTop: 12 },
  saveLogoBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Cards e Seções
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  sectionTitle: { fontWeight: "700", fontSize: 14, color: "#4b5563", textTransform: 'uppercase', marginBottom: 12, marginTop: 16 },
  editLink: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardDescription: { color: '#6b7280', fontSize: 14, marginBottom: 16, lineHeight: 20 },

  // Itens de Informação
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoTextGroup: { marginLeft: 12 },
  infoLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
  infoDivider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12, marginLeft: 32 },

  saveOptionsBtn: { backgroundColor: "#16a34a", padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveOptionsBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Pagamentos
  payRow: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between', paddingVertical: 12 },
  payRowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  payTextText: { marginLeft: 12, fontWeight: "600", color: '#374151', fontSize: 15 },

  taxContainer: { marginTop: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  taxLabel: { fontSize: 13, fontWeight: "600", color: '#4b5563' },
  taxInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8, fontSize: 16 },

  // Menu de Itens
  menuItem: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
  menuItemText: { flex: 1, marginLeft: 12, fontWeight: '600', color: '#1f2937' },

  // Logout
  logoutSection: { marginTop: 32, alignItems: 'center', paddingBottom: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  logoutBtnText: { color: '#dc2626', fontWeight: '700', marginLeft: 8 },
  versionText: { 
  color: '#9ca3af',
  fontSize: 12,
  marginTop: 16,
},

stripeButton: {
  backgroundColor: "#635BFF",
  paddingVertical: 12,
  borderRadius: 12,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 10,
},

stripeButtonText: {
  color: "#fff",
  fontWeight: "700",
  marginLeft: 8,
  fontSize: 15,
},

});