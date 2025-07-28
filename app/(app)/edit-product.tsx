import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, Button, StyleSheet, Alert, 
  ScrollView, Image, Pressable, Platform, SafeAreaView, 
  KeyboardAvoidingView, ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import api, { ASSET_BASE_URL } from '../../src/api/api';
import * as ImagePicker from 'expo-image-picker';

// A interface ProductParams para os dados que esperamos do backend
// E para a tipagem dos parâmetros da URL, que são sempre strings
interface ProductParams {
  id: string;
  nome: string;
  preco: string; // Alterado para string, pois vem como string da URL e do TextInput
  estoque: string; // Alterado para string, pois vem como string da URL e do TextInput
  descricao: string;
  url_foto: string;
  categoria?: string; 
}

export default function EditProductScreen() {
  const router = useRouter();
  // Obtém os parâmetros da URL. useLocalSearchParams retorna Record<string, string | string[] | undefined>.
  // Acessamos 'id' diretamente e garantimos que é uma string.
  const { id } = useLocalSearchParams(); 
  const productId = typeof id === 'string' ? id : undefined; // Garante que id é string ou undefined

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [categoria, setCategoria] = useState(''); 
  const [novaImagem, setNovaImagem] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [imagemAtualUrl, setImagemAtualUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  // Função para buscar os detalhes do produto do backend
  useEffect(() => {
    if (!productId) {
      setIsLoadingProduct(false);
      return;
    }
    setIsLoadingProduct(true);
    api.get(`/produtos/${productId}`)
      .then(response => {
        const productData = response.data; 

        setNome(productData.nome || '');
        setDescricao(productData.descricao || '');
        setPreco(String(productData.preco || '')); // Converte para string
        // CORREÇÃO: Garante que o estoque é um número inteiro, removendo formatação
        setEstoque(String(parseInt(productData.estoque || '0', 10))); 
        setCategoria(productData.categoria || ''); 
        setImagemAtualUrl(productData.url_foto || null);
      })
      .catch(error => {
        console.error("Erro ao carregar detalhes do produto:", error.response?.data || error.message);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do produto.');
        router.back(); 
      })
      .finally(() => {
        setIsLoadingProduct(false);
      });
  }, [productId, router]); // Dependências: productId e router (para navegação em caso de erro)


  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Atenção", "Você precisa permitir o acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setNovaImagem(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    if (!productId) return; 

    setIsSaving(true);
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('preco', preco.replace(',', '.'));
    formData.append('estoque', estoque); // O estoque já está como string de inteiro
    formData.append('categoria', categoria); 
    
    if (novaImagem) {
      const uri = novaImagem.uri;
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('foto', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }
    
    try {
      await api.put(`/produtos/${productId}`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Sucesso', 'Produto atualizado!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error.response?.data || error.message);
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível atualizar o produto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return; 

    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar o produto "${nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Deletar', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/produtos/${productId}`); 
            Alert.alert('Sucesso', 'Produto deletado!', [{ text: 'OK', onPress: () => router.back() }]);
          } catch (error: any) {
            console.error("Erro ao deletar produto:", error.response?.data || error.message);
            Alert.alert('Erro', error.response?.data?.message || 'Não foi possível deletar o produto.');
          }
        }}
      ]
    );
  };

  const displayImageUri = novaImagem?.uri || (imagemAtualUrl ? `${ASSET_BASE_URL}/${imagemAtualUrl}?t=${new Date().getTime()}` : 'https://placehold.co/200x200/e2e8f0/e2e8f0?text=Img');

  // Exibir indicador de carregamento enquanto o produto está sendo carregado
  if (isLoadingProduct) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Carregando produto...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Editar Produto' }} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.titulo}>Editar Produto</Text>
          
          <Pressable onPress={pickImage} style={styles.imageContainer}>
            <Image source={{ uri: displayImageUri }} style={styles.productImage} />
            <Text style={styles.imagePickerText}>Trocar Imagem</Text>
          </Pressable>

          <Text style={styles.label}>Nome do Produto</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome do Produto" placeholderTextColor="#888"/>

          <Text style={styles.label}>Descrição</Text>
          <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} multiline placeholder="Descrição do Produto" placeholderTextColor="#888"/>
          
          <Text style={styles.label}>Preço (R$)</Text>
          <TextInput style={styles.input} value={preco} onChangeText={setPreco} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#888"/>
          
          <Text style={styles.label}>Estoque</Text>
          <TextInput 
            style={styles.input} 
            value={estoque} 
            onChangeText={setEstoque} 
            keyboardType="numeric" 
            placeholder="Quantidade em estoque" 
            placeholderTextColor="#888"
          />

          {/* Campo para Categoria do Produto */}
          <Text style={styles.label}>Categoria do Produto</Text>
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
              <Button title="Salvar Alterações" onPress={handleUpdate} />
            )}
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Deletar Produto" onPress={handleDelete} color="red" />
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
    label: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
    input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 15, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#f5f5f5' },
    buttonContainer: { marginTop: 10, height: 40, justifyContent: 'center' },
    imageContainer: { alignItems: 'center', marginBottom: 20 },
    productImage: { width: 150, height: 150, borderRadius: 10, backgroundColor: '#eee', marginBottom: 10 },
    imagePickerText: { color: '#007BFF', fontSize: 16, fontWeight: 'bold' },
    loadingContainer: { 
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    loadingText: { 
      marginTop: 10,
      fontSize: 16,
      color: '#666',
    },
});
