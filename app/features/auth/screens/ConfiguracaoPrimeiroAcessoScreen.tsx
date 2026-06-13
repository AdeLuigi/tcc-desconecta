import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"

interface ConfiguracaoPrimeiroAcessoScreenProps extends AppStackScreenProps<"ConfiguracaoPrimeiroAcesso"> {}

export const ConfiguracaoPrimeiroAcessoScreen: React.FC<ConfiguracaoPrimeiroAcessoScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Configuração Primeiro Acesso
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            text="Continuar → Home dinâmica"
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
