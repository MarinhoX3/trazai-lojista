// app/reset-password.ts
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../src/api/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!senha || !confirmarSenha) {
      Alert.alert("Erro", "Preencha os dois campos de senha.");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/lojas/reset-senha/confirmar", {
        token,
         nova_senha: senha,
      });

      Alert.alert("Sucesso", "Senha alterada com sucesso!");

      router.replace("/(auth)/login"); // volta para login

    } catch (err: any) {
      console.log(err?.response?.data || err);
      Alert.alert(
        "Erro",
        err?.response?.data?.message || "Erro ao redefinir senha."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Criar nova senha
      </Text>

      <Text style={{ marginTop: 10 }}>
        Informe sua nova senha de acesso.
      </Text>

      <TextInput
        placeholder="Nova senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        style={{
          borderWidth: 1,
          marginTop: 20,
          padding: 12,
          borderRadius: 10,
        }}
      />

      <TextInput
        placeholder="Confirmar nova senha"
        secureTextEntry
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        style={{
          borderWidth: 1,
          marginTop: 10,
          padding: 12,
          borderRadius: 10,
        }}
      />

      <TouchableOpacity
        onPress={handleReset}
        style={{
          marginTop: 20,
          backgroundColor: "#1E3A8A",
          padding: 15,
          borderRadius: 10,
        }}
        disabled={loading}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          {loading ? "Salvando..." : "Confirmar nova senha"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
