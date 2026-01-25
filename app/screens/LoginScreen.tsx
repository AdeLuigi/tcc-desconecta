import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, ViewStyle, View, TouchableOpacity, Image, ImageStyle } from "react-native"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const Logo = require("@assets/images/logo.png")

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = ({ navigation }) => {
  const authPasswordInput = useRef<TextInput>(null)

  const [authPassword, setAuthPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { authEmail, setAuthEmail, setAuthToken, validationError } = useAuth()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const error = isSubmitted ? validationError : ""

  function login() {
    setIsSubmitted(true)

    if (validationError) return

    // Make a request to your server to get an authentication token.
    // If successful, reset the fields and set the token.
    setIsSubmitted(false)
    setAuthPassword("")
    setAuthEmail("")

    // We'll mock this with a fake token.
    setAuthToken(String(Date.now()))
  }

  function loginWithGoogle() {
    // Implementar login com Google aqui
    console.log("Login com Google")
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        )
      },
    [isAuthPasswordHidden, colors.palette.neutral800],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
      style={themed($screen)}
    >
      <View style={themed($container)}>
        {/* Logo */}
        <View style={themed($logoContainer)}>
          <Text style={themed($logo)}>DESCONECTA</Text>
          <Image source={Logo} resizeMode="contain" />
        </View>

        {/* Form */}
        <View style={themed($formContainer)}>
          <TextField
            value={authEmail}
            onChangeText={setAuthEmail}
            containerStyle={themed($textField)}
            inputWrapperStyle={themed($inputWrapper)}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            helper={error}
            status={error ? "error" : undefined}
            onSubmitEditing={() => authPasswordInput.current?.focus()}
          />

          <TextField
            ref={authPasswordInput}
            value={authPassword}
            onChangeText={setAuthPassword}
            containerStyle={themed($textField)}
            inputWrapperStyle={themed($inputWrapper)}
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            secureTextEntry={isAuthPasswordHidden}
            placeholder="Senha"
            onSubmitEditing={login}
            RightAccessory={PasswordRightAccessory}
          />

          <Button
            testID="login-button"
            text="Entrar"
            style={themed($loginButton)}
            textStyle={themed($loginButtonText)}
            onPress={login}
          />

          {/* Divider */}
          <View style={themed($dividerContainer)}>
            <View style={themed($dividerLine)} />
            <Text style={themed($dividerText)}>ou</Text>
            <View style={themed($dividerLine)} />
          </View>

          {/* Google Button */}
          <TouchableOpacity style={themed($googleButton)} onPress={loginWithGoogle}>
            <Text style={themed($googleIcon)}>G</Text>
            <Text style={themed($googleButtonText)}>Continuar com Google</Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={themed($signupContainer)}>
            <Text style={themed($signupText)}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
              <Text style={themed($signupLink)}>Cadastre-se aqui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Screen>
  )
}

const $Logo: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: 88,
  width: "100%",
  marginBottom: spacing.xxl,
})

const $screen: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: "#3D2F7D",
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $logoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxxl,
  alignItems: "center",
})

const $logo: ThemedStyle<TextStyle> = () => ({
  fontSize: 32,
  fontWeight: "bold",
  color: "#FFFFFF",
  letterSpacing: 2,
})

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  maxWidth: 400,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $inputWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "#FFFFFF",
  borderRadius: 8,
  borderWidth: 0,
  paddingHorizontal: spacing.md,
})

const $loginButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "#6DCED6",
  borderRadius: 8,
  marginTop: spacing.md,
  paddingVertical: spacing.md,
})

const $loginButtonText: ThemedStyle<TextStyle> = () => ({
  color: "#3D2F7D",
  fontWeight: "600",
  fontSize: 16,
})

const $dividerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginVertical: spacing.lg,
})

const $dividerLine: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  height: 1,
  backgroundColor: "#8B7AB8",
})

const $dividerText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  color: "#FFFFFF",
  marginHorizontal: spacing.md,
  fontSize: 14,
})

const $googleButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: 8,
  paddingVertical: spacing.md,
  gap: spacing.sm,
})

const $googleIcon: ThemedStyle<TextStyle> = () => ({
  fontSize: 18,
  fontWeight: "bold",
  color: "#4285F4",
})

const $googleButtonText: ThemedStyle<TextStyle> = () => ({
  color: "#3D2F7D",
  fontSize: 14,
  fontWeight: "500",
})

const $signupContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "center",
  marginTop: spacing.xl,
})

const $signupText: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 14,
})

const $signupLink: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "bold",
  textDecorationLine: "underline",
})
