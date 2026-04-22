import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import {
  grantAdminRole,
  removeMemberFromGroup,
  isUserAdmin,
  getGroupById,
} from "@/services/groupService"
import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore"

const Logo = require("@assets/images/logo2.png")

interface ParticipantesDoGrupoScreenProps extends AppStackScreenProps<"ParticipantesDoGrupo"> {}

export const ParticipantesDoGrupoScreen: React.FC<ParticipantesDoGrupoScreenProps> = ({
  navigation,
  route,
}) => {
  const { grupo: initialGrupo } = route.params
  const { userData } = useAuth()
  const [grupo, setGrupo] = useState(initialGrupo)
  const [membrosPhotoURLs, setMembrosPhotoURLs] = useState<Record<string, string>>({})
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const isAdmin = userData ? isUserAdmin(grupo, userData.uid) : false

  useEffect(() => {
    loadMembrosPhotoURLs()
  }, [grupo.membros])

  const loadMembrosPhotoURLs = async () => {
    try {
      setLoadingPhotos(true)
      const db = getFirestore()
      const photoMap: Record<string, string> = {}
      await Promise.all(
        grupo.membros.map(async (membro) => {
          const userRef = doc(db, "usuarios", membro.userId)
          const userDoc = await getDoc(userRef)
          if (userDoc.exists()) {
            const data = userDoc.data()
            if (data?.photoURL) {
              photoMap[membro.userId] = data.photoURL
            }
          }
        }),
      )
      setMembrosPhotoURLs(photoMap)
    } catch (error) {
      console.error("Erro ao carregar fotos dos membros:", error)
    } finally {
      setLoadingPhotos(false)
    }
  }

  const refreshGroup = async () => {
    const updated = await getGroupById(grupo.id)
    if (updated) setGrupo(updated)
  }

  const handleMemberOptions = (membro: (typeof grupo.membros)[0]) => {
    if (!userData || !isAdmin) return
    const isCurrentUser = membro.userId === userData.uid
    if (isCurrentUser) return

    const isAdminMember = membro.cargo === "administrador"
    const options: Array<{
      text: string
      onPress?: () => void
      style?: "cancel" | "destructive" | "default"
    }> = []

    if (!isAdminMember) {
      options.push({
        text: "👑 Promover a admin",
        onPress: async () => {
          if (!userData) return
          setIsUpdating(true)
          const result = await grantAdminRole(grupo.id, membro.userId, userData.uid)
          setIsUpdating(false)
          if (result.success) {
            Alert.alert("Sucesso", `${membro.nome} agora é administrador`)
            await refreshGroup()
          } else {
            Alert.alert("Erro", result.message || "Não foi possível promover o membro")
          }
        },
      })
    }

    options.push({
      text: "🚫 Retirar do grupo",
      style: "destructive",
      onPress: async () => {
        Alert.alert(
          "Retirar membro",
          `Tem certeza que deseja remover ${membro.nome} do grupo?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Remover",
              style: "destructive",
              onPress: async () => {
                if (!userData) return
                setIsUpdating(true)
                const success = await removeMemberFromGroup(grupo.id, membro.userId)
                setIsUpdating(false)
                if (success) {
                  Alert.alert("Sucesso", `${membro.nome} foi removido do grupo`)
                  await refreshGroup()
                } else {
                  Alert.alert("Erro", "Não foi possível remover o membro")
                }
              },
            },
          ],
        )
      },
    })

    options.push({ text: "Cancelar", style: "cancel" })
    Alert.alert(membro.nome, undefined, options)
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon icon="caretLeft" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Image source={Logo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
          <Icon icon="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Group Name */}
      <View style={styles.groupNameCard}>
        <Text style={styles.groupName}>{grupo.nome}</Text>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Participantes ({grupo.membros.length})</Text>
      </View>

      {loadingPhotos ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#322D70" />
          <Text style={styles.loadingText}>Carregando participantes...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {grupo.membros.map((membro, index) => {
            const isCurrentUser = userData?.uid === membro.userId
            const isAdminMember = membro.cargo === "administrador"

            return (
              <TouchableOpacity
                key={membro.userId}
                style={styles.memberCard}
                onPress={() => navigation.navigate("DetalhesDoUsuario", { userId: membro.userId })}
                activeOpacity={0.7}
              >
                {/* Position number */}
                <Text style={styles.positionNumber}>{index + 1}</Text>

                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatar}>
                    {membrosPhotoURLs[membro.userId] ? (
                      <Image
                        source={{ uri: membrosPhotoURLs[membro.userId] }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {membro.nome.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  {isAdminMember && <Text style={styles.adminBadgeEmoji}>👑</Text>}
                </View>

                {/* Info */}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {membro.nome}
                    {isCurrentUser ? " (você)" : ""}
                  </Text>
                  {isAdminMember && (
                    <Text style={styles.adminLabel}>Administrador</Text>
                  )}
                </View>

                {/* Admin action button */}
                {isAdmin && !isCurrentUser && (
                  <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={() => handleMemberOptions(membro)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.optionsDots}>⋯</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {isUpdating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="large" color="#322D70" />
          <Text style={styles.updatingText}>Processando...</Text>
        </View>
      )}
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
    backgroundColor: "#322D70",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  groupNameCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#322D70",
    textAlign: "center",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#322D70",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6881BA",
    marginLeft: 12,
  },
  scrollContent: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  positionNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#94A3B8",
    width: 24,
    textAlign: "center",
    marginRight: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
  },
  adminBadgeEmoji: {
    position: "absolute",
    bottom: -6,
    right: -6,
    fontSize: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
  },
  adminLabel: {
    fontSize: 12,
    color: "#6881BA",
    marginTop: 2,
  },
  optionsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  optionsDots: {
    fontSize: 22,
    color: "#94A3B8",
    fontWeight: "bold",
  },
  updatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  updatingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#322D70",
    fontWeight: "bold",
  },
})
