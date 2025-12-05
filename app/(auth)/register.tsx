import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  Image,
  Pressable,
  Platform,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/api/api';
import { useAuthLoja } from '../../src/api/contexts/AuthLojaContext';
import { Picker } from '@react-native-picker/picker';

// LISTA DE CATEGORIAS
const storeCategories = [
  { id: '', name: 'Selecione uma categoria' },
  { id: 'Acessórios', name: 'Acessórios' },
  { id: 'Pet Shop', name: 'Pet Shop' },
  { id: 'Mercearia', name: 'Mercearia' },
  { id: 'Moda', name: 'Moda' },
  { id: 'Casa & Decoração', name: 'Casa & Decoração' },
  { id: 'Serviços', name: 'Serviços' },
  { id: 'Eletrônicos', name: 'Eletrônicos' },
  { id: 'Beleza', name: 'Beleza' },
  { id: 'Saúde', name: 'Saúde' },
  { id: 'Variedades', name: 'Variedades' },
];

export default function RegisterScreen() {
  const router = useRouter();

  // CAMPOS
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 🔥 CONFIRMAR SENHA
  const [nomeLoja, setNomeLoja] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [enderecoLoja, setEnderecoLoja] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(storeCategories[0].id);
  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  // PICKER DE IMAGEM
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Necessária', 'Precisamos da permissão da galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) setLogo(result.assets[0]);
  };

  // CADASTRAR
  const handleRegister = async () => {
    if (
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !nomeLoja.trim() ||
      !cnpjCpf.trim() ||
      !telefoneContato.trim() ||
      !enderecoLoja.trim() ||
      !selectedCategory
    ) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }

    // 🔥 VALIDAÇÃO DE SENHAS
    if (password.trim() !== confirmPassword.trim()) {
      Alert.alert('Erro', 'As senhas não coincidem.');
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
      formData.append('categoria', selectedCategory);

      if (logo) {
        const uri = logo.uri;
        const ext = uri.split('.').pop();
        formData.append('logo', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: `logo.${ext}`,
          type: `image/${ext}`,
        } as any);
      }

      const response = await api.post('/lojas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log("STATUS:", response.status);
console.log("RESPONSE:", response.data);

const msg = response.data?.message?.toLowerCase() || "";

if (msg.includes("sucesso")) {
  Alert.alert(
    "Sucesso",
    "Loja cadastrada com sucesso!",
    [{ text: "OK", onPress: () => router.replace("/(auth)/index") }]
  );
} else {
  Alert.alert(
    "Erro",
    response.data?.message || "Ocorreu um erro ao cadastrar."
  );
}

    } catch (err: any) {
      Alert.alert('Erro', 'Não foi possível cadastrar a loja.');
      console.log(err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={styles.title}>Cadastro da Loja</Text>

        {/* EMAIL */}
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#888"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        {/* SENHA */}
        <Text style={styles.label}>Senha *</Text>
        <TextInput
          style={styles.input}
          placeholder="Sua senha"
          placeholderTextColor="#888"
          secureTextEntry={true}
          textContentType="password"
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />

        {/* CONFIRMAR SENHA */}
        <Text style={styles.label}>Confirmar Senha *</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirme sua senha"
          placeholderTextColor="#888"
          secureTextEntry={true}
          textContentType="password"
          autoCapitalize="none"
          autoCorrect={false}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* NOME DA LOJA */}
        <Text style={styles.label}>Nome da Loja *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da sua loja"
          placeholderTextColor="#888"
          value={nomeLoja}
          onChangeText={setNomeLoja}
        />

        {/* CNPJ/CPF */}
        <Text style={styles.label}>CNPJ ou CPF *</Text>
        <TextInput
          style={styles.input}
          placeholder="XX.XXX.XXX/XXXX-XX ou XXX.XXX.XXX-XX"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={cnpjCpf}
          onChangeText={setCnpjCpf}
        />

        {/* TELEFONE */}
        <Text style={styles.label}>Telefone de Contato *</Text>
        <TextInput
          style={styles.input}
          placeholder="(XX) XXXXX-XXXX"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={telefoneContato}
          onChangeText={setTelefoneContato}
        />

        {/* ENDEREÇO */}
        <Text style={styles.label}>Endereço da Loja *</Text>
        <TextInput
          style={styles.input}
          placeholder="Rua, Número, Bairro, Cidade"
          placeholderTextColor="#888"
          multiline
          value={enderecoLoja}
          onChangeText={setEnderecoLoja}
        />

        {/* CATEGORIA */}
        <Text style={styles.label}>Categoria da Loja *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={setSelectedCategory}
            style={styles.picker}
          >
            {storeCategories.map(cat => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
            ))}
          </Picker>
        </View>

        {/* LOGO */}
        <Pressable onPress={pickImage} style={styles.imagePickerButton}>
          {logo ? (
            <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
          ) : (
            <Text style={styles.imagePickerText}>
              Tocar para adicionar o logo da loja (Opcional)
            </Text>
          )}
        </Pressable>

        {/* BOTÃO CADASTRAR */}
        <Pressable
          style={[styles.registerButton, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Cadastrar Loja</Text>
          )}
        </Pressable>

        {/* LINK LOGIN */}
        <Pressable onPress={() => router.replace('/(auth)/index')}>
          <Text style={styles.loginText}>
            Já tem uma conta? <Text style={styles.loginLinkText}>Faça login</Text>
          </Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------- ESTILOS ----------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scrollContent: { padding: 20 },
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
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  picker: { height: 50 },
  imagePickerButton: {
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  imagePickerText: { color: '#666' },
  logoPreview: { width: '100%', height: '100%', borderRadius: 10 },
  registerButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginText: { textAlign: 'center', marginTop: 20, color: '#555' },
  loginLinkText: { color: '#007BFF', fontWeight: 'bold' },
});
