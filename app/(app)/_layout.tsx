// app/(app)/_layout.tsx
import { Slot } from "expo-router";
import { useAuthLoja } from "../../src/api/contexts/AuthLojaContext";
import { usePushNotifications } from "../../src/hooks/usePushNotifications";

export default function AppLayout() {
  const { loja } = useAuthLoja();

  // 🔥 Inicializa push + listeners aqui (apenas uma vez)
  usePushNotifications(loja?.id);

  return <Slot />;
}
