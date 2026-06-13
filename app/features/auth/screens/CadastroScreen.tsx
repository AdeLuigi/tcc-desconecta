import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"

interface CadastroScreenProps extends AppStackScreenProps<"Cadastro"> {}

export const CadastroScreen: React.FC<CadastroScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Cadastro
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            text="Já tenho cadastro → Login"
            onPress={() => navigation.navigate("Login")}
            style={styles.button}
          />
          <Button
            text="Finalizar cadastro → Configuração Primeiro Acesso"
            onPress={() => navigation.navigate("ConfiguracaoPrimeiroAcesso")}
            style={styles.button}
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
