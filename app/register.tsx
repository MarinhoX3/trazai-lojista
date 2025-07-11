import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import api from '../src/api/api';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();

  const [nomeLoja, setNomeLoja] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleRegister = async () => {
    if (!nomeLoja || !cnpjCpf || !email || !senha) {
      Alert.alert('Atenção', 'Nome da loja, CNPJ/CPF, e-mail e senha são obrigatórios.');
      return;
    }

    try {
      await api.post('/lojas', {
        nome_loja: nomeLoja,
        cnpj_cpf: cnpjCpf,
        endereco_loja: endereco,
        telefone_contato: telefone,
        email_login: email,
        senha: senha,
      });

      Alert.alert(
        'Sucesso!',
        'Sua loja foi cadastrada. Você será redirecionado para a tela de login.',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error: any) {
      const mensagemErro = error.response?.data?.message || 'Não foi possível realizar o cadastro.';
      Alert.alert('Erro no Cadastro', mensagemErro);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Cadastro da Loja</Text>

      <TextInput style={styles.input} placeholder="Nome da Loja *" placeholderTextColor="#888" value={nomeLoja} onChangeText={setNomeLoja} />
      <TextInput style={styles.input} placeholder="CNPJ ou CPF *" placeholderTextColor="#888" value={cnpjCpf} onChangeText={setCnpjCpf} />
      <TextInput style={styles.input} placeholder="E-mail de Login *" placeholderTextColor="#888" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha *" placeholderTextColor="#888" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={styles.input} placeholder="Endereço da Loja" placeholderTextColor="#888" value={endereco} onChangeText={setEndereco} />
      <TextInput style={styles.input} placeholder="Telefone de Contato" placeholderTextColor="#888" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      
      <View style={styles.buttonContainer}>
        <Button title="Cadastrar Loja" onPress={handleRegister} />
      </View>
      
      <Pressable onPress={() => router.back()}>
        <Text style={styles.linkText}>Já tenho uma conta. Fazer Login</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
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
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  linkText: {
    color: '#007BFF',
    textAlign: 'center',
    fontSize: 16,
  }
});
