import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable, Image, ActivityIndicator } from 'react-native';
// --- CORREÇÃO 1: Caminhos de importação ajustados ---
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

      await login(response.data.loja);
      router.replace("/dashboard");

    } catch (error: any) {
      const mensagemErro = error.response?.data?.message || 'Não foi possível conectar ao servidor.';
      Alert.alert('Erro no Login', mensagemErro);
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.titulo}>Bem-vindo!</Text>
      {/* --- CORREÇÃO 2: Texto "Lojista" adicionado --- */}
      <Text style={styles.tituloLojista}>Lojista</Text>
      <Text style={styles.subtitulo}>Faça seu login para continuar</Text>

      <TextInput style={styles.input} placeholder="Digite seu e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.inputPassword} 
          placeholder="Digite sua senha" 
          value={senha} 
          onChangeText={setSenha} 
          secureTextEntry={!isPasswordVisible} 
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
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
