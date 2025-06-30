import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Image, Pressable, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import api from '../src/api/api';
import * as ImagePicker from 'expo-image-picker';

export default function EditProductScreen() {
  const router = useRouter();
  const product = useLocalSearchParams<{ id: string, nome: string, preco: string, estoque: string, descricao: string, url_foto: string }>();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [novaImagem, setNovaImagem] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imagemAtualUrl, setImagemAtualUrl] = useState<string | null>(null);

  // Usamos useEffect para garantir que os estados são preenchidos corretamente
  // e para formatar o valor do estoque.
  useEffect(() => {
    if (product) {
      setNome(product.nome || '');
      setDescricao(product.descricao || '');
      setPreco(product.preco || '');
      setImagemAtualUrl(product.url_foto || null);
      
      // --- AQUI ESTÁ A CORREÇÃO ---
      // Formatamos o valor do estoque para remover as casas decimais
      const estoqueFormatado = product.estoque ? parseInt(product.estoque, 10).toString() : '';
      setEstoque(estoqueFormatado);
    }
  }, [product]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Atenção", "Você precisa permitir o acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Mantido para compatibilidade
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setNovaImagem(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    if (!product.id) return;

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('preco', preco.replace(',', '.'));
    formData.append('estoque', estoque);

    if (novaImagem) {
      const uri = novaImagem.uri;
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      // O backend espera o campo 'foto' para produtos.
      formData.append('foto', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }
    
    try {
      await api.put(`/produtos/${product.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Sucesso', 'Produto atualizado!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar o produto "${nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Deletar', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/produtos/${product.id}`);
            Alert.alert('Sucesso', 'Produto deletado!', [{ text: 'OK', onPress: () => router.back() }]);
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível deletar o produto.');
          }
        }}
      ]
    );
  };

  const displayImageUri = novaImagem?.uri || (imagemAtualUrl ? `${api.defaults.baseURL}/${imagemAtualUrl}?t=${new Date().getTime()}` : 'https://placehold.co/200x200/e2e8f0/e2e8f0?text=Img');

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Editar Produto' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.titulo}>Editar Produto</Text>
        
        <Pressable onPress={pickImage} style={styles.imageContainer}>
          <Image source={{ uri: displayImageUri }} style={styles.productImage} />
          <Text style={styles.imagePickerText}>Trocar Imagem</Text>
        </Pressable>

        <Text style={styles.label}>Nome do Produto</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} />

        <Text style={styles.label}>Descrição</Text>
        <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} multiline/>
        
        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput style={styles.input} value={preco} onChangeText={setPreco} keyboardType="numeric" />
        
        <Text style={styles.label}>Estoque</Text>
        <TextInput style={styles.input} value={estoque} onChangeText={setEstoque} keyboardType="numeric" />

        <View style={styles.buttonContainer}>
          <Button title="Salvar Alterações" onPress={handleUpdate} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Deletar Produto" onPress={handleDelete} color="red" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, padding: 20 },
    titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
    input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 15, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#f5f5f5' },
    buttonContainer: { marginTop: 10 },
    imageContainer: { alignItems: 'center', marginBottom: 20 },
    productImage: { width: 150, height: 150, borderRadius: 10, backgroundColor: '#eee', marginBottom: 10 },
    imagePickerText: { color: '#007BFF', fontSize: 16, fontWeight: 'bold' },
});
