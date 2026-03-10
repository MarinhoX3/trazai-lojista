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
          Venda seus produtos e receba pedidos pelo celular com o TrazAí.
        </Text>

        {/* BENEFÍCIOS */}
        <View style={styles.benefits}>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Crie sua loja em 2 minutos</Text>
          </View>

          

          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Receba pedidos online</Text>
          </View>

          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Sem mensalidade</Text>
          </View>
        </View>

<Text style={styles.commissionText}>
  Sem mensalidade. Você paga apenas comissão quando vender.
</Text>

{/* BOTÃO CRIAR CONTA */}
<TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.createButtonText}>Criar conta grátis</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
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
});