import { View, Text } from "react-native";
import { Link, useGlobalSearchParams } from "expo-router";

export default function NotFound() {
  const params = useGlobalSearchParams();

  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20
    }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        ❌ Rota não encontrada
      </Text>

      <Text style={{ fontSize: 18 }}>
        O aplicativo tentou abrir esta rota:
      </Text>

      <Text style={{
        marginTop: 20,
        fontSize: 16,
        backgroundColor: "#eee",
        padding: 10,
        borderRadius: 8,
        maxWidth: "90%"
      }}>
        {JSON.stringify(params)}
      </Text>

      <Link href="/(auth)" style={{ marginTop: 20 }}>
        <Text style={{ color: "blue" }}>Voltar ao login</Text>
      </Link>
    </View>
  );
}
