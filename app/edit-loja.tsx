import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, SafeAreaView, ActivityIndicator, Image, Pressable, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/api/api'; 
import { useAuthLoja } from '../src/api/contexts/AuthLojaContext'; 

export default function EditLojaScreen() {
  const router = useRouter();
  const { loja, updateLojaContext } = useAuthLoja();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [logoAtualUrl, setLogoAtualUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loja?.id) {
        setLoading(false);
        return;
    };

    const fetchLojaData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/lojas/${loja.id}`);
        const { nome_loja, telefone_contato, endereco_loja, url_logo } = response.data;
        setNome(nome_loja || '');
        setTelefone(telefone_contato || '');
        setEndereco(endereco_loja || '');
        setLogoAtualUrl(url_logo);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os dados da sua loja para edição.");
      } finally {
        setLoading(false);
      }
    };
    fetchLojaData();
  }, [loja?.id]);

  const pickImage = async () => {
    // CORREÇÃO: Revertemos para a sintaxe antiga que funciona, apesar do aviso.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setLogo(result.assets[0]);
    }
  };

  const handleUpdate = async () => {
    if (!loja?.id) {
        Alert.alert('Erro de Autenticação', 'Não foi possível identificar a sua loja. Por favor, faça login novamente.');
        return;
    }

    const formData = new FormData();
    formData.append('nome_loja', nome);
    formData.append('telefone_contato', telefone);
    formData.append('endereco_loja', endereco);

    if (logo) {
      const uri = logo.uri;
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('logo', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: `logo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }
    
    try {
      await api.put(`/lojas/${loja.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (updateLojaContext) {
        const updatedLoja = { ...loja, nome_loja: nome };
        await updateLojaContext(updatedLoja);
      }

      Alert.alert('Sucesso', 'Os dados da sua loja foram atualizados!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível atualizar os dados da loja.');
    }
  };
  
  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  const displayImageUri = logo?.uri || (logoAtualUrl ? `${api.defaults.baseURL}/${logoAtualUrl}?t=${new Date().getTime()}` : 'https://placehold.co/150x150/e2e8f0/e2e8f0?text=Logo');

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Editar Dados da Loja' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.titulo}>Editar Informações</Text>
        
        <Pressable onPress={pickImage} style={styles.imageContainer}>
          <Image source={{ uri: displayImageUri }} style={styles.profileImage} />
          <Text style={styles.imagePickerText}>Tocar para alterar o logo</Text>
        </Pressable>
        
        <Text style={styles.label}>Nome da Loja</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} />
        
        <Text style={styles.label}>Telefone de Contato</Text>
        <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
        
        <Text style={styles.label}>Endereço da Loja</Text>
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} multiline />

        <View style={styles.buttonContainer}>
          <Button title="Salvar Alterações" onPress={handleUpdate} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  imageContainer: { alignItems: 'center', marginBottom: 30 },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee', marginBottom: 10 },
  imagePickerText: { textAlign: 'center', color: '#007BFF' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 20, paddingHorizontal: 15, fontSize: 16 },
  buttonContainer: { marginTop: 20 },
});
