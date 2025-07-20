// app/(app)/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      {/* Apenas renderiza o grupo de abas. Nada mais por enquanto. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
