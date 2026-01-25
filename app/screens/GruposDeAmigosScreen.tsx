import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"

interface GruposDeAmigosScreenProps extends AppStackScreenProps<"GruposDeAmigos"> {}

export const GruposDeAmigosScreen: React.FC<GruposDeAmigosScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Grupos de amigos
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            text="Criar novo grupo"
            onPress={() => navigation.navigate("CriarNovoGrupo")}
            style={styles.button}
          />
          <Button
            text="Ver página de um grupo"
            onPress={() => navigation.navigate("PaginaDoGrupo")}
            style={styles.button}
          />
          <Button
            text="Voltar → Home dinâmica"
            onPress={() => navigation.navigate("HomeDinamica")}
            style={styles.button}
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  content: {
    width: "80%",
    alignItems: "center",
  },
  title: {
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  button: {
    width: "100%",
  },
})
