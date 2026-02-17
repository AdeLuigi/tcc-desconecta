import React from "react"
import { ViewStyle, TextStyle, Platform } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useAppTheme } from "@/theme/context"

// Screens - Main Tabs
import { HomeDinamicaScreen } from "@/screens/HomeDinamicaScreen"
import { GruposDeAmigosScreen } from "@/screens/GruposDeAmigosScreen"
import { DesafiosPublicosScreen } from "@/screens/DesafiosPublicosScreen"
import { EstatisticaPessoalResumidaScreen } from "@/screens/EstatisticaPessoalResumidaScreen"
import { ConfiguracoesScreen } from "@/screens/ConfiguracoesScreen"

// Screens - Shared (accessible from any tab)
import { CriarNovoGrupoScreen } from "@/screens/CriarNovoGrupoScreen"
import { PaginaDoGrupoScreen } from "@/screens/PaginaDoGrupoScreen"
import { AtividadeScreen } from "@/screens/AtividadeScreen"
import { RankingScreen } from "@/screens/RankingScreen"
import { BatepapoScreen } from "@/screens/BatepapoScreen"
import { DetalhesDoGrupoScreen } from "@/screens/DetalhesDoGrupoScreen"
import { DetalhesDoUsuarioScreen } from "@/screens/DetalhesDoUsuarioScreen"
import { DesafiosInscritoScreen } from "@/screens/DesafiosInscritoScreen"
import { DesafiosDisponiveisScreen } from "@/screens/DesafiosDisponiveisScreen"
import { AppModoFocoScreen } from "@/screens/AppModoFocoScreen"
import { FeedDosGruposScreen } from "@/screens/FeedDosGruposScreen"
import { EstatisticasPessoaisScreen } from "@/screens/EstatisticasPessoaisScreen"
import { PerfilScreen } from "@/screens/PerfilScreen"
import { BloqueioAppsScreen } from "@/screens/BloqueioAppsScreen"
import { LimiteTelaScreen } from "@/screens/LimiteTelaScreen"
import { LimiteAppsScreen } from "@/screens/LimiteAppsScreen"
import { NotificacoesScreen } from "@/screens/NotificacoesScreen"

// Types
import type { BottomTabParamList } from "./navigationTypes"

const Tab = createBottomTabNavigator<BottomTabParamList>()
const Stack = createNativeStackNavigator()

// Stack Navigator for Home Tab
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeDinamica" component={HomeDinamicaScreen as any} />
      <Stack.Screen name="CriarNovoGrupo" component={CriarNovoGrupoScreen as any} />
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
      <Stack.Screen name="Notificacoes" component={NotificacoesScreen as any} />
    </Stack.Navigator>
  )
}

// Stack Navigator for Grupos Tab
const GruposStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GruposDeAmigos" component={GruposDeAmigosScreen as any} />
      <Stack.Screen name="CriarNovoGrupo" component={CriarNovoGrupoScreen as any} />
      <Stack.Screen name="PaginaDoGrupo" component={PaginaDoGrupoScreen as any} />
      <Stack.Screen name="Atividade" component={AtividadeScreen as any} />
      <Stack.Screen name="Ranking" component={RankingScreen as any} />
      <Stack.Screen name="Batepapo" component={BatepapoScreen as any} />
      <Stack.Screen name="DetalhesDoGrupo" component={DetalhesDoGrupoScreen as any} />
      <Stack.Screen name="DetalhesDoUsuario" component={DetalhesDoUsuarioScreen as any} />
      <Stack.Screen name="FeedDosGrupos" component={FeedDosGruposScreen as any} />
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
    </Stack.Navigator>
  )
}

// Stack Navigator for Conquistas Tab
const ConquistasStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EstatisticaPessoalResumida" component={EstatisticaPessoalResumidaScreen as any} />
      <Stack.Screen name="EstatisticasPessoais" component={EstatisticasPessoaisScreen as any} />
    </Stack.Navigator>
  )
}

// Stack Navigator for Ajustes Tab
const AjustesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Perfil" component={PerfilScreen as any} />
      <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen as any} />
      <Stack.Screen name="BloqueioApps" component={BloqueioAppsScreen as any} />
      <Stack.Screen name="LimiteTela" component={LimiteTelaScreen as any} />
      <Stack.Screen name="LimiteApps" component={LimiteAppsScreen as any} />
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
