import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"

interface PaginaDoGrupoScreenProps extends AppStackScreenProps<"PaginaDoGrupo"> {}

export const PaginaDoGrupoScreen: React.FC<PaginaDoGrupoScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Página da carta grupo
        </Text>
        <Text style={styles.subtitle}>(estatísticas e feed)</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            text="Atividade"
            onPress={() => navigation.navigate("Atividade")}
            style={styles.button}
          />
          <Button
            text="Ranking"
            onPress={() => navigation.navigate("Ranking")}
            style={styles.button}
          />
          <Button
            text="Batepapo"
            onPress={() => navigation.navigate("Batepapo")}
            style={styles.button}
          />
          <Button
            text="Voltar → Grupos de amigos"
            onPress={() => navigation.navigate("GruposDeAmigos")}
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
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
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
