import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "@react-native-firebase/firestore"
import { useAuth } from "@/context/AuthContext"

interface DetalhesDoUsuarioScreenProps extends AppStackScreenProps<"DetalhesDoUsuario"> {}

export const DetalhesDoUsuarioScreen: React.FC<DetalhesDoUsuarioScreenProps> = ({ navigation, route }) => {
  const { theme } = useAppTheme()
  const { userId } = route.params
  const { userData: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [estatisticas, setEstatisticas] = useState<{
    tempoTelaHoje: number | null
    tempoTelaSemana: number | null
  }>({
    tempoTelaHoje: null,
    tempoTelaSemana: null,
  })

  useEffect(() => {
    loadUserDetails()
  }, [userId])

  const loadUserDetails = async () => {
    try {
      setLoading(true)
      const db = getFirestore()

      // Buscar informações básicas do usuário
      const userRef = doc(db, "usuarios", userId)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        console.error("Usuário não encontrado")
        navigation.goBack()
        return
      }

      const userData = userDoc.data()
      if (!userData) {
        console.error("Dados do usuário não encontrados")
        navigation.goBack()
        return
      }

      setUserInfo({
        userId,
        nome: userData.nome || "Usuário",
        email: userData.email || "",
        photoURL: userData.photoURL || "",
        descricao: userData.descricao || "Este usuário ainda não adicionou uma descrição.",
        dataCriacao: userData.data_criacao?.toDate?.() || new Date(),
      })

      // Buscar estatísticas
      await loadEstatisticas(userId)
    } catch (error) {
      console.error("Erro ao carregar detalhes do usuário:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadEstatisticas = async (userId: string) => {
    try {
      const db = getFirestore()
      const hoje = new Date().toISOString().split('T')[0]
      
      // Tempo de tela hoje
      const tempoTelaHojeQuery = query(
        collection(db, "estatisticas"),
        where("userId", "==", userId),
        where("data", "==", hoje)
      )
      const tempoTelaHojeSnapshot = await getDocs(tempoTelaHojeQuery)
      const tempoTelaHoje = tempoTelaHojeSnapshot.empty 
        ? null 
        : tempoTelaHojeSnapshot.docs[0].data()?.tempo_total_minutos || 0

      // Tempo de tela na semana
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - 7)
      const dataInicioStr = dataInicio.toISOString().split('T')[0]
      
      const tempoTelaSemanaQuery = query(
        collection(db, "estatisticas"),
        where("userId", "==", userId),
        where("data", ">=", dataInicioStr)
      )
      const tempoTelaSemanaSnapshot = await getDocs(tempoTelaSemanaQuery)
      let tempoTelaSemana = 0
      tempoTelaSemanaSnapshot.forEach((doc: any) => {
        tempoTelaSemana += doc.data()?.tempo_total_minutos || 0
      })

      setEstatisticas({
        tempoTelaHoje,
        tempoTelaSemana,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  const formatarTempo = (minutos: number | null): string => {
    if (minutos === null) return "Sem dados"
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}m`
  }

  if (loading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon icon="back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Usuário</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#322D70" />
          <Text style={styles.loadingText}>Carregando informações...</Text>
        </View>
      </Screen>
    )
  }

  if (!userInfo) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon icon="back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Usuário</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Usuário não encontrado</Text>
        </View>
      </Screen>
    )
  }

  const isCurrentUser = currentUser?.uid === userId

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon icon="back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Usuário</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Perfil Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {userInfo.photoURL ? (
              <Image
                source={{ uri: userInfo.photoURL }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {userInfo.nome.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{userInfo.nome}</Text>
          {isCurrentUser && <Text style={styles.currentUserBadge}>Você</Text>}
          {userInfo.email && <Text style={styles.userEmail}>{userInfo.email}</Text>}
          <Text style={styles.userDescription}>{userInfo.descricao}</Text>
          <Text style={styles.memberSince}>
            Membro desde {userInfo.dataCriacao.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Estatísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas 📊</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tempo de Tela Hoje</Text>
              <Text style={styles.statValue}>{formatarTempo(estatisticas.tempoTelaHoje)}</Text>
              <Text style={styles.statIcon}>📱</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tempo de Tela (7 dias)</Text>
              <Text style={styles.statValue}>{formatarTempo(estatisticas.tempoTelaSemana)}</Text>
              <Text style={styles.statIcon}>📅</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#322D70",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#322D70",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#6881BA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#322D70",
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  currentUserBadge: {
    fontSize: 14,
    color: "#FFFFFF",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
  },
  userDescription: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  memberSince: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 8,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
})
