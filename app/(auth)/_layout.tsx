// app/(auth)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      {/* Aqui as rotas de autenticação.
          'index' será a rota padrão deste grupo (o Login, que moveremos para cá).
          'register' será a rota /register */}
      <Stack.Screen name="index" options={{ headerShown: false }} /> {/* Tela de Login - nome real: app/(auth)/index.tsx */}
      <Stack.Screen name="register" options={{ title: 'Cadastro de Loja' }} />
      {/* Você pode ajustar options={{ headerShown: false }} aqui se não quiser o cabeçalho padrão */}
    </Stack>
  );
}