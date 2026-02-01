import React, { useEffect, useState } from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, Alert, ActivityIndicator } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import ProgressBar from "@/components/ProgressBar"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { Icon } from "@/components/Icon"
import ScreenTimeService, { AppUsage } from "@/services/screenTime"
import { getAppCategory, getCategoryEmoji, getCategoryLabel, type AppCategory } from "@/utils/appCategories"
import { getUserGroups, type Group } from "@/services/groupService"
const Logo = require("@assets/images/logo2.png")
const BadgeSocialNetwork = require("@assets/images/badge-social-network.png")
const BadgeWeek = require("@assets/images/badge-week.png")
const BackgroundImage = require("@assets/images/frame home 1.png")
const brainrot = require("@assets/images/brainrot.png")
const familia = require("@assets/images/familia.png")
const iluminados = require("@assets/images/iluminados.png")
import { useAuth } from "@/context/AuthContext"

interface HomeDinamicaScreenProps extends AppStackScreenProps<"HomeDinamica"> {}

export const HomeDinamicaScreen: React.FC<HomeDinamicaScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()
  const [hasPermission, setHasPermission] = useState(false)
  const [screenTimeToday, setScreenTimeToday] = useState(0)
  const [topApps, setTopApps] = useState<(AppUsage & { category: AppCategory })[]>([])
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const { logout, userData } = useAuth()

  useEffect(() => {
    checkPermissionAndLoadData()
    loadUserGroups()
  }, [])

  const loadUserGroups = async () => {
    try {
      if (!userData?.uid) {
        console.log("Usuário não autenticado, não é possível carregar grupos")
        return
      }

      setLoadingGroups(true)
      const userGroups = await getUserGroups(userData.uid)
      setGroups(userGroups)
      console.log(`Carregados ${userGroups.length} grupos do usuário`)
    } catch (error) {
      console.error("Erro ao carregar grupos:", error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const checkPermissionAndLoadData = async () => {
    try {
      const permission = await ScreenTimeService.hasPermission()
      setHasPermission(permission)
      
      if (permission) {
        await loadScreenTimeData()
      }
    } catch (error) {
      console.error('Erro ao verificar permissão:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadScreenTimeData = async () => {
    try {
      const [todayTime, apps] = await Promise.all([
        ScreenTimeService.getScreenTimeToday(),
        ScreenTimeService.getScreenTimeByApp(0), // 0 = apenas hoje
      ])
      
      // Adicionar categoria com fallback para lista manual
      const appsWithCategory = apps.map(app => ({
        ...app,
        category: getAppCategory(app.packageName, app.category),
      }))
      
      setScreenTimeToday(todayTime)
      setTopApps(appsWithCategory.slice(0, 3)) // Top 3 apps
    } catch (error) {
      console.error('Erro ao carregar dados de tempo de tela:', error)
    }
  }

  const handleRequestPermission = () => {
    Alert.alert(
      "Permissão Necessária",
      "Para exibir seu tempo de tela real, precisamos de acesso às estatísticas de uso do dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Conceder",
          onPress: () => {
            ScreenTimeService.requestPermission()
            setTimeout(() => {
              checkPermissionAndLoadData()
            }, 2000)
          },
        },
      ]
    )
  }

  const hours = Math.floor(screenTimeToday / 60)
  const minutes = screenTimeToday % 60

  const screenTimeData = {
    hours: hasPermission ? hours : 2,
    minutes: hasPermission ? minutes : 32,
    mostUsedApps: ["📱", "🎵", "⏰"],
  }

  const activeChallenges = [
    { id: 1, title: "24 horas sem redes sociais", progress: 20, imageLogo: BadgeSocialNetwork },
    { id: 2, title: "7 dias com menos de 3 horas", progress: 20, imageLogo: BadgeWeek },
    { id: 3, title: "7 dias...", progress: 20, imageLogo: BadgeSocialNetwork },
  ]

  // Imagens padrão para grupos sem foto
  const defaultGroupImages: Record<string, any> = {
    brainrot: brainrot,
    familia: familia,
    iluminados: iluminados,
  }

  const getGroupImage = (fotoUrl: string) => { // TODO - colocar essa função em um utils e usar ela também no DetalhesDoGrupoScreen
    // Se a foto for uma URL válida, retorna um objeto para Image com uri
    if (fotoUrl && (fotoUrl.startsWith("http") || fotoUrl.startsWith("data:"))) {
      return { uri: fotoUrl }
    }
    // Se for uma chave de imagem local, retorna a imagem
    if (fotoUrl && defaultGroupImages[fotoUrl]) {
      return defaultGroupImages[fotoUrl]
    }
    // Imagem padrão
    return brainrot
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={Logo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
          <Icon icon="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Time Card */}
            
        <TouchableOpacity 
          style={styles.screenTimeCard}
          onPress={!hasPermission ? handleRequestPermission : undefined}
          activeOpacity={!hasPermission ? 0.7 : 1}
        >
          <ImageBackground 
            source={BackgroundImage}
            style={{ width: '100%', height: 127, justifyContent: 'center' }}
            resizeMode="cover"
          >
            {loading ? (
              <ActivityIndicator size="large" color="#FFFFFF" style={{ marginLeft: 16 }} />
            ) : !hasPermission ? (
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.screenTimeText}>--h --m</Text>
                <Text style={styles.screenTimeLabel}>Toque para conceder permissão</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.screenTimeText}>
                  {screenTimeData.hours}h {screenTimeData.minutes}m
                </Text>
                <Text style={styles.screenTimeLabel}>de tempo de tela hoje</Text>
                <View style={styles.mostUsedApps}>
                  {topApps.length > 0 ? (
                    topApps.map((app, index) => (
                      <View key={app.packageName} style={styles.appIcon}>
                        {app.appIcon ? (
                          <Image 
                            source={{ uri: `data:image/png;base64,${app.appIcon}` }}
                            style={styles.appIconImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={styles.appEmoji}>
                            {getCategoryEmoji(app.category)}
                          </Text>
                        )}
                                                  
                      </View>
                    ))
                  ) : (
                    screenTimeData.mostUsedApps.map((app, index) => (
                      <View key={index} style={styles.appIcon}>
                        <Text style={styles.appEmoji}>{app}</Text>
                      </View>
                    ))
                  )}
                  <Text style={styles.mostUsedLabel}>Mais usados</Text>
                </View>
              </View>
            )}
          </ImageBackground>
        </TouchableOpacity>

        {/* Comparison Message */}
        <TouchableOpacity style={styles.comparisonCard} onPress={() => logout()}>
          <View >
            <Icon icon="vector" size={14} color="#72C3E0" />
          </View>
          <View style={{ width:"80%"}}>
            <Text style={styles.comparisonText} >
             <Text style={{fontWeight: "bold"}} >Você está 28%</Text> abaixo da média dos usuários
            </Text>
          </View>
          <View>
            <Icon icon="chevron" size={20} />
          </View>
        </TouchableOpacity>

        {/* Active Challenges Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Desafios ativos</Text>
            <Icon icon="chevron" size={20} />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {activeChallenges.map((challenge) => (
              <TouchableOpacity key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeIcon}>
                  <Image source={challenge.imageLogo} />
                </View>
                <ProgressBar progress={challenge.progress} />
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Groups Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => navigation.navigate("GruposDeAmigos")}
          >
            <Text style={styles.sectionTitle}>Seus grupos</Text>
            <Icon icon="chevron" size={20} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          
          {loadingGroups ? (
            <ActivityIndicator size="small" color="#322D70" style={{ marginVertical: 20 }} />
          ) : groups.length === 0 ? (
            <View style={styles.emptyGroupsContainer}>
              <Text style={styles.emptyGroupsText}>
                Você ainda não participa de nenhum grupo
              </Text>
              <TouchableOpacity 
                style={styles.createGroupButton}
                onPress={() => navigation.navigate("GruposDeAmigos")}
              >
                <Text style={styles.createGroupButtonText}>Explorar grupos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            groups.map((group) => {
              const admin = group.membros.find(m => m.cargo === "administrador")
              const adminName = admin ? admin.nome : "Admin"
              const participantCount = group.membros.length
              
              return (
                <TouchableOpacity 
                  key={group.id} 
                  style={styles.groupCard}
                  onPress={() => navigation.navigate("DetalhesDoGrupo", { grupo: group })}
                >
                  <View style={styles.groupAvatar}>
                    <Image 
                      source={getGroupImage(group.foto)} 
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.nome}</Text>
                    <Text style={styles.groupDetails}>
                      🥇 <Text style={{fontWeight: "bold", color: "#6881BA"}}>{adminName}</Text> · {participantCount} participantes
                    </Text>
                  </View>
                  <Icon icon="chevron" size={20} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )
            })
          )}
        </View>
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
  logo: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  notificationIcon: {
    fontSize: 24,
  },
  scrollContent: {
    flex: 1,
  },
  screenTimeCard: {

    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    backgroundColor: "#322D70",
  },
  screenTimeText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 16,
  },
  screenTimeLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 4,
    marginLeft: 16,
    fontWeight: "bold",
  },
  mostUsedApps: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
    marginLeft: 16,
    
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  appIconImage: {
    width: 28,
    height: 28,
  },
  appEmoji: {
    fontSize: 18,
  },
  appName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#322D70",
  },
  mostUsedLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 4,
    fontWeight: "bold",
  },
  comparisonCard: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 24,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonText: {
   
  },
  arrow: {
    fontSize: 24,
    color: "#94A3B8",
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  challengeCard: {
    backgroundColor: "#1E1B4B",
    borderRadius: 16,
    padding: 16,
    width: 140,
    marginRight: 12,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  imageLogo: {
    width: 40,
    height: 40,
    marginBottom: 12,
  },
  challengeIcon: {
    width: 60,
    height: 60,
    backgroundColor: "#312E81",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  challengeEmoji: {
    fontSize: 32,
  },
  progressBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  challengeTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 18,
    textAlign: "center",
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#312E81",
    marginBottom: 4,
  },
  groupDetails: {
    fontSize: 13,
    color: "#6881BA",
  },
  emptyGroupsContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyGroupsText: {
    fontSize: 14,
    color: "#6881BA",
    textAlign: "center",
    marginBottom: 16,
  },
  createGroupButton: {
    backgroundColor: "#322D70",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createGroupButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
})
