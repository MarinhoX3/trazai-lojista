"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  Button,
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
import api, { ASSET_BASE_URL } from "../../../src/api/api"
import * as ImagePicker from "expo-image-picker"
import { productCategoriesForForms } from "../../../src/constants/categories"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// ====================================================================
// COMPONENTE DE EDIÇÃO DE PRODUTO
// ====================================================================

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<Record<string, string>>()
  const router = useRouter()
  const insets = useSafeAreaInsets() // Added safe area insets hook
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [preco, setPreco] = useState("")
  const [estoque, setEstoque] = useState("")
  const [unidade, setUnidade] = useState("UN")
  const [categoria, setCategoria] = useState("")
  const [novaImagem, setNovaImagem] = useState<any>(null)
  const [imagemExistente, setImagemExistente] = useState("") // Added state to store existing product image URL
  const [isSaving, setIsSaving] = useState(false)


    // ====================================================================
    // FUNÇÃO DE LIMPEZA FINAL OTIMIZADA
    // Força a conversão para um número inteiro limpo.
    // ====================================================================
    const cleanNumberString = (value: string | number | null | undefined) => {
        if (value === null || value === undefined) return "";
        
        let valueString = String(value);

        // 1. Remove TUDO que não é dígito (0-9). (Ex: "90.000" vira "90000")
        const cleanedDigits = valueString.replace(/[^0-9]/g, "");

        if (!cleanedDigits) return ""; // Retorna vazio se não houver dígitos

        const numericValue = parseInt(cleanedDigits, 10);

        // 2. TRATAMENTO DO ERRO DE FORMATAÇÃO DO BACKEND:
        // Se o número for grande (ex: 90000) e for divisível por 1000, 
        // assume-se que é o erro de formatação de milhar e divide.
        // Usamos um limite de 1000 para evitar dividir estoques altos corretos.
        if (numericValue >= 1000 && numericValue % 1000 === 0) {
             const dividedValue = numericValue / 1000;
             return String(dividedValue);
        }
        
        // 3. Caso contrário, retorna o valor limpo original
        return String(numericValue); 
    };

    // ====================================================================
    // CARREGAMENTO DOS DADOS (useEffect)
    // ====================================================================
  // Dentro do useEffect:

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/produtos/${id}`)
        const product = response.data

        setNome(product.nome)
        setDescricao(product.descricao)
        
        // ... (nome, descricao, preco, etc. inalterados)
        setPreco(product.preco)
        
        // ==========================================================
        // CORREÇÃO DE FORÇA PARA O ESTOQUE
        // ==========================================================
        let estoqueRecebido = String(product.estoque);
        
        // 1. Remove qualquer formatação de milhar que venha do backend:
        // Ex: "20.000" -> "20000"
        let valorPuro = estoqueRecebido.replace(/[^0-9]/g, "");

        // 2. Se o valor é grande (ex: 20000) e você sabe que o estoque REAL é 20, 
        // significa que o ponto foi introduzido como separador de milhar.
        if (valorPuro.length > 3) {
            // Assume-se que é formatação de milhar e pegamos os dígitos iniciais
            // Ex: "20000" (se for o caso) ou "20" (se o backend já tiver formatado)
            
            // Vamos apenas pegar os dígitos ANTES do ponto, se houver:
            const partes = estoqueRecebido.split('.');
            valorPuro = partes[0] || valorPuro; 
        }

        // 3. Força a ser um número inteiro, garantindo que não há zeros à esquerda desnecessários
        const estoqueFinal = String(parseInt(valorPuro, 10) || 0);
        setEstoque(estoqueFinal) // <--- Agora deve ser "20"
        // ==========================================================
        
        setUnidade(product.unidade_de_venda || "UN")
        setCategoria(product.categoria)
        // ... (restante do código)
      } catch (error) {
        console.error("Error fetching product details:", error)
      }
    }

    fetchProduct()
  }, [id])

 
  

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted === false) {
      Alert.alert("Atenção", "Você precisa permitir o acesso à galeria.")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })
    if (!result.canceled) {
      setNovaImagem(result.assets[0])
    }
  }

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
      
      // O estoque já está limpo pelo cleanNumberString no estado
      formData.append("estoque", estoque ? estoque : "0") // Não precisa mais de replace(",", ".")
      
      formData.append("unidade_de_venda", unidade)
      formData.append("categoria", categoria)

      if (novaImagem) {
        const uri = novaImagem.uri
        const uriParts = uri.split(".")
        const fileType = uriParts[uriParts.length - 1]

        formData.append("foto", {
          uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        } as any)
      }

      await api.put(`/produtos/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      Alert.alert("Sucesso", "Produto atualizado com sucesso.", [{ text: "OK", onPress: () => router.back() }])
    } catch (error: any) {
      console.error("Error updating product:", error.response?.data || error.message)
      const mensagemErro = error.response?.data?.message || "Não foi possível atualizar o produto."
      Alert.alert("Erro", mensagemErro)
    } finally {
      setIsSaving(false)
    }
  }, [id, nome, descricao, preco, estoque, unidade, categoria, novaImagem, router])

  const handleDelete = useCallback(async () => {
    Alert.alert("Confirmar Exclusão", "Tem certeza que deseja deletar este produto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Deletar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/produtos/${id}`)
            Alert.alert("Sucesso", "Produto deletado com sucesso.", [{ text: "OK", onPress: () => router.back() }])
          } catch (error: any) {
            console.error("Error deleting product:", error.response?.data || error.message)
            const mensagemErro = error.response?.data?.message || "Não foi possível deletar o produto."
            Alert.alert("Erro", mensagemErro)
          }
        },
      },
    ])
  }, [id, router])

  const displayImageUri = novaImagem ? novaImagem.uri : imagemExistente // Updated to use existing image URL instead of just product ID

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Editar Produto" }} />
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          <Text style={styles.titulo}>Editar Produto</Text>

          <Pressable onPress={pickImage} style={styles.imageContainer}>
            <Image source={{ uri: displayImageUri }} style={styles.productImage} />
            <Text style={styles.imagePickerText}>Trocar Imagem</Text>
          </Pressable>

          <Text style={styles.label}>Nome do Produto</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Nome do Produto"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            placeholder="Descrição do Produto"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Preço (R$)</Text>
          <TextInput
            style={styles.input}
            value={preco}
            onChangeText={setPreco}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Estoque</Text>
          <TextInput
    style={styles.input}
    value={estoque} // <-- Volta a usar apenas o estado 'estoque'
    // CORREÇÃO: Usamos o `cleanNumberString` no onChangeText
    onChangeText={(text) => setEstoque(cleanNumberString(text))} 
    keyboardType="numeric"
    placeholder="Quantidade em estoque"
    placeholderTextColor="#888"
/>

          <Text style={styles.label}>Unidade de Venda</Text>
          <TextInput
            style={styles.input}
            value={unidade}
            onChangeText={setUnidade}
            placeholder="UN, KG, L, etc"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Categoria do Produto</Text>
<View style={styles.pickerContainer}>
  <Picker
    selectedValue={categoria}
    onValueChange={(itemValue) => setCategoria(itemValue as string)}
    style={styles.picker}
    dropdownIconColor="#000" // ✅ Ajuste do ícone no Android
  >
    {productCategoriesForForms.map((cat) => (
      <Picker.Item 
        key={cat.id}
        label={cat.name}
        value={cat.id}
        color="#000" // ✅ Força o texto da opção em preto
      />
    ))}
  </Picker>
</View>


          <View style={styles.buttonContainer}>
            {isSaving ? (
              <ActivityIndicator size="large" color="#007BFF" />
            ) : (
              <Button title="Salvar Alterações" onPress={handleUpdate} />
            )}
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Deletar Produto" onPress={handleDelete} color="red" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, padding: 20 },
  titulo: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  buttonContainer: { marginTop: 10, height: 40, justifyContent: "center" },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  productImage: { width: 150, height: 150, borderRadius: 10, backgroundColor: "#eee", marginBottom: 10 },
  imagePickerText: { color: "#007BFF", fontSize: 16, fontWeight: "bold" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
})