import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export default function Splash({ onFinish }: { onFinish: () => void }) {
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    const timer = setTimeout(onFinish, 2500);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/logo.png")}
        style={[styles.logo, { transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 110,
    height: 110,
  },
});
