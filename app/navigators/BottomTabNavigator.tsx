import React from "react"
import { ViewStyle, TextStyle, Platform } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { useAppTheme } from "@/theme/context"

// Screens - Main  
import { HomeDinamicaScreen } from "@/screens/HomeDinamicaScreen"
import { GruposDeAmigosScreen } from "@/screens/GruposDeAmigosScreen"
import { DesafiosPublicosScreen } from "@/screens/DesafiosPublicosScreen"
import { EstatisticaPessoalResumidaScreen } from "@/screens/EstatisticaPessoalResumidaScreen"
import { ConfiguracoesScreen } from "@/screens/ConfiguracoesScreen"

// Screens - Secondary
import { CriarNovoGrupoScreen } from "@/screens/CriarNovoGrupoScreen"
import { PaginaDoGrupoScreen } from "@/screens/PaginaDoGrupoScreen"
import { AtividadeScreen } from "@/screens/AtividadeScreen"
import { RankingScreen } from "@/screens/RankingScreen"
import { BatepapoScreen } from "@/screens/BatepapoScreen"
import { DetalhesDoGrupoScreen } from "@/screens/DetalhesDoGrupoScreen"
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
const GruposStack = createNativeStackNavigator()
const DesafiosStack = createNativeStackNavigator()
const HomeStack = createNativeStackNavigator()
const ConquistasStack = createNativeStackNavigator()
const AjustesStack = createNativeStackNavigator()

// Stack Navigators for each tab
const GruposStackNavigator = () => (
  <GruposStack.Navigator screenOptions={{ headerShown: false }}>
    <GruposStack.Screen name="GruposDeAmigosMain" component={GruposDeAmigosScreen as any} />
    <GruposStack.Screen name="CriarNovoGrupo" component={CriarNovoGrupoScreen as any} />
    <GruposStack.Screen name="PaginaDoGrupo" component={PaginaDoGrupoScreen as any} />
    <GruposStack.Screen name="Atividade" component={AtividadeScreen as any} />
    <GruposStack.Screen name="Ranking" component={RankingScreen as any} />
    <GruposStack.Screen name="Batepapo" component={BatepapoScreen as any} />
    <GruposStack.Screen name="DetalhesDoGrupo" component={DetalhesDoGrupoScreen as any} />
    <GruposStack.Screen name="FeedDosGrupos" component={FeedDosGruposScreen as any} />
  </GruposStack.Navigator>
)

const DesafiosStackNavigator = () => (
  <DesafiosStack.Navigator screenOptions={{ headerShown: false }}>
    <DesafiosStack.Screen name="DesafiosPublicosMain" component={DesafiosPublicosScreen as any} />
    <DesafiosStack.Screen name="DesafiosInscrito" component={DesafiosInscritoScreen as any} />
    <DesafiosStack.Screen name="DesafiosDisponiveis" component={DesafiosDisponiveisScreen as any} />
  </DesafiosStack.Navigator>
)

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeDinamicaMain" component={HomeDinamicaScreen as any} />
    <HomeStack.Screen name="AppModoFoco" component={AppModoFocoScreen as any} />
    <HomeStack.Screen name="Notificacoes" component={NotificacoesScreen as any} />
  </HomeStack.Navigator>
)

const ConquistasStackNavigator = () => (
  <ConquistasStack.Navigator screenOptions={{ headerShown: false }}>
    <ConquistasStack.Screen name="EstatisticaPessoalResumidaMain" component={EstatisticaPessoalResumidaScreen as any} />
    <ConquistasStack.Screen name="EstatisticasPessoais" component={EstatisticasPessoaisScreen as any} />
  </ConquistasStack.Navigator>
)

const AjustesStackNavigator = () => (
  <AjustesStack.Navigator screenOptions={{ headerShown: false }}>
    <AjustesStack.Screen name="ConfiguracoesMain" component={ConfiguracoesScreen as any} />
    <AjustesStack.Screen name="Perfil" component={PerfilScreen as any} />
    <AjustesStack.Screen name="BloqueioApps" component={BloqueioAppsScreen as any} />
    <AjustesStack.Screen name="LimiteTela" component={LimiteTelaScreen as any} />
    <AjustesStack.Screen name="LimiteApps" component={LimiteAppsScreen as any} />
  </AjustesStack.Navigator>
)

export const BottomTabNavigator = () => {
  const {
    theme: { colors, spacing },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#322D70",
          borderTopColor: "#322D70",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
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
        component={GruposStackNavigator}
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
        component={DesafiosStackNavigator}
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
        component={HomeStackNavigator}
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
        component={ConquistasStackNavigator}
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
        component={AjustesStackNavigator}
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
