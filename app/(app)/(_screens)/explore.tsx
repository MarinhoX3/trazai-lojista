import { StyleSheet, View, Text, ScrollView } from 'react-native';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Explorar</Text>
        <Text style={styles.description}>
          Esta tela está temporariamente simplificada.
        </Text>
        <Text style={styles.description}>
          Você pode personalizá-la depois conforme necessário.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  description: {
    fontSize: 16,
    marginBottom: 12,
    color: '#666',
    lineHeight: 24,
  },
});