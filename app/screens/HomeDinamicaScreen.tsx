import React, { useEffect, useState } from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground, Alert, ActivityIndicator, TextInput, Modal } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import ProgressBar from "@/components/ProgressBar"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { Icon } from "@/components/Icon"
import { useFocusEffect } from "@react-navigation/native"
import ScreenTimeService, { AppUsage } from "@/services/screenTime"
import { getAppCategory, getCategoryEmoji, getCategoryLabel, type AppCategory } from "@/utils/appCategories"
import { getUserGroups, type Group, joinGroupByCode } from "@/services/groupService"
import { ActiveChallengesSection } from "@/components/ActiveChallengesSection"
const Logo = require("@assets/images/logo2.png")
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
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [groupCode, setGroupCode] = useState("")
  const [isJoiningGroup, setIsJoiningGroup] = useState(false)
  const [activeChallengesRefreshKey, setActiveChallengesRefreshKey] = useState(0)
  const [hasLoadedHistoricalData, setHasLoadedHistoricalData] = useState(false)

  // Recarregar desafios ativos quando a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      setActiveChallengesRefreshKey(prev => prev + 1)
    }, [])
  )

  useEffect(() => {
    checkPermissionAndLoadData()
    loadUserGroups()
  }, [userData])

  // Sincronizar dados dos últimos 7 dias apenas uma vez por sessão
  useEffect(() => {
    if (!hasLoadedHistoricalData && userData?.uid && hasPermission) {
      syncHistoricalData()
    }
  }, [userData?.uid, hasPermission, hasLoadedHistoricalData])

  const syncHistoricalData = async () => {
    try {
      if (!userData?.uid) return
      
      setHasLoadedHistoricalData(true)
      
      // Executar em background sem bloquear a UI
      ScreenTimeService.saveLastSevenDaysData(userData.uid)
        .then(() => {
        })
        .catch((error) => {
          console.error('❌ Erro na sincronização dos últimos 7 dias:', error)
        })
    } catch (error) {
      console.error('Erro ao iniciar sincronização:', error)
    }
  }

  const loadUserGroups = async () => {
    try {
      if (!userData?.uid) {
        return
      }

      setLoadingGroups(true)
      const userGroups = await getUserGroups(userData.uid)
      setGroups(userGroups)
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
      
      // Salvar dados no Firestore se o usuário estiver autenticado
      if (userData?.uid && todayTime > 0) {
        // Salvar apenas os dados de hoje
        // saveLastSevenDaysData foi removido daqui para evitar duplicação
        // Os dados retroativos devem ser salvos apenas uma vez, manualmente ou em outro fluxo
        await ScreenTimeService.saveScreenTimeData(
          userData.uid,
          todayTime,
          appsWithCategory
        )
      }
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

  // Cálculo de comparação com a média
  const averageScreenTime = 560 // minutos (média de referência)
  const difference = screenTimeToday - averageScreenTime
  const percentageDifference = averageScreenTime > 0 
    ? Math.abs((difference / averageScreenTime) * 100).toFixed(0) 
    : 0
  const isAboveAverage = screenTimeToday > averageScreenTime
  const comparisonColor = isAboveAverage ? "#EF4444" : "#10B981" // vermelho : verde
  const comparisonText = isAboveAverage ? "acima" : "abaixo"

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

  const handleJoinGroup = async () => {
    if (!userData?.uid) {
      Alert.alert("Erro", "Você precisa estar logado para entrar em um grupo")
      return
    }

    if (groupCode.trim().length !== 6) {
      Alert.alert("Código Inválido", "O código do grupo deve ter 6 caracteres")
      return
    }

    setIsJoiningGroup(true)
    try {
      const result = await joinGroupByCode(groupCode.trim().toUpperCase(), userData.uid)
      
      if (result.success && result.group) {
        Alert.alert(
          "Sucesso!",
          result.message,
          [
            {
              text: "Ver Grupo",
              onPress: () => {
                setJoinModalVisible(false)
                setGroupCode("")
                if (result.group) {
                  navigation.navigate("DetalhesDoGrupo", { grupo: result.group })
                }
              },
            },
            {
              text: "OK",
              onPress: () => {
                setJoinModalVisible(false)
                setGroupCode("")
                loadUserGroups() // Recarregar grupos
              },
            },
          ]
        )
      } else {
        Alert.alert("Erro", result.message)
      }
    } catch (error) {
      console.error("Erro ao entrar no grupo:", error)
      Alert.alert("Erro", "Ocorreu um erro ao tentar entrar no grupo")
    } finally {
      setIsJoiningGroup(false)
    }
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
            <Icon 
              icon="vector" 
              size={14} 
              color={isAboveAverage ? "#EF4444" : "#10B981"} 
              style={{ transform: [{ rotate: isAboveAverage ? '0deg' : '180deg' }] }}
            />
          </View>
          <View style={{ width:"80%"}}>
            <Text style={styles.comparisonText} >
             <Text style={{fontWeight: "bold", color: comparisonColor}}>Você está {percentageDifference}%</Text> {comparisonText} da média dos usuários
            </Text>
          </View>
          <View>
            <Icon icon="chevron" size={20} />
          </View>
        </TouchableOpacity>

        {/* Active Challenges Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.sectionHeader, {marginBottom:8}]}
            onPress={() => navigation.navigate("DesafiosPublicos")}
          >
            <Text style={styles.sectionTitle}>Desafios ativos</Text>
            <Icon icon="chevron" size={20} />
          </TouchableOpacity>
          <ActiveChallengesSection 
            userId={userData?.uid}
            horizontal={true}
            showTitle={false}
            refreshKey={activeChallengesRefreshKey}
          />
        </View>

        {/* Groups Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => navigation.navigate("GruposDeAmigos")}
            >
              <Text style={styles.sectionTitle}>Seus grupos</Text>
              <Icon icon="chevron" size={20} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            <View style={styles.groupActionsRow}>
              <TouchableOpacity 
                style={styles.joinGroupButton}
                onPress={() => setJoinModalVisible(true)}
              >
                <Icon icon="search" size={16} color="#322D70" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addGroupButton}
                onPress={() => navigation.navigate("CriarNovoGrupo")}
              >
                <Text style={styles.addGroupButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
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

      {/* Modal para Entrar em Grupo */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.joinModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entrar em um Grupo</Text>
              <TouchableOpacity
                onPress={() => {
                  setJoinModalVisible(false)
                  setGroupCode("")
                }}
                disabled={isJoiningGroup}
              >
                <Icon icon="x" size={24} color="#322D70" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Digite o código de 6 caracteres do grupo que você deseja participar
              </Text>

              <TextInput
                style={styles.codeInput}
                placeholder="ABC123"
                placeholderTextColor="#94A3B8"
                value={groupCode}
                onChangeText={(text) => setGroupCode(text.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isJoiningGroup}
              />

              <View style={styles.codeInputHelper}>
                <Text style={styles.codeInputHelperText}>
                  Você pode pedir o código ao administrador do grupo
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setJoinModalVisible(false)
                  setGroupCode("")
                }}
                disabled={isJoiningGroup}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.joinButton,
                  (isJoiningGroup || groupCode.length !== 6) && styles.joinButtonDisabled,
                ]}
                onPress={handleJoinGroup}
                disabled={isJoiningGroup || groupCode.length !== 6}
              >
                {isJoiningGroup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.joinButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  addGroupButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#322D70",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  groupActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  joinGroupButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  addGroupButtonText: {
    fontSize: 24,
    fontWeight: "300",
    color: "#FFFFFF",
    lineHeight: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  joinModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalDescription: {
    fontSize: 14,
    color: "#6881BA",
    marginBottom: 20,
    lineHeight: 20,
  },
  codeInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
    color: "#322D70",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    textAlign: "center",
    letterSpacing: 4,
  },
  codeInputHelper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  codeInputHelperText: {
    fontSize: 12,
    color: "#6881BA",
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  joinButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#322D70",
    alignItems: "center",
    justifyContent: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.6,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
})
