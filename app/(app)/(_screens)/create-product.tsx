
//app/(app)/(screens)/create-product.tsx

"use client"
import { Appearance } from "react-native";
import { useState, useEffect } from "react"   // ← IMPORTAR useEffect
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
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import api from "../../../src/api/api"
import * as ImagePicker from "expo-image-picker"
import { productCategoriesForForms } from "../../../src/constants/categories"

export default function CreateProductScreen() {

    useEffect(() => {
    Appearance.setColorScheme("light")
  }, [])

  const router = useRouter()
  const { lojaId } = useLocalSearchParams()

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [preco, setPreco] = useState("")
  const [unidade, setUnidade] = useState("UN")
  const [estoque, setEstoque] = useState("")

  const initialCategory = productCategoriesForForms.length > 0 ? productCategoriesForForms[0].id : ""
  const [categoria, setCategoria] = useState(initialCategory)

  const [imagem, setImagem] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
  ]

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted === false) {
      Alert.alert("Atenção", "Você precisa permitir o acesso à galeria para selecionar uma imagem.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })
    if (!result.canceled) {
      setImagem(result.assets[0])
    }
  }

  const handleCreateProduct = async () => {
    if (!nome || !preco || !lojaId || !categoria) {
      Alert.alert("Atenção", "Nome, Preço e Categoria são obrigatórios.")
      return
    }

    setIsSaving(true)

    const formData = new FormData()
    formData.append("id_loja", String(lojaId))
    formData.append("nome", nome)
    formData.append("descricao", descricao)
    formData.append("preco", preco.replace(",", "."))
    formData.append("unidade_de_venda", unidade)
    formData.append("estoque", estoque ? estoque.replace(",", ".") : "0")
    formData.append("categoria", categoria)

    if (imagem) {
      const uri = imagem.uri
      const uriParts = uri.split(".")
      const fileType = uriParts[uriParts.length - 1]

      formData.append("foto", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any)
    }

    try {
      await api.post("/produtos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      Alert.alert("Sucesso!", "Produto cadastrado.", [{ text: "OK", onPress: () => router.back() }])
    } catch (error: any) {
      console.error("Erro ao criar produto:", error.response?.data || error.message)
      const mensagemErro = error.response?.data?.message || "Não foi possível cadastrar o produto."
      Alert.alert("Erro", mensagemErro)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Novo Produto" }} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Adicionar Produto</Text>
            <Text style={styles.subtitulo}>Preencha as informações do novo produto</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagem do Produto</Text>
            <Pressable style={styles.imageUploadArea} onPress={pickImage}>
              {imagem ? (
                <Image source={{ uri: imagem.uri }} style={styles.imagemPreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderIcon}>📷</Text>
                  <Text style={styles.imagePlaceholderText}>Toque para adicionar foto</Text>
                </View>
              )}
            </Pressable>
            {imagem && (
              <Pressable style={styles.changeImageButton} onPress={pickImage}>
                <Text style={styles.changeImageText}>Alterar imagem</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nome do Produto <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Arroz Integral 1kg"
                placeholderTextColor="#999"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva seu produto..."
                placeholderTextColor="#999"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
  <Text style={styles.label}>
    Categoria <Text style={styles.required}>*</Text>
  </Text>
  <View style={styles.pickerContainer}>
    <Picker
      selectedValue={categoria}
      onValueChange={(itemValue) => setCategoria(itemValue as string)}
      style={styles.picker}
      dropdownIconColor="#000"
    >
      {productCategoriesForForms.map((cat) => (
        <Picker.Item 
          key={cat.id} 
          label={cat.name} 
          value={cat.id} 
          color="#000" 
        />
      ))}
    </Picker>
  </View>
</View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preço e Estoque</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>
                  Preço <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>R$</Text>
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    placeholder="0,00"
                    placeholderTextColor="#999"
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
                  placeholder="0"
                  placeholderTextColor="#999"
                  value={estoque}
                  onChangeText={setEstoque}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
  <Text style={styles.label}>
    Unidade de Venda <Text style={styles.required}>*</Text>
  </Text>
  <View style={styles.pickerContainer}>
    <Picker
      selectedValue={unidade}
      onValueChange={(itemValue) => setUnidade(itemValue as string)}
      style={styles.picker}
      dropdownIconColor="#000"
    >
      {unidadeOptions.map((option) => (
        <Picker.Item 
          key={option.value} 
          label={option.label} 
          value={option.value}
          color="#000" 
        />
      ))}
    </Picker>
  </View>
</View>

          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleCreateProduct}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Produto</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },

  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 15,
    color: "#666",
    fontWeight: "400",
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },

  imageUploadArea: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8f8f8",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  imagemPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  changeImageButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  changeImageText: {
    color: "#D80032",
    fontSize: 15,
    fontWeight: "600",
  },

  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  required: {
    color: "#D80032",
  },
  input: {
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#1a1a1a",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#e0e0e0",
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },

  pickerContainer: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
  height: 50,
  width: "100%",
  color: "#000", // ✅ importantíssimo
},

  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#059a05ff",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D80032",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 20,
  },
})
