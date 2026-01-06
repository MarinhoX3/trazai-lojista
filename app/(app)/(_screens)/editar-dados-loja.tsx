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

  /* 🔄 CARREGAR DADOS EXISTENTES */
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
      } catch (err) {
        Alert.alert("Erro", "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [loja?.id]);

  /* IMAGEM */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) setLogoNova(result.assets[0]);
  };

  /* REMOVER WHATSAPP DA LISTA */
  const removeWhatsapp = (index: number) => {
    const newList = [...whatsapps];
    newList.splice(index, 1);
    setWhatsapps(newList);
  };

  /* ADICIONAR NOVO WHATSAPP */
  const addWhatsapp = () => {
    setWhatsapps([...whatsapps, { numero_whatsapp: "", descricao: "", ativo: 1 }]);
  };

  /* SALVAR */
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
    } catch (err) {
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
      >
        {/* LOGO SELECTION */}
        <View style={styles.logoSection}>
          <Pressable onPress={pickImage} style={styles.logoWrapper}>
            <Image
              source={{
                uri: logoNova?.uri || (logoAtual ? `${ASSET_BASE_URL}/${logoAtual}` : "https://placehold.co/200")
              }}
              style={styles.logoImage}
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.logoHint}>Toque na imagem para alterar</Text>
        </View>

        {/* FORMULÁRIO PRINCIPAL */}
        <Text style={styles.sectionTitle}>Informações da Loja</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Loja</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={nome} 
                onChangeText={setNome} 
                placeholder="Ex: Pizzaria do João" 
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone Principal</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={telefone} 
                onChangeText={setTelefone} 
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço Completo</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={endereco} 
                onChangeText={setEndereco} 
                placeholder="Rua, Número, Bairro, Cidade" 
              />
            </View>
          </View>
        </View>

        {/* GESTÃO DE WHATSAPP */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Números de WhatsApp</Text>
          <TouchableOpacity onPress={addWhatsapp} style={styles.addBtn}>
            <Ionicons name="add-circle" size={20} color="#16a34a" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {whatsapps.length === 0 && (
          <View style={styles.emptyWhatsCard}>
            <Text style={styles.emptyWhatsText}>Nenhum WhatsApp cadastrado.</Text>
          </View>
        )}

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
              value={w.numero_whatsapp}
              onChangeText={txt => {
                const c = [...whatsapps]; c[i].numero_whatsapp = txt; setWhatsapps(c);
              }}
              placeholder="Número (com DDD)"
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.whatsInput, { marginTop: 10 }]}
              value={w.descricao}
              onChangeText={txt => {
                const c = [...whatsapps]; c[i].descricao = txt; setWhatsapps(c);
              }}
              placeholder="Descrição (Ex: Vendas, Suporte...)"
            />
          </View>
        ))}

        {/* BOTÃO SALVAR */}
        <TouchableOpacity 
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
          onPress={salvar}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>

      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  containerCentered: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  backBtn: { padding: 4 },

  scrollContent: { padding: 20, paddingBottom: 60 },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 30 },
  logoWrapper: { position: 'relative', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  logoImage: { width: 120, height: 120, borderRadius: 20, backgroundColor: '#fff', borderWidth: 3, borderColor: '#fff' },
  cameraBadge: { position: 'absolute', bottom: -10, right: -10, backgroundColor: '#2563eb', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#f8fafc' },
  logoHint: { marginTop: 15, fontSize: 13, color: '#64748b', fontWeight: '500' },

  // Form
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, fontSize: 15, color: '#1e293b' },

  // WhatsApp List
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  addBtnText: { marginLeft: 4, color: '#16a34a', fontWeight: '700', fontSize: 13 },
  
  whatsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  whatsCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  whatsCount: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  whatsInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 14 },
  
  emptyWhatsCard: { padding: 20, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  emptyWhatsText: { color: '#64748b', fontSize: 14 },

  // Buttons
  saveBtn: { backgroundColor: "#16a34a", height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, elevation: 2 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: { marginTop: 15, padding: 15, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 15 }
});