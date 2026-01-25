/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { LoginScreen } from "@/screens/LoginScreen"
import { WelcomeScreen } from "@/screens/WelcomeScreen"
import { BemVindoScreen } from "@/screens/BemVindoScreen"
import { OnboardingScreen } from "@/screens/OnboardingScreen"
import { CadastroScreen } from "@/screens/CadastroScreen"
import { ConfiguracaoPrimeiroAcessoScreen } from "@/screens/ConfiguracaoPrimeiroAcessoScreen"
import { HomeDinamicaScreen } from "@/screens/HomeDinamicaScreen"
import { GruposDeAmigosScreen } from "@/screens/GruposDeAmigosScreen"
import { CriarNovoGrupoScreen } from "@/screens/CriarNovoGrupoScreen"
import { PaginaDoGrupoScreen } from "@/screens/PaginaDoGrupoScreen"
import { AtividadeScreen } from "@/screens/AtividadeScreen"
import { RankingScreen } from "@/screens/RankingScreen"
import { BatepapoScreen } from "@/screens/BatepapoScreen"
import { DetalhesDoGrupoScreen } from "@/screens/DetalhesDoGrupoScreen"
import { DesafiosPublicosScreen } from "@/screens/DesafiosPublicosScreen"
import { DesafiosInscritoScreen } from "@/screens/DesafiosInscritoScreen"
import { DesafiosDisponiveisScreen } from "@/screens/DesafiosDisponiveisScreen"
import { AppModoFocoScreen } from "@/screens/AppModoFocoScreen"
import { FeedDosGruposScreen } from "@/screens/FeedDosGruposScreen"
import { EstatisticaPessoalResumidaScreen } from "@/screens/EstatisticaPessoalResumidaScreen"
import { EstatisticasPessoaisScreen } from "@/screens/EstatisticasPessoaisScreen"
import { ConfiguracoesScreen } from "@/screens/ConfiguracoesScreen"
import { PerfilScreen } from "@/screens/PerfilScreen"
import { BloqueioAppsScreen } from "@/screens/BloqueioAppsScreen"
import { LimiteTelaScreen } from "@/screens/LimiteTelaScreen"
import { LimiteAppsScreen } from "@/screens/LimiteAppsScreen"
import { NotificacoesScreen } from "@/screens/NotificacoesScreen"
import { useAppTheme } from "@/theme/context"

import { DemoNavigator } from "./DemoNavigator"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated } = useAuth()

  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={isAuthenticated ? "HomeDinamica" : "BemVindo"}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="HomeDinamica" component={HomeDinamicaScreen} />
          <Stack.Screen name="GruposDeAmigos" component={GruposDeAmigosScreen} />
          <Stack.Screen name="CriarNovoGrupo" component={CriarNovoGrupoScreen} />
          <Stack.Screen name="PaginaDoGrupo" component={PaginaDoGrupoScreen} />
          <Stack.Screen name="Atividade" component={AtividadeScreen} />
          <Stack.Screen name="Ranking" component={RankingScreen} />
          <Stack.Screen name="Batepapo" component={BatepapoScreen} />
          <Stack.Screen name="DetalhesDoGrupo" component={DetalhesDoGrupoScreen} />
          <Stack.Screen name="DesafiosPublicos" component={DesafiosPublicosScreen} />
          <Stack.Screen name="DesafiosInscrito" component={DesafiosInscritoScreen} />
          <Stack.Screen name="DesafiosDisponiveis" component={DesafiosDisponiveisScreen} />
          <Stack.Screen name="AppModoFoco" component={AppModoFocoScreen} />
          <Stack.Screen name="FeedDosGrupos" component={FeedDosGruposScreen} />
          <Stack.Screen name="EstatisticaPessoalResumida" component={EstatisticaPessoalResumidaScreen} />
          <Stack.Screen name="EstatisticasPessoais" component={EstatisticasPessoaisScreen} />
          <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
          <Stack.Screen name="BloqueioApps" component={BloqueioAppsScreen} />
          <Stack.Screen name="LimiteTela" component={LimiteTelaScreen} />
          <Stack.Screen name="LimiteApps" component={LimiteAppsScreen} />
          <Stack.Screen name="Notificacoes" component={NotificacoesScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Demo" component={DemoNavigator} />
        </>
      ) : (
        <>
          <Stack.Screen name="BemVindo" component={BemVindoScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} />
          <Stack.Screen name="ConfiguracaoPrimeiroAcesso" component={ConfiguracaoPrimeiroAcessoScreen} />
        </>
      )}

      {/** 🔥 Your screens go here */}
      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
