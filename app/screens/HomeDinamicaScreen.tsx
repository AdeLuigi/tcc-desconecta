import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { useAuth } from "@/context/AuthContext"

interface HomeDinamicaScreenProps extends AppStackScreenProps<"HomeDinamica"> {}

export const HomeDinamicaScreen: React.FC<HomeDinamicaScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()
  const { setAuthToken } = useAuth()

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Home dinâmica
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            text="Grupos de amigos"
            onPress={() => navigation.navigate("GruposDeAmigos")}
            style={styles.button}
          />
          <Button
            text="Desafios públicos"
            onPress={() => navigation.navigate("DesafiosPublicos")}
            style={styles.button}
          />
          <Button
            text="App em modo foco ativado"
            onPress={() => navigation.navigate("AppModoFoco")}
            style={styles.button}
          />
          <Button
            text="Estatísticas pessoais"
            onPress={() => navigation.navigate("EstatisticasPessoais")}
            style={styles.button}
          />
          <Button
            text="Configurações"
            onPress={() => navigation.navigate("Configuracoes")}
            style={styles.button}
          />
          <Button
            text="Logout"
            onPress={() => setAuthToken(undefined)}
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
