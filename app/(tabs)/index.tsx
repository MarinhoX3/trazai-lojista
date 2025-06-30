import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Pressable, Image, ActivityIndicator } from 'react-native';
import api from '../../src/api/api';
import { useRouter, Link, Stack } from 'expo-router';
import { useAuthLoja } from '../../src/api/contexts/AuthLojaContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
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

      // Guarda os dados da loja no contexto global
      await login(response.data.loja);

      // Navega para o painel. Já não precisamos de passar parâmetros,
      // pois o painel irá obter os dados do contexto.
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
      <Text style={styles.titulo}>Login do Lojista</Text>

      <TextInput style={styles.input} placeholder="Digite seu e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Digite sua senha" value={senha} onChangeText={setSenha} secureTextEntry />

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
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
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
