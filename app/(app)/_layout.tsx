// app/(app)/_layout.tsx
import { Slot } from "expo-router";
import { useAuthLoja } from "../../src/api/contexts/AuthLojaContext";
import { usePushNotifications } from "../../src/hooks/usePushNotifications";

export default function AppLayout() {
  const { loja, loading } = useAuthLoja();

  // 🔥 CHAMA DIRETO O HOOK — SEM CONDICIONAL
  usePushNotifications(loja?.id);

  return <Slot />;
}
