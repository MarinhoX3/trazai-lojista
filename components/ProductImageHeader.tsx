import { Pressable, StyleSheet, View } from "react-native"
import { Image } from "react-native"

interface Props {
  imageUri: string | null
  onPress?: () => void
}

export function ProductImageHeader({ imageUri, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 240,
    backgroundColor: "#eee",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden", // 🔥 obrigatório no Android
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#e5e5e5",
  },
})
