// app/(app)/_layout.tsx
import { Slot } from "expo-router";
import { useAuthLoja } from "../../src/api/contexts/AuthLojaContext";

export default function AppLayout() {
  const { loja } = useAuthLoja();

  // ❌ NADA de usePushNotifications aqui!
  return <Slot />;
}
