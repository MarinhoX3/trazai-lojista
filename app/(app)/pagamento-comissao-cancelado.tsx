import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function PagamentoCancelado() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>O pagamento foi cancelado.</Text>
      <Pressable style={styles.button} onPress={() => router.push('/financeiro')}>
        <Text style={styles.buttonText}>Voltar ao Financeiro</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  title: { fontSize:22, fontWeight:'bold', marginBottom:20, textAlign:'center' },
  button: { backgroundColor:'#dc3545', padding:15, borderRadius:8 },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
});
