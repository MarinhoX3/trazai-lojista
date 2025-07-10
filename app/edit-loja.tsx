import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, SafeAreaView, ActivityIndicator, Image, Pressable, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import api, { ASSET_BASE_URL } from '../src/api/api';
import { useAuthLoja } from '../src/api/contexts/AuthLojaContext'; 

export default function EditLojaScreen() {
  const router = useRouter();
  // --- CORREÇÃO FINAL ---
  // Agora que o nosso contexto fornece o token, podemos obtê-lo diretamente aqui.
  const { loja, token, updateLojaContext, logout } = useAuthLoja();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [logoAtualUrl, setLogoAtualUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    if (!loja?.id) {
        setLoading(false);
        // Não mostramos alerta aqui, pois o loading=false vai mostrar a tela de login se não houver loja
        return;
    };

    const fetchLojaData = async () => {
      try {
        // A autenticação já está no cabeçalho do axios graças ao nosso contexto
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
      // O token já está a ser enviado automaticamente pelo axios
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

  const handleConnectStripe = async () => {
    if (!loja || !token) {
      Alert.alert("Erro", "Não foi possível identificar os dados de autenticação da sua loja.");
      return;
    }
    setStripeLoading(true);
    try {
      // A autenticação já está no cabeçalho do axios
      const response = await api.post('/lojas/criar-link-stripe', { id_loja: loja.id });

      const { url } = response.data;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Erro", `Não foi possível abrir o link: ${url}`);
      }

    } catch (error: any) {
      console.error("Erro ao iniciar cadastro Stripe:", error);
      const mensagem = error.response?.data?.message || "Ocorreu um erro. Tente novamente.";
      Alert.alert("Erro", mensagem);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Tem a certeza de que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Sair", style: "destructive", onPress: async () => {
            await logout();
            router.replace('/'); 
        }}
      ]
    );
  };
  
  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  const displayImageUri = logo?.uri || (logoAtualUrl ? `${ASSET_BASE_URL}/${logoAtualUrl}?t=${new Date().getTime()}` : 'https://placehold.co/150x150/e2e8f0/e2e8f0?text=Logo');

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

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Pagamentos Online</Text>
        <Text style={styles.sectionDescription}>
          Conecte-se à nossa plataforma para começar a receber pagamentos online com segurança.
        </Text>
        <Button 
          title={stripeLoading ? "Aguarde..." : "Configurar Pagamentos"} 
          onPress={handleConnectStripe} 
          disabled={stripeLoading}
          color="#6772E5"
        />

        <View style={styles.logoutButtonContainer}>
            <Button title="Sair (Logout)" color="red" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  imageContainer: { alignItems: 'center', marginBottom: 30 },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee', marginBottom: 10 },
  imagePickerText: { textAlign: 'center', color: '#007BFF' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 20, paddingHorizontal: 15, fontSize: 16 },
  buttonContainer: { marginTop: 10 },
  divider: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  logoutButtonContainer: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' },
});
