"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Pressable,
  Platform,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Appearance,
  KeyboardAvoidingView, // Importado
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importações de API e Constantes
import api from "../../../src/api/api";
import { productCategoriesForForms } from "../../../src/constants/categories";

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lojaId } = useLocalSearchParams();

  useEffect(() => {
    Appearance.setColorScheme("light");
  }, []);

  // ESTADOS DO PRODUTO
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [estoque, setEstoque] = useState("");
  
  const initialCategory = productCategoriesForForms.length > 0 ? productCategoriesForForms[0].id : "";
  const [categoria, setCategoria] = useState(initialCategory);

  const [imagem, setImagem] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const unidadeOptions = [
    { label: "UN - Unidade", value: "UN" },
    { label: "KG - Quilograma", value: "KG" },
    { label: "G - Grama", value: "G" },
    { label: "L - Litro", value: "L" },
    { label: "ML - Mililitro", value: "ML" },
    { label: "CX - Caixa", value: "CX" },
    { label: "PCT - Pacote", value: "PCT" },
    { label: "DZ - Dúzia", value: "DZ" },
    { label: "M - Metro", value: "M" },
    { label: "CM - Centímetro", value: "CM" },
  ];

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Atenção", "Precisa de permitir o acesso à galeria para selecionar uma imagem.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImagem(result.assets[0]);
    }
  };

  const handleCreateProduct = async () => {
    if (!nome || !preco || !lojaId || !categoria) {
      Alert.alert("Atenção", "Nome, Preço e Categoria são campos obrigatórios.");
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append("id_loja", String(lojaId));
    formData.append("nome", nome);
    formData.append("descricao", descricao);
    formData.append("preco", preco.replace(",", "."));
    formData.append("unidade_de_venda", unidade);
    formData.append("estoque", estoque ? estoque.replace(",", ".") : "0");
    formData.append("categoria", categoria);

    if (imagem) {
      const uri = imagem.uri;
      const ext = uri.split(".").pop();
      formData.append("foto", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: `photo.${ext}`,
        type: `image/${ext}`,
      } as any);
    }

    try {
      await api.post("/produtos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Sucesso!", "Produto registado com sucesso.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Não foi possível registar o produto.";
      Alert.alert("Erro", msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* CABEÇALHO PERSONALIZADO */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Novo Produto</Text>
          <Text style={styles.headerSubtitle}>Inventário da Loja</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* KeyboardAvoidingView adicionado aqui para envolver o conteúdo editável */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20} // Ajuste conforme necessário para Android
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Permite clicar no botão salvar mesmo com teclado aberto
        >
          {/* CARTÃO DE IMAGEM */}
          <View style={styles.imageSection}>
            <Pressable style={styles.imageUploadArea} onPress={pickImage}>
              {imagem ? (
                <Image source={{ uri: imagem.uri }} style={styles.imagemPreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.imageIconCircle}>
                    <Ionicons name="camera-outline" size={32} color="#94a3b8" />
                  </View>
                  <Text style={styles.imagePlaceholderText}>Adicionar Foto</Text>
                </View>
              )}
              <View style={styles.imageBadge}>
                <Ionicons name={imagem ? "pencil" : "add"} size={16} color="#fff" />
              </View>
            </Pressable>
          </View>

          {/* SECÇÃO 1: DADOS BÁSICOS */}
          <Text style={styles.sectionLabel}>Informações Principais</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Produto <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Hambúrguer Artesanal"
                placeholderTextColor="#94a3b8"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva os ingredientes ou detalhes do produto..."
                placeholderTextColor="#94a3b8"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoria <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={categoria}
                  onValueChange={(itemValue) => setCategoria(itemValue as string)}
                  style={styles.picker}
                >
                  {productCategoriesForForms.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* SECÇÃO 2: VALORES E STOCK */}
          <Text style={styles.sectionLabel}>Financeiro e Inventário</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Preço <Text style={styles.required}>*</Text></Text>
                <View style={styles.adornedInput}>
                  <Text style={styles.adornment}>R$</Text>
                  <TextInput
                    style={styles.inputClean}
                    placeholder="0,00"
                    placeholderTextColor="#94a3b8"
                    value={preco}
                    onChangeText={setPreco}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Stock Inicial</Text>
                <View style={styles.adornedInput}>
                  <Ionicons name="cube-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.inputClean}
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                    value={estoque}
                    onChangeText={setEstoque}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unidade de Venda <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={unidade}
                  onValueChange={(itemValue) => setUnidade(itemValue as string)}
                  style={styles.picker}
                >
                  {unidadeOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* BOTÃO SALVAR */}
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && { opacity: 0.7 }]} 
            onPress={handleCreateProduct}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Registar Produto</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
  backBtn: { padding: 4 },

  scrollContent: { padding: 20 },

  imageSection: { alignItems: 'center', marginBottom: 24 },
  imageUploadArea: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible'
  },
  imagePlaceholder: { alignItems: 'center' },
  imageIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  imagePlaceholderText: { fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' },
  imagemPreview: { width: '100%', height: '100%', borderRadius: 70, resizeMode: 'cover' },
  imageBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#2563eb',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f8fafc'
  },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 18, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, marginLeft: 2 },
  required: { color: '#ef4444' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, color: '#1e293b' },
  textArea: { height: 100, paddingTop: 12 },
  
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  
  adornedInput: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    height: 50 
  },
  adornment: { fontSize: 15, fontWeight: '700', color: '#94a3b8', marginRight: 8 },
  inputClean: { flex: 1, height: 50, fontSize: 15, color: '#1e293b', fontWeight: '600' },
  
  pickerContainer: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
  picker: { height: 50, width: '100%', color: '#1e293b' },

  saveButton: { 
    backgroundColor: '#16a34a', 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginTop: 10
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});