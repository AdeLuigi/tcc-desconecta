import React, { useEffect, useState } from "react"
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator, TextInput, Modal, Alert, ScrollView, RefreshControl } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { Icon } from "@/components/Icon"
import { getUserGroups, type Group, joinGroupByCode } from "@/services/groupService"
import { useAuth } from "@/context/AuthContext"

const Logo = require("@assets/images/logo2.png")
const brainrot = require("@assets/images/brainrot.png")
const familia = require("@assets/images/familia.png")
const iluminados = require("@assets/images/iluminados.png")

interface GruposDeAmigosScreenProps extends AppStackScreenProps<"GruposDeAmigos"> {}

export const GruposDeAmigosScreen: React.FC<GruposDeAmigosScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()
  const { userData } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [groupCode, setGroupCode] = useState("")
  const [isJoiningGroup, setIsJoiningGroup] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUserGroups()
  }, [userData])

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

  // Imagens padrão para grupos sem foto
  const defaultGroupImages: Record<string, any> = {
    brainrot: brainrot,
    familia: familia,
    iluminados: iluminados,
  }

  const getGroupImage = (fotoUrl: string) => {
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
        const group = result.group
        Alert.alert(
          "Sucesso!",
          result.message,
          [
            {
              text: "Ver Grupo",
              onPress: () => {
                setJoinModalVisible(false)
                setGroupCode("")
                navigation.navigate("DetalhesDoGrupo", { grupo: group })
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

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserGroups()
    setRefreshing(false)
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

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#322D70"]}
            tintColor="#322D70"
          />
        }
      >
        <View style={styles.content}>
          <Text preset="heading" style={styles.title}>
            Grupos de amigos
          </Text>

        {/* Groups Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Seus grupos</Text>
            </View>
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
                onPress={() => navigation.navigate("CriarNovoGrupo")}
              >
                <Text style={styles.createGroupButtonText}>Criar grupo</Text>
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
  scrollContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    marginBottom: 32,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
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
  addGroupButtonText: {
    fontSize: 24,
    fontWeight: "300",
    color: "#FFFFFF",
    lineHeight: 24,
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
