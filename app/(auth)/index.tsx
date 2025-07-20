import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert, 
  Pressable, 
  Image, 
  ActivityIndicator,
  ScrollView, // Importar ScrollView
  KeyboardAvoidingView, // Importar KeyboardAvoidingView
  Platform // Importar Platform para ajustes específicos de SO
} from 'react-native';
import api from '../../src/api/api';
import { useRouter, Link, Stack } from 'expo-router';
import { useAuthLoja } from '../../src/api/contexts/AuthLojaContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
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

      await login(response.data.loja, response.data.token);
      router.replace("/dashboard");

    } catch (error: any) {
      // --- BLOCO DE ERRO CORRIGIDO ---
      // Verificamos se o erro tem uma resposta do servidor.
      if (error.response && error.response.data && error.response.data.message) {
        // Se tiver, mostramos a mensagem de erro que o nosso backend enviou (ex: "E-mail ou senha inválidos.").
        Alert.alert('Erro no Login', error.response.data.message);
      } else {
        // Se for um erro de rede ou outro problema, mostramos uma mensagem genérica.
        Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua internet.');
      }
      // --- FIM DA CORREÇÃO ---
    } finally {
        setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.fullScreenContainer} // Um container que ocupa a tela inteira
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Ajuste o offset se necessário
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} // Estilo para o conteúdo dentro da ScrollView
        keyboardShouldPersistTaps="handled" // Permite que toques fora dos inputs fechem o teclado
        showsVerticalScrollIndicator={false} // Opcional: esconde a barra de rolagem vertical
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
          returnKeyType="next" // Adicionado para melhor navegação do teclado
          onSubmitEditing={() => { /* foco para o próximo input, se houver */ }}
        />
        
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.inputPassword} 
            placeholder="Digite sua senha" 
            placeholderTextColor="#888"
            value={senha} 
            onChangeText={setSenha} 
            secureTextEntry={!isPasswordVisible} 
            returnKeyType="done" // Adicionado para melhor navegação do teclado
            onSubmitEditing={handleLogin} // Tenta fazer login ao pressionar "Done"
          />
          <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
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
              <Button title="Entrar" onPress={handleLogin} />
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

// Seus estilos continuam aqui...
const styles = StyleSheet.create({
  fullScreenContainer: { // Novo estilo para o KeyboardAvoidingView
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: { // Novo estilo para o conteúdo dentro da ScrollView
    flexGrow: 1, // Permite que o conteúdo cresça e ocupe o espaço disponível
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 50, // Adiciona um padding inferior para garantir que o último campo não fique muito colado
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
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
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
    height: 40,
    justifyContent: 'center',
  },
  linkText: {
    color: '#007BFF',
    textAlign: 'center',
    fontSize: 16,
  }
});
