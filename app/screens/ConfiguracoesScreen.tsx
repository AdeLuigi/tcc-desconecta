import React from "react"
import { View, StyleSheet, Alert } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { useAuth } from "@/context/AuthContext"
import { signOutGoogle } from "@/services/auth"

interface ConfiguracoesScreenProps extends AppStackScreenProps<"Configuracoes"> {}

export const ConfiguracoesScreen: React.FC<ConfiguracoesScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()
  const { logout } = useAuth()

  const handleLogout = async () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await signOutGoogle()
              logout()
              navigation.reset({
                index: 0,
                routes: [{ name: "Onboarding" }],
              })
            } catch (error) {
              console.error("Erro ao fazer logout:", error)
              Alert.alert("Erro", "Não foi possível sair da conta")
            }
          },
        },
      ],
    )
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Configurações
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            text="Perfil"
            onPress={() => navigation.navigate("Perfil")}
            style={styles.button}
          />
          <Button
            text="Bloqueio de apps por horário"
            onPress={() => navigation.navigate("BloqueioApps")}
            style={styles.button}
          />
          <Button
            text="Limite de tela"
            onPress={() => navigation.navigate("LimiteTela")}
            style={styles.button}
          />
          <Button
            text="Limite de apps"
            onPress={() => navigation.navigate("LimiteApps")}
            style={styles.button}
          />
          <Button
            text="Notificações"
            onPress={() => navigation.navigate("Notificacoes")}
            style={styles.button}
          />
          <Button
            text="Sair da conta"
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}
            preset="reversed"
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
  logoutButton: {
    marginTop: 16,
    backgroundColor: "#DC2626",
  },
})
