// app/(auth)/register.tsx (VERSÃO CORRIGIDA FINAL - COM CNPJ/CPF)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button, // Manter Button para o exemplo, mas ele tem limitação no title
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Image,
  Pressable, // Usar Pressable para botões customizados com ActivityIndicator
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/api/api';
import { useAuthLoja } from '../../src/api/contexts/AuthLojaContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthLoja(); // Usaremos a função de login após o cadastro

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Renomeado para 'password' para clareza
  const [nomeLoja, setNomeLoja] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState(''); // NOVO ESTADO PARA CNPJ/CPF
  const [telefoneContato, setTelefoneContato] = useState('');
  const [enderecoLoja, setEnderecoLoja] = useState('');
  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Necessária', 'Precisamos da permissão da galeria para carregar a logo.');
      return;
    }

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

  const handleRegister = async () => {
    // Adicione console.log para depurar os valores dos campos
    console.log('Valores dos campos antes da validação:');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('Nome da Loja:', nomeLoja);
    console.log('CNPJ/CPF:', cnpjCpf); // NOVO LOG
    console.log('Telefone de Contato:', telefoneContato);
    console.log('Endereço da Loja:', enderecoLoja);

    // VALIDAÇÃO: Verifique se todos os campos obrigatórios estão preenchidos
    if (!email.trim() || !password.trim() || !nomeLoja.trim() || !cnpjCpf.trim() || !telefoneContato.trim() || !enderecoLoja.trim()) { // ADICIONADO cnpjCpf.trim()
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email_login', email.trim()); // Use o nome do campo esperado pelo backend
      formData.append('senha', password.trim()); // Use o nome do campo esperado pelo backend
      formData.append('nome_loja', nomeLoja.trim());
      formData.append('cnpj_cpf', cnpjCpf.trim()); // NOVO: ADICIONADO AO FORMDATA
      formData.append('telefone_contato', telefoneContato.trim());
      formData.append('endereco_loja', enderecoLoja.trim());

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

      // IMPORTANTE: Seu endpoint de cadastro pode não retornar o token e dados da loja
      // no mesmo formato do login. Ajuste conforme a resposta REAL do seu backend.
      const response = await api.post('/lojas', formData, { // Verifique se o endpoint é '/lojas' para cadastro
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) { // Assumindo que seu backend retorna { success: true }
        Alert.alert('Sucesso', 'Loja cadastrada com sucesso! Você será redirecionado para o login.', [
          {
            text: 'OK',
            onPress: () => {
              // Redireciona para a tela de login. Use 'as any' para contornar a tipagem.
              router.replace('/(auth)/index' as any);
            },
          },
        ]);
      } else {
        // Se o backend tiver uma lógica mais específica para 'success: false'
        Alert.alert('Erro no Cadastro', response.data.message || 'Não foi possível cadastrar a loja.');
      }
    } catch (error: any) {
      console.error('Erro ao cadastrar loja:', error.response?.data || error.message);
      Alert.alert('Erro', error.response?.data?.message || 'Ocorreu um erro ao tentar cadastrar a loja. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* REMOVIDO: <Stack.Screen options={{ title: 'Cadastro de Loja' }} />
          Isso deve ser definido apenas no _layout.tsx do grupo (auth) */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Cadastro da Loja</Text>

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Senha *</Text>
        <TextInput
          style={styles.input}
          placeholder="Sua senha"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Nome da Loja *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da sua loja"
          placeholderTextColor="#888"
          value={nomeLoja}
          onChangeText={setNomeLoja}
        />

        {/* NOVO CAMPO: CNPJ ou CPF */}
        <Text style={styles.label}>CNPJ ou CPF *</Text>
        <TextInput
          style={styles.input}
          placeholder="XX.XXX.XXX/XXXX-XX ou XXX.XXX.XXX-XX"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={cnpjCpf}
          onChangeText={setCnpjCpf}
        />

        {/* NOVOS CAMPOS EXISTENTES */}
        <Text style={styles.label}>Telefone de Contato *</Text>
        <TextInput
          style={styles.input}
          placeholder="(XX) XXXXX-XXXX"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={telefoneContato}
          onChangeText={setTelefoneContato}
        />

        <Text style={styles.label}>Endereço da Loja *</Text>
        <TextInput
          style={styles.input}
          placeholder="Rua, Número, Bairro, Cidade"
          placeholderTextColor="#888"
          multiline
          value={enderecoLoja}
          onChangeText={setEnderecoLoja}
        />

        <Pressable onPress={pickImage} style={styles.imagePickerButton} disabled={loading}>
          {logo ? (
            <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
          ) : (
            <Text style={styles.imagePickerText}>Tocar para adicionar o logo da loja (Opcional)</Text>
          )}
        </Pressable>
        {/* FIM DOS NOVOS CAMPOS */}

        {/* Botão de Cadastro - Usando Pressable para permitir ActivityIndicator */}
        <Pressable
          style={({ pressed }) => [
            styles.registerButton,
            { opacity: pressed || loading ? 0.7 : 1 }
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Cadastrar Loja</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/index' as any)} style={styles.loginLink}>
          <Text style={styles.loginText}>Já tem uma conta? <Text style={styles.loginLinkText}>Faça login</Text></Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imagePickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    height: 150,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'contain',
  },
  imagePickerText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  registerButton: { // Novo estilo para o botão de cadastro
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#555',
  },
  loginLinkText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});
