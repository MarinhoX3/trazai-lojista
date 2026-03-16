"use client";

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Linking } from "react-native";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
        </View>

        {/* TÍTULO */}
        <Text style={styles.title}>Crie sua loja grátis</Text>

        <Text style={styles.subtitle}>
          Cadastre sua loja no TrazAí e compartilhe com seus clientes.
Eles poderão ver seus produtos e fazer pedidos pelo app.
        </Text>

        {/* BENEFÍCIOS */}
        <View style={styles.benefits}>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Crie sua loja em 2 minutos</Text>
          </View>

          

          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Receba pedidos de clientes do bairro</Text>
          </View>

          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Sem mensalidade</Text>
          </View>
        </View>

<Text style={styles.commissionText}>
 Você só paga uma pequena comissão quando fizer uma venda.
</Text>

{/* BOTÃO CRIAR CONTA */}
<TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.createButtonText}>Criar minha loja grátis</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
  style={styles.whatsappButton}
  onPress={() =>
  Linking.openURL(
    "https://wa.me/5585920013692?text=Olá,%20quero%20criar%20minha%20loja%20no%20TrazAí"
  )
}
>
  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
  <Text style={styles.whatsappText}>
  Precisa de ajuda?{"\n"}
  Montamos sua loja para você no WhatsApp.
</Text>
</TouchableOpacity>

        {/* LOGIN */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já tem conta?</Text>

          <TouchableOpacity onPress={() => router.push("/(auth)")}>
            <Text style={styles.loginLink}>Entrar na sua conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  commissionText: {
  textAlign: "center",
  fontSize: 13,
  color: "#64748b",
  marginBottom: 25,
},

  content: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    width: 90,
    height: 90,
    resizeMode: "contain",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E3A8A",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 30,
  },

  benefits: {
    marginBottom: 40,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  benefitText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },

  createButton: {
    backgroundColor: "#1E3A8A",
    height: 58,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 8,
  },

  loginContainer: {
    marginTop: 25,
    alignItems: "center",
  },

  loginText: {
    fontSize: 14,
    color: "#64748b",
  },

  loginLink: {
    fontSize: 14,
    color: "#1E3A8A",
    fontWeight: "800",
    marginTop: 4,
  },
  whatsappButton: {
  marginTop: 18,
  alignItems: "center",
  justifyContent: "center"
},

whatsappText: {
  marginTop: 6,
  fontSize: 14,
  color: "#25D366",
  fontWeight: "700",
  textAlign: "center"
}
});