import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../src/api/api";

export default function ValidateTokenScreen() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!token.trim()) {
      Alert.alert("Erro", "Cole o código/token recebido por e-mail.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get(`/lojas/reset-senha/validar/${token}`);

      if (!response.data.valid) {
        Alert.alert("Inválido", "Token inválido ou expirado.");
        return;
      }

      Alert.alert("Sucesso", "Token válido. Agora crie sua nova senha.");

      // 👉 envia token para próxima tela
      router.push({
        pathname: "/reset-password",
        params: { token },
      });

    } catch (err: any) {
      console.log(err?.response?.data || err);
      Alert.alert("Erro", "Token inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Validar código
      </Text>

      <Text style={{ marginTop: 10 }}>
        Cole abaixo o código/token recebido no e-mail.
      </Text>

      <TextInput
        placeholder="cole aqui o token"
        autoCapitalize="none"
        value={token}
        onChangeText={setToken}
        style={{
          borderWidth: 1,
          marginTop: 20,
          padding: 12,
          borderRadius: 10,
        }}
      />

      <TouchableOpacity
        onPress={handleValidate}
        style={{
          marginTop: 20,
          backgroundColor: "#1E3A8A",
          padding: 15,
          borderRadius: 10,
        }}
        disabled={loading}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          {loading ? "Validando..." : "Validar token"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
