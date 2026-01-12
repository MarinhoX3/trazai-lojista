"use client";

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
  LogBox,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importações de API e Contexto
// Nota: Estas referências dependem da estrutura local do seu projeto
import api from '../../src/api/api';
import { AuthLoja, useAuthLoja } from '../../src/api/contexts/AuthLojaContext';

LogBox.ignoreLogs(['Got DOWN touch before receiving UP or CANCEL from last gesture']);

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthLoja();

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Por favor, preencha o e-mail e a senha para aceder.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/lojas/login', {
        email_login: email,
        senha: senha
      });

      const lojaData: AuthLoja = {
        id: response.data.loja.id,
        nome_loja: response.data.loja.nome,
        email_login: response.data.loja.email,
        taxa_entrega: response.data.loja.taxa_entrega
      };

      await login(lojaData, response.data.token);
      router.replace("(app)/(tabs)/dashboard");

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Não foi possível conectar ao servidor. Verifique a sua ligação.';
      Alert.alert('Falha no Acesso', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]} 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
      >
        {/* SECÇÃO DO LOGÓTIPO */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
            />
          </View>
          
          <Text style={styles.portalTag}>PORTAL DO LOJISTA</Text>
        </View>

        {/* SECÇÃO DO FORMULÁRIO */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeTitle}>Seja Bem vindo!</Text>
          <Text style={styles.subTitle}>Inicie sessão para gerir o seu negócio</Text>

          {/* Campo de E-mail */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-mail Profissional</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="exemplo@loja.com"
                placeholderTextColor="#cbd5e1"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Campo de Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Palavra-passe</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="A sua senha segura"
                placeholderTextColor="#cbd5e1"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
              />
              <Pressable 
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#94a3b8" 
                />
              </Pressable>
            </View>
          </View>

          <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push("/(auth)/forgot-password")}
          >
          <Text style={styles.forgotText}>Esqueci minha senha!</Text>
          </TouchableOpacity>


          {/* Botão de Login */}
          <TouchableOpacity 
            onPress={handleLogin} 
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Acessar sua Loja</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* RODAPÉ */}
        <View style={styles.footer}>
          <Text style={styles.noAccountText}>Ainda não é parceiro? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={styles.linkText}>Criar Conta</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 16,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  portalTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 2,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF6',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotText: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 18,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 30,   // ↓ reduzido
  marginBottom: 50,
},
  noAccountText: {
    fontSize: 14,
    color: '#64748b',
  },
  linkText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontWeight: '800',
  },
});