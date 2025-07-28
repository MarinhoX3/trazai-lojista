import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, StyleSheet, Alert, 
  ScrollView, Image, Pressable, Platform, SafeAreaView, 
  KeyboardAvoidingView, ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import api from '../../src/api/api';
import * as ImagePicker from 'expo-image-picker';

export default function CreateProductScreen() {
  const router = useRouter();
  const { lojaId } = useLocalSearchParams();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [unidade, setUnidade] = useState('UN');
  const [estoque, setEstoque] = useState('');
  const [categoria, setCategoria] = useState(''); // NOVO: Estado para a categoria do produto
  const [imagem, setImagem] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Estado para o loading do botão Salvar

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Atenção", "Você precisa permitir o acesso à galeria para selecionar uma imagem.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImagem(result.assets[0]);
    }
  };

  const handleCreateProduct = async () => {
    if (!nome || !preco || !lojaId) {
      Alert.alert('Atenção', 'Nome e Preço são obrigatórios.');
      return;
    }

    setIsSaving(true);

    const formData = new FormData();
    formData.append('id_loja', String(lojaId));
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('preco', preco.replace(',', '.'));
    formData.append('unidade_de_venda', unidade);
    formData.append('estoque', estoque ? estoque.replace(',', '.') : '0');
    formData.append('categoria', categoria); // NOVO: Adiciona a categoria ao formData
    
    if (imagem) {
      const uri = imagem.uri;
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('foto', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }
    
    try {
      await api.post('/produtos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Sucesso!', 'Produto cadastrado.', [
        { text: 'OK', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      console.error("Erro ao criar produto:", error.response?.data || error.message);
      const mensagemErro = error.response?.data?.message || 'Não foi possível cadastrar o produto.';
      Alert.alert('Erro', mensagemErro);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Adicionar Novo Produto" }} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.titulo}>Adicionar Novo Produto</Text>

          <Pressable style={styles.botaoImagem} onPress={pickImage}>
            <Text style={styles.botaoTexto}>Selecionar Imagem</Text>
          </Pressable>

          {imagem && <Image source={{ uri: imagem.uri }} style={styles.imagemPreview} />}

          <TextInput style={styles.input} placeholder="Nome do Produto *" placeholderTextColor="#888" value={nome} onChangeText={setNome} />
          <TextInput style={styles.input} placeholder="Descrição" placeholderTextColor="#888" value={descricao} onChangeText={setDescricao} multiline />
          <TextInput style={styles.input} placeholder="Preço (ex: 10.99) *" placeholderTextColor="#888" value={preco} onChangeText={setPreco} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Estoque (ex: 50)" placeholderTextColor="#888" value={estoque} onChangeText={setEstoque} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Unidade de Venda (UN, KG, etc) *" placeholderTextColor="#888" value={unidade} onChangeText={setUnidade} />
          {/* NOVO: Campo para Categoria do Produto */}
          <TextInput 
            style={styles.input} 
            placeholder="Categoria do Produto (ex: Bebidas, Laticínios)" 
            placeholderTextColor="#888" 
            value={categoria} 
            onChangeText={setCategoria} 
          />
          
          <View style={styles.buttonContainer}>
            {isSaving ? (
              <ActivityIndicator size="large" color="#007BFF" />
            ) : (
              <Button title="Salvar Produto" onPress={handleCreateProduct} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 15, paddingHorizontal: 15, backgroundColor: '#fff', fontSize: 16 },
  botaoImagem: { backgroundColor: '#5bc0de', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imagemPreview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15, backgroundColor: '#eee' },
  buttonContainer: { marginTop: 10, height: 40, justifyContent: 'center' },
});
