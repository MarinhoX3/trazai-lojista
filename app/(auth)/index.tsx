import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  Alert, 
  LogBox 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link, Stack } from 'expo-router';
import api from '../../src/api/api';
import { AuthLoja, useAuthLoja } from '../../src/api/contexts/AuthLojaContext';


LogBox.ignoreLogs(['Got DOWN touch before receiving UP or CANCEL from last gesture']);

// Tipagem da resposta da API
interface LoginResponse {
  token: string;
  loja: {
    id: string;
    nome: string;
    [key: string]: any; // para outros campos dinâmicos da loja
  };
}

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const router = useRouter();
  const { login } = useAuthLoja();

  const handleLogin = async () => {
  if (!email || !senha) {
    Alert.alert('Atenção', 'Por favor, preencha e-mail e senha.');
    return;
  }

  setLoading(true);
  try {
    const response = await api.post('/lojas/login', {
      email_login: email,
      senha: senha
    });

    // Mapear os dados da API para o tipo AuthLoja
    const lojaData: AuthLoja = {
      id: response.data.loja.id,
      nome_loja: response.data.loja.nome,       // mapear para nome_loja
      email_login: response.data.loja.email,    // mapear para email_login
      taxa_entrega: response.data.loja.taxa_entrega // opcional
    };

    // Chama a função login do contexto
    await login(lojaData, response.data.token);

    router.replace("/dashboard");

  } catch (error: any) {
    if (error.response?.data?.message) {
      Alert.alert('Erro no Login', error.response.data.message);
    } else {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua internet.');
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      style={styles.fullScreenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />

        <Text style={styles.titulo}>Bem-vindo!</Text>
        <Text style={styles.tituloLojista}>Lojista</Text>
        <Text style={styles.subtitulo}>Faça seu login para continuar</Text>

        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Digite sua senha"
            placeholderTextColor="#888"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!isPasswordVisible}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
            accessibilityLabel={isPasswordVisible ? "Esconder senha" : "Mostrar senha"}
          >
            <Ionicons 
              name={isPasswordVisible ? "eye-off" : "eye"} 
              size={24} 
              color="#000" 
            />
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#007BFF" />
          ) : (
            <Pressable onPress={handleLogin} style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Entrar</Text>
            </Pressable>
          )}
        </View>

        <Link href="/register" asChild>
          <Pressable>
            <Text style={styles.linkText}>
              Ainda não tem uma conta? Cadastre-se
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 50,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  tituloLojista: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  subtitulo: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  inputPassword: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    padding: 10,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#007BFF',
    textAlign: 'center',
    fontSize: 16,
  },
});
