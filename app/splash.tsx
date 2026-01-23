"use client";

import React, { useEffect, useRef } from "react";
import {
  View,
  Animated,
  StyleSheet,
  StatusBar,
  Text,
  Dimensions,
  Easing,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function Splash({ onFinish }: { onFinish: () => void }) {
  // Referências de Animação
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  
  const bgCircle1 = useRef(new Animated.Value(0)).current;
  const bgCircle2 = useRef(new Animated.Value(0)).current;
  
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Animação de Fundo (Loop infinito de flutuação)
    const floatAnimation = (val: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    floatAnimation(bgCircle1, 4000).start();
    floatAnimation(bgCircle2, 5000).start();

    // 2. Sequência de Entrada Principal
    Animated.sequence([
      Animated.delay(300),
      
      // Logo "Pop" com Rotação
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1, 
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),

      // Texto e Badge
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),

      // Footer aparece por último
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onFinish, 3500);
    return () => clearTimeout(timer);
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "0deg"],
  });

  const bgMove1 = bgCircle1.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  const bgMove2 = bgCircle2.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -20],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Elementos Decorativos de Fundo (Ajustados para fundo claro) */}
      <Animated.View 
        style={[
          styles.glow, 
          { top: -50, left: -50, transform: [{ translateY: bgMove1 }] }
        ]} 
      />
      <Animated.View 
        style={[
          styles.glow, 
          { bottom: '20%', right: -80, width: 250, height: 250, transform: [{ translateX: bgMove2 }] }
        ]} 
      />

      <View style={styles.content}>
        {/* Logo Wrapper */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { rotate: spin }
              ],
            },
          ]}
        >
          <Animated.Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Content */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            alignItems: "center",
            marginTop: 25,
          }}
        >
          <Text style={styles.brandName}>Seja bem vindo!</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>LOJISTA</Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer / Loading Indicator */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <View style={styles.loaderBarContainer}>
            <Animated.View style={styles.loaderBarInner} />
        </View>
        <Text style={styles.loadingText}>Preparando seu painel...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", 
    alignItems: "center",
    justifyContent: "center",
    overflow: 'hidden',
  },
  glow: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(30, 58, 138, 0.04)", // Azul muito suave para o fundo branco
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    backgroundColor: "#ffffff",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    // Sombras mais suaves para fundo branco
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  logo: {
    width: 95,
    height: 95,
  },
  brandName: {
    fontSize: 30,
    fontWeight: "900",
    color: "rgb(0, 0, 0)", // Texto em verde para contraste
    letterSpacing: -1,
  },
  badge: {
    backgroundColor: "rgb(25, 25, 119)", 
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    color: "#ffffffff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 60,
    alignItems: 'center',
    width: '100%',
  },
  loaderBarContainer: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(30, 58, 138, 0.1)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden'
  },
  loaderBarInner: {
    width: '60%', 
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 2,
  },
  loadingText: {
    color: "#1E3A8A",
    opacity: 0.6,
    fontSize: 14,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});