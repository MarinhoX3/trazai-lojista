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
  Modal,
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

/* =======================================================
   TIPOS
======================================================= */
type WhatsappEntry = {
  id?: number;
  numero_whatsapp: string;
  nome_vendedor?: string | null;
  descricao?: string | null;
  ativo?: 0 | 1;
};

/* =======================================================
   COMPONENTE
======================================================= */
export default function EditLojaScreen() {
  const router = useRouter();
  const { loja, token, logout } = useAuthLoja();

  /* -------- ESTADOS LOJA -------- */
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [logoAtualUrl, setLogoAtualUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);

  /* -------- WHATSAPP -------- */
  const [whatsapps, setWhatsapps] = useState<WhatsappEntry[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const [modalWaVisible, setModalWaVisible] = useState(false);
  const [waEditing, setWaEditing] = useState<WhatsappEntry | null>(null);
  const [waNumero, setWaNumero] = useState("");
  const [waNomeVendedor, setWaNomeVendedor] = useState("");
  const [waDescricao, setWaDescricao] = useState("");
  const [waAtivo, setWaAtivo] = useState(true);
  const [savingWa, setSavingWa] = useState(false);
  const [originalWaNumero, setOriginalWaNumero] = useState("");

  /* =======================================================
     HEADER
  ======================================================= */
  const HeaderBar = ({ title }: { title: string }) => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );

  /* =======================================================
     LOAD INICIAL
  ======================================================= */
  useEffect(() => {
    if (!loja?.id) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      try {
        const res = await api.get(`/lojas/${loja.id}`);
        setNome(res.data.nome_loja || "");
        setTelefone(res.data.telefone_contato || "");
        setEndereco(res.data.endereco_loja || "");
        setPixKey(res.data.pix_key || "");
        setLogoAtualUrl(res.data.url_logo || null);

        setWaLoading(true);
        const wa = await api.get(`/lojas/${loja.id}/whatsapps`);
        setWhatsapps(Array.isArray(wa.data) ? wa.data : []);
      } catch {
        Alert.alert("Erro", "Não foi possível carregar os dados.");
      } finally {
        setWaLoading(false);
        setLoading(false);
      }
    };

    loadAll();
  }, [loja?.id]);

  /* =======================================================
     IMAGEM
  ======================================================= */
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

  /* =======================================================
     ATUALIZAR LOJA
  ======================================================= */
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
      setLoading(true);
      await api.put(`/lojas/${loja.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Sucesso", "Dados atualizados!");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     STRIPE
  ======================================================= */
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

      if (!res.data?.url) throw new Error();

      await Linking.openURL(res.data.url);
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o Stripe.");
    } finally {
      setStripeLoading(false);
    }
  };

  /* =======================================================
     SUPORTE
  ======================================================= */
  const handleContactSupport = async () => {
    const email = "trazai_shop@outlook.com";
    const subject = "Suporte - App Lojista TRAZAÍ";
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      await Linking.openURL(mailto);
    } catch {
      Alert.alert("Suporte", `Entre em contato: ${email}`);
    }
  };

  /* =======================================================
     LOGOUT (CORRIGIDO)
  ======================================================= */
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

  /* =======================================================
     RENDER
  ======================================================= */
  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar title="Configurações da Loja" />

      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={pickImage} style={styles.imageContainer}>
          <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
          <Text style={styles.imagePickerText}>Tocar para alterar o logo</Text>
        </Pressable>

        <Text style={styles.label}>Nome da Loja</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>Telefone</Text>
        <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} />

        <Text style={styles.label}>Endereço</Text>
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} multiline />

        <Text style={styles.label}>Chave PIX</Text>
        <TextInput style={styles.input} value={pixKey} onChangeText={setPixKey} />

        <Button title="Salvar Alterações" onPress={handleUpdate} />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Pagamentos Online</Text>
        <Button
          title={stripeLoading ? "Aguarde..." : "Configurar Pagamentos"}
          onPress={handleConnectStripe}
          disabled={stripeLoading}
          color="#6772E5"
        />

        <TouchableOpacity style={styles.helpButton} onPress={() => router.push("/ajuda" as any)}>
          <Ionicons name="help-circle-outline" size={24} color="#16A34A" />
          <Text style={styles.helpButtonText}>Central de Ajuda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <Ionicons name="mail-outline" size={24} color="#2563EB" />
          <Text style={styles.supportButtonText}>Falar com Suporte</Text>
        </TouchableOpacity>

        <View style={styles.logoutButtonContainer}>
          <Button title="Sair (Logout)" color="red" onPress={handleLogout} />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

/* =======================================================
   ESTILOS
======================================================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  containerCentered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  headerContainer: {
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  backButton: { position: "absolute", left: 15, top: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 50 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
  imagePickerText: { color: "#007BFF", marginTop: 4 },
  label: { fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#eee", marginVertical: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  helpButton: { flexDirection: "row", padding: 12, backgroundColor: "#F0FDF4", borderRadius: 12, marginTop: 18 },
  helpButtonText: { marginLeft: 12, color: "#16A34A", fontWeight: "600" },
  supportButton: { flexDirection: "row", padding: 12, backgroundColor: "#EFF6FF", borderRadius: 12, marginTop: 12 },
  supportButtonText: { marginLeft: 12, color: "#2563EB", fontWeight: "600" },
  logoutButtonContainer: { marginTop: 20 },
});
