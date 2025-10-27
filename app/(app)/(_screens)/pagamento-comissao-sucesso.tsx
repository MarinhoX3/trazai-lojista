import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function PagamentoSucesso() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pagamento realizado com sucesso!</Text>
      <Pressable style={styles.button} onPress={() => router.push('/financeiro')}>
        <Text style={styles.buttonText}>Voltar ao Financeiro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  title: { fontSize:22, fontWeight:'bold', marginBottom:20, textAlign:'center' },
  button: { backgroundColor:'#28a745', padding:15, borderRadius:8 },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
});
