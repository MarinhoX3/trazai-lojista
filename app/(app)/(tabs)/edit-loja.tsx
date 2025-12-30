"use client";

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
  TouchableOpacity,
  Switch,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Linking } from "react-native";

import api, { ASSET_BASE_URL } from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";

export default function EditLojaScreen() {
  const router = useRouter();
  const { loja, token, logout } = useAuthLoja();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [logo, setLogo] = useState<any>(null);
  const [logoAtualUrl, setLogoAtualUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);

  // MÉTODOS DE PAGAMENTO
  const [aceitaPix, setAceitaPix] = useState(true);
  const [aceitaCartao, setAceitaCartao] = useState(true);
  const [aceitaDinheiro, setAceitaDinheiro] = useState(true);
  const [loadingPagamentos, setLoadingPagamentos] = useState(false);

  /* HEADER */
  const HeaderBar = ({ title }: { title: string }) => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );

  /* LOAD INICIAL */
  useEffect(() => {
    if (!loja?.id) return;

    const loadAll = async () => {
      try {
        const res = await api.get(`/lojas/${loja.id}`);

        setNome(res.data.nome_loja || "");
        setTelefone(res.data.telefone_contato || "");
        setEndereco(res.data.endereco_loja || "");
        setPixKey(res.data.pix_key || "");
        setLogoAtualUrl(res.data.url_logo || null);

        // buscar métodos de pagamento
        const mp = await api.get(`/pedidos/loja/${loja.id}/metodos-pagamento`);

        setAceitaPix(!!mp.data.aceita_pix);
        setAceitaCartao(!!mp.data.aceita_cartao);
        setAceitaDinheiro(!!mp.data.aceita_dinheiro);
      } catch {
        Alert.alert("Erro", "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [loja?.id]);

  /* ATUALIZAR MÉTODOS DE PAGAMENTO */
  const salvarMetodosPagamento = async () => {
    if (!loja?.id) return;

    try {
      setLoadingPagamentos(true);

      await api.put(`/pedidos/loja/${loja.id}/metodos-pagamento`, {
        aceita_pix: aceitaPix ? 1 : 0,
        aceita_cartao: aceitaCartao ? 1 : 0,
        aceita_dinheiro: aceitaDinheiro ? 1 : 0,
      });

      Alert.alert("Sucesso", "Opções de pagamento atualizadas!");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar os métodos.");
    } finally {
      setLoadingPagamentos(false);
    }
  };

  /* IMAGEM */
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

  /* ATUALIZAR PERFIL DA LOJA */
  const handleUpdate = async () => {
    if (!loja?.id) return;

    const formData = new FormData();

    formData.append("nome_loja", nome);
    formData.append("telefone_contato", telefone);
    formData.append("endereco_loja", endereco);
    formData.append("pix_key", pixKey);

    if (logo) {
      const ext = logo.uri.split(".").pop();
      formData.append("logo", {
        uri: Platform.OS === "android" ? logo.uri : logo.uri.replace("file://", ""),
        name: `logo.${ext}`,
        type: `image/${ext}`,
      } as any);
    }

    try {
      await api.put(`/lojas/${loja.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Sucesso", "Dados atualizados!");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

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

      await Linking.openURL(res.data.url);
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o Stripe.");
    } finally {
      setStripeLoading(false);
    }
  };

  /* SUPORTE */
  const handleContactSupport = async () => {
    const email = "trazai_shop@outlook.com";
    const subject = "Suporte - App Lojista TRAZAÍ";

    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      await Linking.openURL(mailto);
    } catch {
      Alert.alert("Suporte", `Envie e-mail para: ${email}`);
    }
  };

  /* LOGOUT */
  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/" as any);
        },
      },
    ]);
  };

  /* LOADING */
  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* RENDER */
  return (
    <View style={styles.container}>
      <HeaderBar title="Configurações da Loja" />

      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
        {/* LOGO */}
        <Pressable onPress={pickImage} style={styles.imageContainer}>
          <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
          <Text style={styles.imagePickerText}>Tocar para alterar o logo</Text>
        </Pressable>

        {/* CAMPOS */}
        <Text style={styles.label}>Nome da Loja</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>Telefone</Text>
        <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} />

        <Text style={styles.label}>Endereço</Text>
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} multiline />

        <Text style={styles.label}>Chave PIX</Text>
        <TextInput style={styles.input} value={pixKey} onChangeText={setPixKey} />

        <Button title="Salvar Alterações" onPress={handleUpdate} />

        {/* PAGAMENTOS ONLINE */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Pagamentos Online</Text>

        <Button
          title={stripeLoading ? "Aguarde..." : "Configurar Pagamentos"}
          color="#6772E5"
          onPress={handleConnectStripe}
          disabled={stripeLoading}
        />

        {/* MÉTODOS DE PAGAMENTO ACEITOS */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Métodos aceitos no app</Text>

        <View style={styles.payBox}>
          <View style={styles.payRow}>
            <Ionicons name="qr-code-outline" size={22} color="#16A34A" />
            <Text style={styles.payText}>Pix</Text>
            <Switch value={aceitaPix} onValueChange={setAceitaPix} />
          </View>

          <View style={styles.payRow}>
            <Ionicons name="card-outline" size={22} />
            <Text style={styles.payText}>Cartão no aplicativo</Text>
            <Switch value={aceitaCartao} onValueChange={setAceitaCartao} />
          </View>

          <View style={styles.payRow}>
            <Ionicons name="cash-outline" size={22} />
            <Text style={styles.payText}>Dinheiro na entrega</Text>
            <Switch value={aceitaDinheiro} onValueChange={setAceitaDinheiro} />
          </View>

          <Button
            title={loadingPagamentos ? "Salvando..." : "Salvar opções"}
            onPress={salvarMetodosPagamento}
            color="#16A34A"
          />
        </View>

        {/* AJUDA */}
        <TouchableOpacity style={styles.helpButton} onPress={() => router.push("/ajuda" as any)}>
          <Ionicons name="help-circle-outline" size={24} color="#16A34A" />
          <Text style={styles.helpButtonText}>Central de Ajuda</Text>
        </TouchableOpacity>

        {/* SUPORTE */}
        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <Ionicons name="mail-outline" size={24} color="#2563EB" />
          <Text style={styles.supportButtonText}>Falar com Suporte</Text>
        </TouchableOpacity>

        {/* LOGOUT */}
        <View style={styles.logoutButtonContainer}>
          <Button title="Sair (Logout)" color="red" onPress={handleLogout} />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

/* ESTILOS */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  containerCentered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  headerContainer: {
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingBottom: 10,
    alignItems: "center",
  },
  backButton: { position: "absolute", left: 15, top: 50 },
  headerTitle: { fontWeight: "700", fontSize: 18 },

  imageContainer: { alignItems: "center", marginBottom: 15 },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
  imagePickerText: { color: "#007BFF", marginTop: 6 },

  label: { fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 10, marginBottom: 10 },

  divider: { marginVertical: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  sectionTitle: { fontWeight: "700", fontSize: 17, marginBottom: 10 },

  payBox: { backgroundColor: "#F9FAFB", padding: 12, borderRadius: 14, gap: 10 },
  payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  payText: { flex: 1, marginLeft: 8, fontWeight: "500" },

  helpButton: { marginTop: 15, flexDirection: "row", gap: 8, padding: 12, backgroundColor: "#F0FDF4", borderRadius: 12 },
  helpButtonText: { color: "#16A34A", fontWeight: "600" },

  supportButton: { marginTop: 10, flexDirection: "row", gap: 8, padding: 12, backgroundColor: "#EFF6FF", borderRadius: 12 },
  supportButtonText: { color: "#2563EB", fontWeight: "600" },

  logoutButtonContainer: { marginTop: 20 },
});
