import { ComponentProps } from "react"
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

// Bottom Tab Navigator types
export type BottomTabParamList = {
  Grupos: undefined
  Desafios: undefined
  Home: undefined
  Conquistas: undefined
  Ajustes: undefined
}

// Demo Tab Navigator types
export type DemoTabParamList = {
  DemoCommunity: undefined
  DemoShowroom: { queryIndex?: string; itemIndex?: string }
  DemoDebug: undefined
  DemoPodcastList: undefined
}

// App Stack Navigator types
export type AppStackParamList = {
  BemVindo: undefined
  Onboarding: undefined
  OnboardingFinal: undefined
  Welcome: undefined
  Login: undefined
  Cadastro: undefined
  ConfiguracaoPrimeiroAcesso: undefined
  MainTabs: NavigatorScreenParams<BottomTabParamList>
  HomeDinamica: undefined
  GruposDeAmigos: undefined
  SelecionarTipoGrupo: undefined
  CriarNovoGrupo: { tipoGrupo: "desafioTempo" | "comunidade" } | undefined
  PaginaDoGrupo: undefined
  Atividade: undefined
  Ranking: undefined
  Batepapo: undefined
  DetalhesDoGrupo: {
    grupo: {
      id: string
      nome: string
      descricao: string
      foto: string
      codigoGrupo: string
      criado_em: string
      membros: Array<{
        userId: string
        cargo: "administrador" | "membro"
        nome: string
      }>
      ranking_mensal: Array<{
        userId: string
        pontos: number
        nome: string
      }>
    }
  }
  DetalhesDoUsuario: {
    userId: string
  }
  DesafiosPublicos: undefined
  DesafiosInscrito: undefined
  DesafiosDisponiveis: undefined
  AppModoFoco: undefined
  FeedDosGrupos: undefined
  EstatisticaPessoalResumida: undefined
  EstatisticasPessoais: undefined
  Configuracoes: undefined
  Perfil: undefined
  BloqueioApps: undefined
  LimiteTela: undefined
  LimiteApps: undefined
  Notificacoes: undefined
  Demo: NavigatorScreenParams<DemoTabParamList>
  // 🔥 Your screens go here
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type BottomTabScreenPropsType<T extends keyof BottomTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export type DemoTabScreenProps<T extends keyof DemoTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<DemoTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export interface NavigationProps extends Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
> {}
