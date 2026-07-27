import React from "react"
import { ViewStyle, TextStyle, Platform } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useAppTheme } from "@/theme/context"

// Screens - Main Tabs
import { HomeDinamicaScreen } from "@/features/screen-time/screens/HomeDinamicaScreen"
import { GruposDeAmigosScreen } from "@/features/grupos/screens/GruposDeAmigosScreen"
import { DesafiosPublicosScreen } from "@/features/desafios/screens/DesafiosPublicosScreen"
import { EstatisticaPessoalResumidaScreen } from "@/features/screen-time/screens/EstatisticaPessoalResumidaScreen"

// Screens - Shared (accessible from any tab)
import { SelecionarTipoGrupoScreen } from "@/features/grupos/screens/SelecionarTipoGrupoScreen"
import { CriarNovoGrupoScreen } from "@/features/grupos/screens/CriarNovoGrupoScreen"
import { SelecionarCriterioGrupoScreen } from "@/features/grupos/screens/SelecionarCriterioGrupoScreen"
import { SelecionarAppsDesafioScreen } from "@/features/desafios/screens/SelecionarAppsDesafioScreen"
import { PaginaDoGrupoScreen } from "@/features/grupos/screens/PaginaDoGrupoScreen"
import { AtividadeScreen } from "@/features/desafios/screens/AtividadeScreen"
import { RankingScreen } from "@/features/grupos/screens/RankingScreen"
import { BatepapoScreen } from "@/features/grupos/screens/BatepapoScreen"
import { DetalhesDoGrupoScreen } from "@/features/grupos/screens/DetalhesDoGrupoScreen"
import { DetalhesDoUsuarioScreen } from "@/features/grupos/screens/DetalhesDoUsuarioScreen"
import { DesafiosInscritoScreen } from "@/features/desafios/screens/DesafiosInscritoScreen"
import { DesafiosDisponiveisScreen } from "@/features/desafios/screens/DesafiosDisponiveisScreen"
import { AppModoFocoScreen } from "@/features/screen-time/screens/AppModoFocoScreen"
import { FeedDosGruposScreen } from "@/features/grupos/screens/FeedDosGruposScreen"
import { EstatisticasPessoaisScreen } from "@/features/screen-time/screens/EstatisticasPessoaisScreen"
import { PerfilScreen } from "@/features/perfil/screens/PerfilScreen"
import { BloqueioAppsScreen } from "@/features/limites/screens/BloqueioAppsScreen"
import { LimiteTelaScreen } from "@/features/limites/screens/LimiteTelaScreen"
import { LimiteAppsScreen } from "@/features/limites/screens/LimiteAppsScreen"
import { SelecionarAppsLimiteScreen } from "@/features/limites/screens/SelecionarAppsLimiteScreen"
import { ConfigurarLimiteScreen } from "@/features/limites/screens/ConfigurarLimiteScreen"
import { NotificacoesScreen } from "@/features/perfil/screens/NotificacoesScreen"
import { ParticipantesDoGrupoScreen } from "@/features/grupos/screens/ParticipantesDoGrupoScreen"
import { DetalhesDaPostagemScreen } from "@/features/grupos/screens/DetalhesDaPostagemScreen"

// Types
import type { BottomTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<BottomTabParamList>()
const Stack = createNativeStackNavigator()

// Stack Navigator for Home Tab
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeDinamica" component={HomeDinamicaScreen as any} />
      <Stack.Screen name="SelecionarTipoGrupo" component={SelecionarTipoGrupoScreen as any} />
      <Stack.Screen name="CriarNovoGrupo" component={CriarNovoGrupoScreen as any} />
      <Stack.Screen name="SelecionarCriterioGrupo" component={SelecionarCriterioGrupoScreen as any} />
      <Stack.Screen name="SelecionarAppsDesafio" component={SelecionarAppsDesafioScreen as any} />
      <Stack.Screen name="PaginaDoGrupo" component={PaginaDoGrupoScreen as any} />
      <Stack.Screen name="Atividade" component={AtividadeScreen as any} />
      <Stack.Screen name="Ranking" component={RankingScreen as any} />
      <Stack.Screen name="Batepapo" component={BatepapoScreen as any} />
      <Stack.Screen name="DetalhesDoGrupo" component={DetalhesDoGrupoScreen as any} />
      <Stack.Screen name="DetalhesDoUsuario" component={DetalhesDoUsuarioScreen as any} />
      <Stack.Screen name="FeedDosGrupos" component={FeedDosGruposScreen as any} />
      <Stack.Screen name="DesafiosPublicos" component={DesafiosPublicosScreen as any} />
      <Stack.Screen name="DesafiosInscrito" component={DesafiosInscritoScreen as any} />
      <Stack.Screen name="DesafiosDisponiveis" component={DesafiosDisponiveisScreen as any} />
      <Stack.Screen name="AppModoFoco" component={AppModoFocoScreen as any} />
      <Stack.Screen name="EstatisticaPessoalResumida" component={EstatisticaPessoalResumidaScreen as any} />
      <Stack.Screen name="EstatisticasPessoais" component={EstatisticasPessoaisScreen as any} />
      <Stack.Screen name="Perfil" component={PerfilScreen as any} />
      <Stack.Screen name="BloqueioApps" component={BloqueioAppsScreen as any} />
      <Stack.Screen name="LimiteTela" component={LimiteTelaScreen as any} />
      <Stack.Screen name="LimiteApps" component={LimiteAppsScreen as any} />
      <Stack.Screen name="SelecionarAppsLimite" component={SelecionarAppsLimiteScreen as any} />
      <Stack.Screen name="ConfigurarLimite" component={ConfigurarLimiteScreen as any} />
      <Stack.Screen name="ParticipantesDoGrupo" component={ParticipantesDoGrupoScreen as any} />
      <Stack.Screen name="Notificacoes" component={NotificacoesScreen as any} />
      <Stack.Screen name="DetalhesDaPostagem" component={DetalhesDaPostagemScreen as any} />
    </Stack.Navigator>
  )
}

// Stack Navigator for Grupos Tab
const GruposStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GruposDeAmigos" component={GruposDeAmigosScreen as any} />
      <Stack.Screen name="SelecionarTipoGrupo" component={SelecionarTipoGrupoScreen as any} />
      <Stack.Screen name="CriarNovoGrupo" component={CriarNovoGrupoScreen as any} />
      <Stack.Screen name="SelecionarCriterioGrupo" component={SelecionarCriterioGrupoScreen as any} />
      <Stack.Screen name="SelecionarAppsDesafio" component={SelecionarAppsDesafioScreen as any} />
      <Stack.Screen name="PaginaDoGrupo" component={PaginaDoGrupoScreen as any} />
      <Stack.Screen name="Atividade" component={AtividadeScreen as any} />
      <Stack.Screen name="Ranking" component={RankingScreen as any} />
      <Stack.Screen name="Batepapo" component={BatepapoScreen as any} />
      <Stack.Screen name="DetalhesDoGrupo" component={DetalhesDoGrupoScreen as any} />
      <Stack.Screen name="DetalhesDoUsuario" component={DetalhesDoUsuarioScreen as any} />
      <Stack.Screen name="ParticipantesDoGrupo" component={ParticipantesDoGrupoScreen as any} />
      <Stack.Screen name="FeedDosGrupos" component={FeedDosGruposScreen as any} />
      <Stack.Screen name="Notificacoes" component={NotificacoesScreen as any} />
      <Stack.Screen name="DetalhesDaPostagem" component={DetalhesDaPostagemScreen as any} />
    </Stack.Navigator>
  )
}

// Stack Navigator for Desafios Tab
const DesafiosStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DesafiosPublicos" component={DesafiosPublicosScreen as any} />
      <Stack.Screen name="DesafiosInscrito" component={DesafiosInscritoScreen as any} />
      <Stack.Screen name="DesafiosDisponiveis" component={DesafiosDisponiveisScreen as any} />
      <Stack.Screen name="Notificacoes" component={NotificacoesScreen as any} />
    </Stack.Navigator>
  )
}

// Stack Navigator for Conquistas Tab
const ConquistasStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EstatisticaPessoalResumida" component={EstatisticaPessoalResumidaScreen as any} />
      <Stack.Screen name="EstatisticasPessoais" component={EstatisticasPessoaisScreen as any} />
      <Stack.Screen name="Notificacoes" component={NotificacoesScreen as any} />
    </Stack.Navigator>
  )
}

// Stack Navigator for Ajustes Tab
const AjustesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Perfil" component={PerfilScreen as any} />
      <Stack.Screen name="BloqueioApps" component={BloqueioAppsScreen as any} />
      <Stack.Screen name="LimiteTela" component={LimiteTelaScreen as any} />
      <Stack.Screen name="LimiteApps" component={LimiteAppsScreen as any} />
      <Stack.Screen name="SelecionarAppsLimite" component={SelecionarAppsLimiteScreen as any} />
      <Stack.Screen name="ConfigurarLimite" component={ConfigurarLimiteScreen as any} />
      <Stack.Screen name="AppModoFoco" component={AppModoFocoScreen as any} />
      <Stack.Screen name="Notificacoes" component={NotificacoesScreen as any} />
    </Stack.Navigator>
  )
}

export const BottomTabNavigator = () => {
  const {
    theme: { colors, spacing },
  } = useAppTheme()
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#322D70",
          borderTopColor: "#322D70",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 85 : 65 + insets.bottom,
          paddingBottom: Platform.OS === "ios" ? 25 : 10 + insets.bottom,
          paddingTop: 8,
        } as ViewStyle,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: -2,
        } as TextStyle,
      }}
    >
      <Tab.Screen
        name="Grupos"
        component={GruposStack}
        options={{
          tabBarLabel: "Grupos",
          tabBarLabelStyle: { color: "#FFFFFF" },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={size}
              color="#FFFFFF"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Desafios"
        component={DesafiosStack}
        options={{
          tabBarLabel: "Desafios",
          tabBarLabelStyle: { color: "#FFFFFF" },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "flash" : "flash-outline"}
              size={size}
              color="#FFFFFF"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: "Home",
          tabBarLabelStyle: { color: "#FFFFFF" },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color="#FFFFFF"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Conquistas"
        component={ConquistasStack}
        options={{
          tabBarLabel: "Conquistas",
          tabBarLabelStyle: { color: "#FFFFFF" },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={size}
              color="#FFFFFF"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Ajustes"
        component={AjustesStack}
        options={{
          tabBarLabel: "Ajustes",
          tabBarLabelStyle: { color: "#FFFFFF" },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color="#FFFFFF"
            />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
