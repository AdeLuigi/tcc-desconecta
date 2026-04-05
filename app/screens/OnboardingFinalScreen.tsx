import React from "react"
import { View, StyleSheet } from "react-native"
import { Asset } from "expo-asset"
import { SvgUri } from "react-native-svg"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { markOnboardingCompleted } from "@/utils/onboarding"

interface OnboardingFinalScreenProps extends AppStackScreenProps<"OnboardingFinal"> {}

export const OnboardingFinalScreen: React.FC<OnboardingFinalScreenProps> = ({ navigation }) => {
  const backgroundUri = Asset.fromModule(require("../../assets/images/background-2.svg")).uri
  const illustrationUri = Asset.fromModule(require("../../assets/images/meta-diaria.svg")).uri

  const handleLoginPress = () => {
    markOnboardingCompleted()
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    })
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
      <View style={styles.background} pointerEvents="none">
        <SvgUri uri={backgroundUri} width="100%" height="100%" />
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationWrap}>
          <SvgUri uri={illustrationUri} width="100%" height="100%" />
        </View>
                <Text preset="subheading" style={styles.title}>
                  Defina suas metas!
                </Text>

        <Text preset="subheading" style={styles.text}>
          Estabeleça limites de uso, crie metas personalizadas e acompanhe seu progresso para uma rotina melhor.
        </Text>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            text="Cadastrar conta"
            onPress={() => navigation.navigate("Cadastro")}
            style={[styles.button, styles.skipButton]}
            textStyle={styles.skipButtonText}
          />
          <Button
            text="Login"
            onPress={handleLoginPress}
            style={[styles.button, styles.nextButton]}
            textStyle={styles.nextButtonText}
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
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: "84%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  illustrationWrap: {
    width: 250,
    height: 220,
    marginBottom: 20,
  },
    title: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: 20,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
    gap: 8,
  },
  dot: {
    width: 22,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(156, 182, 228, 0.65)",
  },
  dotActive: {
    backgroundColor: "#74D0E6",
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderWidth: 0,
    borderRadius: 8,
  },
  skipButton: {
    backgroundColor: "#C9D7F2",
  },
  skipButtonText: {
    color: "#4A4E8A",
    fontWeight: "600",
  },
  nextButton: {
    backgroundColor: "#74D0E6",
  },
  nextButtonText: {
    color: "#315B8A",
    fontWeight: "600",
  },
})
