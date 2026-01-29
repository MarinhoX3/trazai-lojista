"use client";

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import api from "../../../src/api/api";
import { useAuthLoja } from "../../../src/api/contexts/AuthLojaContext";
import { ASSET_BASE_URL } from "../../../src/api/api";

export default function EditarDadosLoja() {
  const router = useRouter();
  const { loja } = useAuthLoja();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [categoria, setCategoria] = useState("");

  const [logoAtual, setLogoAtual] = useState<string | null>(null);
  const [logoNova, setLogoNova] = useState<any>(null);

  const [whatsapps, setWhatsapps] = useState<any[]>([]);

  useEffect(() => {
    if (!loja?.id) return;

    const load = async () => {
      try {
        const res = await api.get(`/lojas/${loja.id}`);
        setNome(res.data.nome_loja || "");
        setTelefone(res.data.telefone_contato || "");
        setEndereco(res.data.endereco_loja || "");
        setCategoria(res.data.categoria || "");
        setLogoAtual(res.data.url_logo || null);

        const zaps = await api.get(`/lojas/${loja.id}/whatsapps`);
        setWhatsapps(zaps.data || []);
      } catch {
        Alert.alert("Erro", "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [loja?.id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) setLogoNova(result.assets[0]);
  };

  const removeWhatsapp = (index: number) => {
    const newList = [...whatsapps];
    newList.splice(index, 1);
    setWhatsapps(newList);
  };

  const addWhatsapp = () => {
    setWhatsapps([
      ...whatsapps,
      { numero_whatsapp: "", descricao: "", nome_vendedor: "", ativo: 1 },
    ]);
  };

  const salvar = async () => {
    if (!loja?.id) return;
    setIsSaving(true);

    const form = new FormData();
    form.append("nome_loja", nome);
    form.append("telefone_contato", telefone);
    form.append("endereco_loja", endereco);
    form.append("categoria", categoria);
    form.append("whatsapps", JSON.stringify(whatsapps));

    if (logoNova) {
      const uri = logoNova.uri;
      const ext = uri.split(".").pop();
      form.append("logo", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: `logo.${ext}`,
        type: `image/${ext}`,
      } as any);
    }

    try {
      await api.put(`/lojas/${loja.id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Sucesso", "Dados atualizados com sucesso!");
      router.back();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Dados</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={120}
          keyboardShouldPersistTaps="handled"
        >
          {/* LOGO */}
          <View style={styles.logoSection}>
            <Pressable onPress={pickImage} style={styles.logoWrapper}>
              <Image
                source={{
                  uri:
                    logoNova?.uri ||
                    (logoAtual
                      ? `${ASSET_BASE_URL}/${logoAtual}`
                      : "https://placehold.co/200"),
                }}
                style={styles.logoImage}
              />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.logoHint}>Toque na imagem para alterar</Text>
          </View>

          {/* INFO */}
          <Text style={styles.sectionTitle}>Informações da Loja</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Loja</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={20} color="#94a3b8" />
                <TextInput style={styles.input} value={nome} onChangeText={setNome} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  value={telefone}
                  onChangeText={setTelefone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Endereço</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#94a3b8" />
                <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} />
              </View>
            </View>
          </View>

          {/* WHATS */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>WhatsApp</Text>
            <TouchableOpacity onPress={addWhatsapp} style={styles.addBtn}>
              <Ionicons name="add-circle" size={20} color="#16a34a" />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {whatsapps.map((w, i) => (
            <View key={i} style={styles.whatsCard}>
              <View style={styles.whatsCardHeader}>
                <Text style={styles.whatsCount}>Contato #{i + 1}</Text>
                <TouchableOpacity onPress={() => removeWhatsapp(i)}>
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.whatsInput}
                value={w.nome_vendedor}
                onChangeText={t => {
                  const c = [...whatsapps];
                  c[i].nome_vendedor = t;
                  setWhatsapps(c);
                }}
                placeholder="Nome do vendedor"
              />

              <TextInput
                style={[styles.whatsInput, { marginTop: 10 }]}
                value={w.numero_whatsapp}
                onChangeText={t => {
                  const c = [...whatsapps];
                  c[i].numero_whatsapp = t;
                  setWhatsapps(c);
                }}
                placeholder="Número"
                keyboardType="phone-pad"
              />

              <TextInput
                style={[styles.whatsInput, { marginTop: 10 }]}
                value={w.descricao}
                onChangeText={t => {
                  const c = [...whatsapps];
                  c[i].descricao = t;
                  setWhatsapps(c);
                }}
                placeholder="Descrição"
              />
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={salvar} disabled={isSaving}>
            <Text style={styles.saveBtnText}>Salvar Alterações</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  containerCentered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  backBtn: { padding: 4 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  logoSection: { alignItems: "center", marginBottom: 30 },
  logoWrapper: { position: "relative" },
  logoImage: { width: 120, height: 120, borderRadius: 20 },
  cameraBadge: { position: "absolute", bottom: -10, right: -10 },
  logoHint: { marginTop: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "700", marginBottom: 12 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600" },
  inputWrapper: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, height: 48 },
  addBtn: { flexDirection: "row", alignItems: "center" },
  addBtnText: { marginLeft: 4 },
  whatsCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
  whatsCardHeader: { flexDirection: "row", justifyContent: "space-between" },
  whatsCount: { fontSize: 12 },
  whatsInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44 },
  saveBtn: { backgroundColor: "#16a34a", height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 30 },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});
