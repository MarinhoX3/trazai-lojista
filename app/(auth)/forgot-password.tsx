import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import api from "../../src/api/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert("Atenção", "Informe o e-mail cadastrado.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/lojas/reset-senha/request", {
        email: email.trim().toLowerCase(),
      });

      Alert.alert(
        "Pronto!",
        "Se o e-mail existir, enviamos um link para redefinir sua senha."
      );

      router.back();

    } catch (error: any) {
      console.log("ERRO RESET:", error?.response?.data || error);

      Alert.alert(
        "Erro",
        error?.response?.data?.message || "Erro ao enviar o e-mail."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Recuperar Senha
      </Text>

      <Text style={{ marginTop: 10 }}>
        Digite seu e-mail cadastrado e enviaremos um link.
      </Text>

      <TextInput
        placeholder="email@loja.com"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          marginTop: 20,
          borderWidth: 1,
          borderRadius: 10,
          padding: 12,
          borderColor: "#000",
          color: "#000",
        }}
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        onPress={handleSend}
        style={{
          marginTop: 20,
          backgroundColor: "#1E3A8A",
          padding: 15,
          borderRadius: 10,
        }}
        disabled={loading}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
