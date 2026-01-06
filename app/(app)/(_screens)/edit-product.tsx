"use client";

import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Appearance,
  GestureResponderEvent,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Importações de API e Constantes
import api, { ASSET_BASE_URL } from "../../../src/api/api";
import { productCategoriesForForms } from "../../../src/constants/categories";

export default function EditProductScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    Appearance.setColorScheme("light");
  }, []);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [estoque, setEstoque] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagem, setImagem] = useState<any>(null);
  const [imagemExistente, setImagemExistente] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [ativo, setAtivo] = useState<boolean>(true);

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

  // 🔢 Normaliza o valor de stock para o formato esperado
  const normalizeEstoque = useCallback((value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    const valueString = String(value);
    const cleanedDigits = valueString.replace(/[^0-9]/g, "");
    if (!cleanedDigits) return "";
    const numericValue = Number.parseInt(cleanedDigits, 10);
    
    // Regra para lidar com valores multiplicados por 1000 da API
    if (numericValue >= 1000 && numericValue % 1000 === 0) {
      return String(numericValue / 1000);
    }
    return String(numericValue);
  }, []);

  // 🔄 Procura os dados do produto na API
  const fetchProduct = useCallback(async () => {
    try {
      const res = await api.get(`/produtos/${id}`);
      const p = res.data;
      
      setNome(p.nome || "");
      setDescricao(p.descricao || "");
      setPreco(String(p.preco || ""));
      setUnidade(p.unidade_de_venda || "UN");
      setEstoque(normalizeEstoque(String(p.estoque ?? "")));
      setCategoria(p.categoria || "");
      
      // ✅ Correção Crucial: Normaliza o estado ativo vindo da API
      // Aceita 1, "1", true ou "true" para definir como ativo

const statusAtivo =
  p?.ativo == 1 ||
  p?.ativo === true;

setAtivo(statusAtivo);

console.log("API ativo =>", p.ativo, typeof p.ativo);

      if (p.foto) {
        setImagemExistente(`${ASSET_BASE_URL}/${p.foto}?t=${Date.now()}`);
      } else {
        setImagemExistente(null);
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os dados do produto.");
    }
  }, [id, normalizeEstoque]);

    useEffect(() => {
  fetchProduct();
}, [fetchProduct]);

  // 📷 Seleção de imagem da galeria
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Atenção", "Precisamos de permissão para aceder às suas fotos.");
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

  // 💾 Guarda as alterações do produto
 const handleToggleStatus = async () => {
  try {
    const novoStatus = !ativo; // inverte o estado atual

    await api.put(`/produtos/${id}`, {
      ativo: novoStatus ? 1 : 0,
    });

    setAtivo(novoStatus);

    Alert.alert(
      "Status do produto",
      novoStatus ? "Produto ativado com sucesso!" : "Produto inativado com sucesso!"
    );

  } catch (e) {
    Alert.alert(
      "Erro",
      "Não foi possível alterar o estado do produto."
    );
  }
};

  // 🗑️ Elimina o produto
  const handleDelete = async () => {
    Alert.alert("Eliminar Produto", "Tem a certeza que deseja apagar este produto permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/produtos/${id}`);
            router.back();
          } catch (e) {
            Alert.alert("Erro", "Falha ao eliminar o produto.");
          }
        },
      },
    ]);
  };


  function handleSave(event: GestureResponderEvent): void {
    throw new Error("Function not implemented.");
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER PERSONALIZADO */}
      <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Produto</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerDeleteBtn}>
          <Ionicons name="trash-outline" size={22} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECÇÃO DE IMAGEM */}
        <View style={styles.imageCard}>
          <Pressable style={styles.imageArea} onPress={pickImage}>
            {imagem ? (
              <Image source={{ uri: imagem.uri }} style={styles.image} />
            ) : imagemExistente ? (
              <Image source={{ uri: imagemExistente }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#94a3b8" />
                <Text style={styles.imagePlaceholderText}>Adicionar Foto</Text>
              </View>
            )}
            <View style={styles.imageBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </Pressable>
        </View>

        {/* INFORMAÇÕES GERAIS */}
        <Text style={styles.sectionLabel}>Dados do Produto</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Produto *</Text>
            <TextInput 
              style={styles.input} 
              value={nome} 
              onChangeText={setNome} 
              placeholder="Ex: Hambúrguer Artesanal"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descricao}
              multiline
              numberOfLines={4}
              onChangeText={setDescricao}
              placeholder="Detalhes sobre ingredientes, peso, etc..."
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* VALORES E STOCK */}
        <Text style={styles.sectionLabel}>Financeiro e Stock</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Preço de Venda *</Text>
              <View style={styles.adornedInput}>
                <Text style={styles.adornment}>R$</Text>
                <TextInput
                  style={styles.inputClean}
                  value={preco}
                  onChangeText={setPreco}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Stock Atual</Text>
              <View style={styles.adornedInput}>
                <Ionicons name="cube-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.inputClean}
                  value={estoque}
                  keyboardType="numeric"
                  onChangeText={(v) => setEstoque(normalizeEstoque(v))}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unidade de Medida *</Text>
            <View style={styles.pickerContainer}>
              <Picker 
                selectedValue={unidade} 
                onValueChange={setUnidade}
                style={styles.picker}
              >
                {unidadeOptions.map((u) => (
                  <Picker.Item key={u.value} label={u.label} value={u.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* ORGANIZAÇÃO NO MENU */}
        <Text style={styles.sectionLabel}>Classificação</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria no Menu *</Text>
            <View style={styles.pickerContainer}>
              <Picker 
                selectedValue={categoria} 
                onValueChange={setCategoria}
                style={styles.picker}
              >
                {productCategoriesForForms.map((c) => (
                  <Picker.Item key={c.id} label={c.name} value={c.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* BOTÕES DE AÇÃO */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.mainBtn, isSaving && { opacity: 0.7 }]} 
            onPress={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.mainBtnText}>Guardar Alterações</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusBtn, 
              { borderColor: ativo ? "#e2e8f0" : "#dcfce7", backgroundColor: ativo ? "#fff" : "#f0fdf4" }
            ]}
            onPress={handleToggleStatus}
          >
            <Ionicons 
              name={ativo ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={ativo ? "#64748b" : "#16a34a"} 
            />
            <Text style={[styles.statusBtnText, { color: ativo ? "#64748b" : "#16a34a" }]}>
              {ativo ? "Inativar Produto" : "Ativar Produto"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  backBtn: { padding: 4 },
  headerDeleteBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 10 },

  scrollContent: { padding: 20 },

  // Secção de Imagem
  imageCard: { alignItems: 'center', marginBottom: 24 },
  imageArea: {
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
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: { width: '100%', height: '100%', borderRadius: 70 },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 4 },
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

  // Estilo dos Cartões
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  
  // Inputs
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, marginLeft: 2 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, color: '#1e293b' },
  textArea: { height: 100, paddingTop: 12 },
  row: { flexDirection: 'row' },
  
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

  // Botões
  actionSection: { marginTop: 10 },
  mainBtn: { 
    backgroundColor: '#16a34a', 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 16, 
    height: 50, 
    borderRadius: 16, 
    borderWidth: 1.5,
    backgroundColor: '#fff'
  },
  statusBtnText: { marginLeft: 8, fontWeight: '700', fontSize: 14 }
});