import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"

interface EstatisticasPessoaisScreenProps extends AppStackScreenProps<"EstatisticasPessoais"> {}

export const EstatisticasPessoaisScreen: React.FC<EstatisticasPessoaisScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Estatísticas pessoais
        </Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>• Streak</Text>
          <Text style={styles.infoText}>• Prêmios do mês (colecionáveis digitais)</Text>
          <Text style={styles.infoText}>• Comparação da média de tempo de tela com semana anterior</Text>
          <Text style={styles.infoText}>• Tempo em cada tipo de app (rede social, entretenimento, utilitários...)</Text>
        </View>
        
        <View style={styles.buttonContainer}>
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
    textAlign: "center",
  },
  infoContainer: {
    width: "100%",
    marginBottom: 32,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  infoText: {
    marginVertical: 4,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  button: {
    width: "100%",
  },
})
