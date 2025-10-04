// app/(auth)/register.tsx (VERSÃO CORRIGIDA FINAL - COM CNPJ/CPF E CATEGORIA)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Image,
  Pressable,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/api/api';
import { useAuthLoja } from '../../src/api/contexts/AuthLojaContext';
import { Picker } from '@react-native-picker/picker'; // NOVO: Importa o Picker

// Lista de categorias para a loja (IDs devem corresponder aos valores no DB)
const storeCategories = [
  { id: '', name: 'Selecione uma categoria' }, // Opção padrão
  { id: 'Acessórios', name: 'Acessórios' },
  { id: 'Pet Shop', name: 'Pet Shop' },
  { id: 'Mercearia', name: 'Mercearia' },
  { id: 'Moda', name: 'Moda' },
  { id: 'Casa & Decoração', name: 'Casa & Decoração' },
  { id: 'Serviços', name: 'Serviços' },
  { id: 'Eletrônicos', name: 'Eletrônicos' },
  { id: 'Beleza', name: 'Beleza' },
  { id: 'Saúde', name: 'Saúde' },
  { id: 'Variedades', name: 'Variedades' }, // Adicionado para lojas com produtos diversos
];

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthLoja();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [enderecoLoja, setEnderecoLoja] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(storeCategories[0].id); // NOVO: Estado para a categoria selecionada
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
    console.log('Valores dos campos antes da validação:');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('Nome da Loja:', nomeLoja);
    console.log('CNPJ/CPF:', cnpjCpf);
    console.log('Telefone de Contato:', telefoneContato);
    console.log('Endereço da Loja:', enderecoLoja);
    console.log('Categoria Selecionada:', selectedCategory); // NOVO LOG

    // VALIDAÇÃO: Verifique se todos os campos obrigatórios estão preenchidos
    if (
      !email.trim() ||
      !password.trim() ||
      !nomeLoja.trim() ||
      !cnpjCpf.trim() ||
      !telefoneContato.trim() ||
      !enderecoLoja.trim() ||
      !selectedCategory // NOVO: Valida se uma categoria foi selecionada
    ) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios, incluindo a categoria da loja.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email_login', email.trim());
      formData.append('senha', password.trim());
      formData.append('nome_loja', nomeLoja.trim());
      formData.append('cnpj_cpf', cnpjCpf.trim());
      formData.append('telefone_contato', telefoneContato.trim());
      formData.append('endereco_loja', enderecoLoja.trim());
      formData.append('categoria', selectedCategory); // NOVO: Adiciona a categoria ao formData

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

      const response = await api.post('/lojas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Alert.alert('Sucesso', 'Loja cadastrada com sucesso! Você será redirecionado para o login.', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(auth)/index' as any);
            },
          },
        ]);
      } else {
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

        <Text style={styles.label}>CNPJ ou CPF *</Text>
        <TextInput
          style={styles.input}
          placeholder="XX.XXX.XXX/XXXX-XX ou XXX.XXX.XXX-XX"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={cnpjCpf}
          onChangeText={setCnpjCpf}
        />

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

        {/* NOVO CAMPO: Seleção de Categoria */}
        <Text style={styles.label}>Categoria da Loja *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue: string) => setSelectedCategory(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem} // Estilo para os itens do Picker (apenas iOS)
          >
            {storeCategories.map((cat) => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </Picker>
        </View>

        <Pressable onPress={pickImage} style={styles.imagePickerButton} disabled={loading}>
          {logo ? (
            <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
          ) : (
            <Text style={styles.imagePickerText}>Tocar para adicionar o logo da loja (Opcional)</Text>
          )}
        </Pressable>

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
  pickerContainer: { // NOVO: Estilo para o container do Picker
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden', // Garante que o conteúdo do picker respeite as bordas
  },
  picker: { // NOVO: Estilo para o Picker
    height: 50,
    width: '100%',
    color: '#333',
  },
  pickerItem: { // NOVO: Estilo para os itens do Picker (somente iOS)
    fontSize: 16,
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
  registerButton: {
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
