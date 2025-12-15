"use client"

import { Picker } from "@react-native-picker/picker"
import * as ImagePicker from "expo-image-picker"
import { Image } from "react-native"
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import api from "../../../src/api/api"
import { productCategoriesForForms } from "../../../src/constants/categories"

// ====================================================================
// COMPONENTE DE EDIÇÃO DE PRODUTO
// ====================================================================

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<Record<string, string>>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [preco, setPreco] = useState("")
  const [estoque, setEstoque] = useState("")
  const [unidade, setUnidade] = useState("UN")
  const [categoria, setCategoria] = useState("")
  const [novaImagem, setNovaImagem] = useState<any>(null)
  const [imagemExistente, setImagemExistente] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ====================================================================
  // LIMPA NÚMEROS (ESTOQUE) - AJUSTADA PARA CORRIGIR ERRO DE MILHAR
  // ====================================================================
  const cleanNumberString = useCallback((value: string | number | null | undefined) => {
    if (value === null || value === undefined) return ""

    const valueString = String(value)

    // 1. Remove TUDO que não é dígito (0-9). (Ex: "1.000" vira "1000")
    const cleanedDigits = valueString.replace(/[^0-9]/g, "")

    if (!cleanedDigits) return "" // Retorna vazio se não houver dígitos

    const numericValue = Number.parseInt(cleanedDigits, 10)

    // 2. TRATAMENTO DE MILHAR (Corrige o bug de 1.000 virar 1000):
    // Se o valor limpo for 4 dígitos ou mais E for divisível por 1000
    // (ex: 1000, 2000, 5000), assumimos que é um erro de formatação de milhar
    // vindo do backend e dividimos por 1000.
    if (numericValue >= 1000 && numericValue % 1000 === 0) {
        const dividedValue = numericValue / 1000
        return String(dividedValue) // Retorna "1", "2", "5", etc.
    }
    
    // 3. Caso contrário, retorna o valor limpo original (Ex: 125, 999)
    return String(numericValue)
  }, []) // cleanNumberString é um useCallback agora, embora raramente necessário aqui

  // ====================================================================
  // CARREGA PRODUTO (Refatorado para useCallback)
  // ====================================================================
  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/produtos/${id}`)
      const product = response.data

      setNome(product.nome || "")
      setDescricao(product.descricao || "")
      setPreco(String(product.preco || ""))
      
      // Aplica a função de limpeza na inicialização para corrigir o formato do estoque
      setEstoque(cleanNumberString(product.estoque)); 
      
      setUnidade(product.unidade_de_venda || "UN")
      setCategoria(product.categoria || "")

      if (product.foto) {
        const timestamp = new Date().getTime()
        // URL Corrigida (sem uploads/uploads/)
        const imgUrl = `https://trazai.shop/${product.foto}?t=${timestamp}`
        setImagemExistente(imgUrl)
        console.log("IMG URL Puxada do Backend:", imgUrl)
      } else {
        setImagemExistente(null)
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
    }
  }, [id, cleanNumberString])

  // 1. CHAMA fetchProduct no montagem inicial
  useEffect(() => {
    fetchProduct()
  }, [id, fetchProduct])

  // 2. CHAMA fetchProduct sempre que a tela ganha o foco (retorna)
  useFocusEffect(
    useCallback(() => {
      fetchProduct()
    }, [fetchProduct])
  )

  // ====================================================================
  // SELECIONAR IMAGEM
  // ====================================================================
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Atenção", "Você precisa permitir acesso à galeria.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // warning ok
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled) {
      setNovaImagem(result.assets[0])
    }
  }

  // ====================================================================
  // SALVAR ALTERAÇÕES (Atualizado para recarregar dados após salvar)
  // ====================================================================
  const handleUpdate = useCallback(async () => {
    if (!nome || !preco || !categoria) {
      Alert.alert("Atenção", "Nome, Preço e Categoria são obrigatórios.")
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("nome", nome)
      formData.append("descricao", descricao)
      formData.append("preco", preco.replace(",", "."))
      
      // Estoque já está limpo para ser enviado como número puro
      formData.append("estoque", estoque || "0") 
      
      formData.append("unidade_de_venda", unidade)
      formData.append("categoria", categoria)

      if (novaImagem) {
        const uri = Platform.OS === "android" ? novaImagem.uri : novaImagem.uri.replace("file://", "")
        const ext = uri.split(".").pop()

        formData.append("foto", {
          uri,
          name: `photo.${ext}`,
          type: `image/${ext}`,
        } as any)
      }

      await api.put(`/produtos/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      // ATUALIZAÇÃO DE ESTADO PÓS-SALVAR:
      setNovaImagem(null) 
      await fetchProduct() 
      
      Alert.alert("Sucesso", "Produto atualizado com sucesso.", [
        { 
          text: "OK", 
          onPress: () => router.back() 
        }
      ])
    } catch (error: any) {
      console.error(error)
      Alert.alert("Erro", "Não foi possível atualizar o produto.")
    } finally {
      setIsSaving(false)
    }
  }, [id, nome, descricao, preco, estoque, unidade, categoria, novaImagem, router, fetchProduct]) 

  // ====================================================================
  // DELETAR PRODUTO
  // ====================================================================
  const handleDelete = useCallback(() => {
    Alert.alert("Confirmar Exclusão", "Deseja deletar este produto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/produtos/${id}`)
          router.back()
        },
      },
    ])
  }, [id, router])

  // ====================================================================
  // IMAGEM A EXIBIR
  // ====================================================================
  const displayImageUri = novaImagem?.uri ?? imagemExistente ?? null

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Editar Produto" }} />

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
          <Text style={styles.titulo}>Editar Produto</Text>

          {/* IMAGEM */}
          <Pressable onPress={pickImage} style={styles.imageContainer}>
            {displayImageUri ? (
              <Image
                source={{ uri: displayImageUri, cache: "reload" }}
                style={styles.productImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log("[ERRO_IMG] Falha ao carregar imagem:", error.nativeEvent.error)
                }}
                onLoad={() => {
                  console.log("[INFO_IMG] Imagem carregada com sucesso!")
                }}
              />
            ) : (
              <View style={[styles.productImage, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#aaa' }}>Sem Imagem</Text>
              </View>
            )}

            <Text style={styles.imagePickerText}>Trocar Imagem</Text>
          </Pressable>

          {/* NOME */}
          <Text style={styles.label}>Nome do Produto</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} />

          {/* DESCRIÇÃO */}
          <Text style={styles.label}>Descrição</Text>
          <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} multiline />

          {/* PREÇO */}
          <Text style={styles.label}>Preço (R$)</Text>
          <TextInput style={styles.input} value={preco} onChangeText={setPreco} keyboardType="decimal-pad" />

          {/* ESTOQUE */}
          <Text style={styles.label}>Estoque</Text>
          <TextInput
            style={styles.input}
            value={estoque}
            // Aplica a limpeza a cada alteração, garantindo que o estado 'estoque' seja sempre limpo
            onChangeText={(text) => setEstoque(cleanNumberString(text))}
            keyboardType="numeric"
          />

          {/* UNIDADE */}
          <Text style={styles.label}>Unidade de Venda</Text>
          <TextInput style={styles.input} value={unidade} onChangeText={setUnidade} />

          {/* CATEGORIA */}
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={categoria} onValueChange={(value) => setCategoria(value)}>
              {productCategoriesForForms.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>

          {/* BOTÕES */}
          <View style={styles.buttonContainer}>
            {isSaving ? <ActivityIndicator /> : <Button title="Salvar Alterações" onPress={handleUpdate} />}
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Deletar Produto" color="red" onPress={handleDelete} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

// ====================================================================
// STYLES
// ====================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
  },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  productImage: { width: 150, height: 150, borderRadius: 10, backgroundColor: "#eee" },
  imagePickerText: { color: "#007BFF", fontWeight: "bold", marginTop: 8 },
  buttonContainer: { marginTop: 10 },
})