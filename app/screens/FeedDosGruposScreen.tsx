import React from "react"
import { View, StyleSheet } from "react-native"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"

interface FeedDosGruposScreenProps extends AppStackScreenProps<"FeedDosGrupos"> {}

export const FeedDosGruposScreen: React.FC<FeedDosGruposScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text preset="heading" style={styles.title}>
          Feed dos grupos
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            text="Voltar → App em modo foco"
            onPress={() => navigation.navigate("AppModoFoco")}
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
