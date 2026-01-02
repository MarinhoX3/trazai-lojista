"use client";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Appearance, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text,
  TextInput, View
} from "react-native";
import api, { ASSET_BASE_URL } from "../../../src/api/api";
import { productCategoriesForForms } from "../../../src/constants/categories";

export default function EditProductScreen() {

  useEffect(() => {
    Appearance.setColorScheme("light");
  }, []);

  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [estoque, setEstoque] = useState("");

  const [categoria, setCategoria] = useState("");

  const [imagem, setImagem] = useState<any>(null);
  const [imagemExistente, setImagemExistente] = useState<string | null>(null);

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

// 🔢 limpa estoque (sem 10.000)
const normalizeEstoque = useCallback((value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";

  const valueString = String(value);

  // remove tudo que não é número
  const cleanedDigits = valueString.replace(/[^0-9]/g, "");

  if (!cleanedDigits) return "";

  const numericValue = Number.parseInt(cleanedDigits, 10);

  // 👉 regra antiga que estava funcionando
  // se vier 2000, 3000, 10000 etc
  // significa 2, 3, 10
  if (numericValue >= 1000 && numericValue % 1000 === 0) {
    return String(numericValue / 1000);
  }

  return String(numericValue);
}, []);


  // =========================================
  // BUSCAR PRODUTO
  // =========================================
  const fetchProduct = useCallback(async () => {
    try {
      const res = await api.get(`/produtos/${id}`);
      const p = res.data;

      setNome(p.nome || "");
      setDescricao(p.descricao || "");
      setPreco(String(p.preco || ""));
      setUnidade(p.unidade_de_venda || "UN");

      // limpa estoque recebido
      setEstoque(normalizeEstoque(String(p.estoque ?? "")));

      setCategoria(p.categoria || "");

      // FOTO CORRIGIDA
      if (p.foto) {
        setImagemExistente(
          `${ASSET_BASE_URL}/${p.foto}?t=${Date.now()}`
        );
      } else {
        setImagemExistente(null);
      }

    } catch (e) {
      console.log(e);
      Alert.alert("Erro", "Não foi possível carregar o produto.");
    }
  }, [id, normalizeEstoque]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // =========================================
  // IMAGE PICKER
  // =========================================
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Atenção", "Permita acesso a imagens.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImagem(result.assets[0]);
    }
  };

  // =========================================
  // SALVAR
  // =========================================
  const handleSave = async () => {
    if (!nome || !preco || !categoria) {
      Alert.alert("Atenção", "Nome, preço e categoria são obrigatórios.");
      return;
    }

    setIsSaving(true);

    const form = new FormData();

    form.append("nome", nome);
    form.append("descricao", descricao);
    form.append("preco", preco.replace(",", "."));
    form.append("unidade_de_venda", unidade);

    // 📌 estoque limpo corretamente
    form.append("estoque", normalizeEstoque(estoque) || "0");

    form.append("categoria", categoria);

    if (imagem) {
      form.append("foto", {
        uri: Platform.OS === "android" ? imagem.uri : imagem.uri.replace("file://", ""),
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);
    }

    try {
      await api.put(`/produtos/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Sucesso", "Produto atualizado!", [
        { text: "OK", onPress: () => router.back() },
      ]);

    } catch (e: any) {
      console.log(e?.response?.data || e);
      Alert.alert("Erro", "Não foi possível atualizar o produto.");
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================
  // DELETE
  // =========================================
  const handleDelete = async () => {
    Alert.alert("Excluir Produto", "Tem certeza?", [
      { text: "Cancelar" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/produtos/${id}`);
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Editar Produto" }} />

        <ScrollView contentContainerStyle={styles.scrollContent}>

          <View style={styles.header}>
            <Text style={styles.titulo}>Editar Produto</Text>
            <Text style={styles.subtitulo}>Atualize as informações do produto</Text>
          </View>

          {/* IMAGEM */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagem do Produto</Text>

            <Pressable style={styles.imageUploadArea} onPress={pickImage}>
              {imagem ? (
                <Image source={{ uri: imagem.uri }} style={styles.imagemPreview} />
              ) : imagemExistente ? (
                <Image source={{ uri: imagemExistente }} style={styles.imagemPreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderIcon}>📷</Text>
                  <Text style={styles.imagePlaceholderText}>Toque para trocar imagem</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* CAMPOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={descricao}
                multiline
                onChangeText={setDescricao}
              />
            </View>

            <View style={styles.row}>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Preço *</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>R$</Text>
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    value={preco}
                    onChangeText={setPreco}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Estoque</Text>
                <TextInput
  style={styles.input}
  value={estoque}
  keyboardType="numeric"
  onChangeText={(v) => setEstoque(normalizeEstoque(v))}
/>

              </View>

            </View>

            {/* Categoria */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoria *</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={categoria} onValueChange={setCategoria}>
                  {productCategoriesForForms.map((c) => (
                    <Picker.Item key={c.id} label={c.name} value={c.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Unidade */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unidade *</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={unidade} onValueChange={setUnidade}>
                  {unidadeOptions.map((u) => (
                    <Picker.Item key={u.value} label={u.label} value={u.value} />
                  ))}
                </Picker>
              </View>
            </View>

          </View>

          <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Excluir Produto</Text>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}


// === estilos iguais do formulário de criação ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { paddingHorizontal: 16 },
  header: { paddingTop: 20, paddingBottom: 24 },
  titulo: { fontSize: 28, fontWeight: "700", color: "#1a1a1a" },
  subtitulo: { color: "#666" },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "600", marginBottom: 12 },
  imageUploadArea: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ddd",
    overflow: "hidden",
  },
  imagemPreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imagePlaceholderIcon: { fontSize: 48 },
  imagePlaceholderText: { color: "#777" },
  inputGroup: { marginBottom: 12 },
  label: { fontWeight: "600" },
  input: { borderRadius: 10, backgroundColor: "#fff", padding: 12, borderWidth: 1, borderColor: "#ddd" },
  textArea: { height: 100 },
  row: { flexDirection: "row", gap: 12 },
  halfWidth: { flex: 1 },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingLeft: 10,
  },
  currencySymbol: { fontWeight: "700" },
  priceInput: { flex: 1, borderWidth: 0 },
  pickerContainer: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, overflow: "hidden" },
  picker: { height: 50 },
  saveButton: {
    backgroundColor: "#04b307ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 1,
  },
  saveButtonText: { color: "#fff", fontWeight: "700" },
  deleteButton: {
    backgroundColor: "#c62828ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  deleteButtonText: { color: "#fff", fontWeight: "700" },
});
