import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"

interface DesafiosPublicosScreenProps extends AppStackScreenProps<"DesafiosPublicos"> {}

export const DesafiosPublicosScreen: React.FC<DesafiosPublicosScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Desafios públicos
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            text="Desafios públicos em que já estou inscrito"
            onPress={() => navigation.navigate("DesafiosInscrito")}
            style={styles.button}
          />
          <Button
            text="Desafios públicos disponíveis no mês"
            onPress={() => navigation.navigate("DesafiosDisponiveis")}
            style={styles.button}
          />
          <Button
            text="Voltar → Home dinâmica"
            onPress={() => navigation.navigate("Home")}
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
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  button: {
    width: "100%",
  },
})
