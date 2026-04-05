import React, { useState, useEffect, useMemo } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
  Platform,
  ScrollView,
} from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAuth } from "@/context/AuthContext"
import { createGroup, type GroupType } from "@/services/groupService"
import { getInstalledApps, type InstalledApp } from "@/utils/installedApps"
import storage from "@react-native-firebase/storage"

const Logo = require("@assets/images/logo2.png")

const CRITERIO: "menorTempoAppsEspecificos" = "menorTempoAppsEspecificos"
const GROUP_TYPE: GroupType = "screenTimeForApps"

const PREDEFINED_SITES = [
  "facebook.com",
  "instagram.com",
  "reddit.com",
  "snapchat.com",
  "tiktok.com",
  "x.com",
]

interface SelecionarAppsDesafioScreenProps
  extends AppStackScreenProps<"SelecionarAppsDesafio"> {}

export const SelecionarAppsDesafioScreen: React.FC<SelecionarAppsDesafioScreenProps> = ({
  navigation,
  route,
}) => {
  const { userData } = useAuth()
  const { tipoGrupo, groupName, groupDescription, selectedImageUri, dataLimite } = route.params

  // Tabs
  const [activeTab, setActiveTab] = useState<"apps" | "sites">("apps")

  // Apps state
  const [allApps, setAllApps] = useState<InstalledApp[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set())

  // Sites state
  const [sites, setSites] = useState<string[]>(PREDEFINED_SITES)
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set())
  const [newSiteUrl, setNewSiteUrl] = useState("")

  // Creating state
  const [isCreating, setIsCreating] = useState(false)

  const isDesafio = tipoGrupo === "desafioTempo"
  const pageTitle = isDesafio ? "Criar desafio de grupo" : "Criar comunidade"

  useEffect(() => {
    getInstalledApps()
      .then((apps) => setAllApps(apps))
      .finally(() => setLoadingApps(false))
  }, [])

  const filteredApps = useMemo(() => {
    if (!search.trim()) return allApps
    const q = search.trim().toLowerCase()
    return allApps.filter(
      (a) => a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
    )
  }, [allApps, search])

  const toggleApp = (packageName: string) => {
    setSelectedApps((prev) => {
      const next = new Set(prev)
      if (next.has(packageName)) {
        next.delete(packageName)
      } else {
        next.add(packageName)
      }
      return next
    })
  }

  const toggleSite = (site: string) => {
    setSelectedSites((prev) => {
      const next = new Set(prev)
      if (next.has(site)) {
        next.delete(site)
      } else {
        next.add(site)
      }
      return next
    })
  }

  const addSite = () => {
    const url = newSiteUrl.trim().toLowerCase().replace(/^https?:\/\//, "")
    if (!url) return
    if (sites.includes(url)) {
      Alert.alert("Aviso", "Este site já está na lista.")
      return
    }
    setSites((prev) => [...prev, url])
    setSelectedSites((prev) => new Set([...prev, url]))
    setNewSiteUrl("")
  }

  const uploadGroupImage = async (uri: string): Promise<string | null> => {
    try {
      const filename = `groups/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const reference = storage().ref(filename)
      await reference.putFile(uri)
      return await reference.getDownloadURL()
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      return null
    }
  }

  const handleConfirm = async () => {
    if (!userData) {
      Alert.alert("Erro", "Você precisa estar logado para criar um grupo")
      return
    }

    setIsCreating(true)
    try {
      let photoURL = ""
      if (selectedImageUri) {
        const uploaded = await uploadGroupImage(selectedImageUri)
        if (uploaded) {
          photoURL = uploaded
        } else {
          Alert.alert(
            "Aviso",
            "Não foi possível fazer upload da imagem. O grupo será criado sem foto.",
          )
        }
      }

      const groupId = await createGroup(
        groupName,
        groupDescription,
        photoURL,
        userData.uid,
        dataLimite,
        CRITERIO,
        GROUP_TYPE,
        Array.from(selectedApps),
        Array.from(selectedSites),
      )

      if (groupId) {
        Alert.alert("Sucesso!", "Grupo criado com sucesso!", [
          { text: "OK", onPress: () => navigation.navigate("HomeDinamica") },
        ])
      } else {
        Alert.alert("Erro", "Não foi possível criar o grupo")
      }
    } catch (error) {
      console.error("Erro ao criar grupo:", error)
      Alert.alert("Erro", "Ocorreu um erro ao criar o grupo")
    } finally {
      setIsCreating(false)
    }
  }

  const renderAppItem = ({ item }: { item: InstalledApp }) => {
    const isSelected = selectedApps.has(item.packageName)
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => toggleApp(item.packageName)}
        activeOpacity={0.7}
      >
        <View style={styles.appIconWrapper}>
          {item.icon ? (
            <Image source={{ uri: item.icon }} style={styles.appIcon} />
          ) : (
            <View style={[styles.appIcon, styles.appIconFallback]} />
          )}
        </View>
        <Text style={styles.listItemLabel}>{item.appName}</Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    )
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

      {/* Title card */}
      <View style={styles.titleCard}>
        <Icon icon="poepleGroupIcon" size={24} color="#322D70" />
        <Text style={styles.pageTitle}>{pageTitle}</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Selecione os apps do desafio</Text>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "apps" && styles.tabActive]}
          onPress={() => setActiveTab("apps")}
        >
          <Text style={[styles.tabText, activeTab === "apps" && styles.tabTextActive]}>
            Apps {selectedApps.size > 0 ? `${selectedApps.size}` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "sites" && styles.tabActive]}
          onPress={() => setActiveTab("sites")}
        >
          <Text style={[styles.tabText, activeTab === "sites" && styles.tabTextActive]}>
            Sites {selectedSites.size > 0 ? `${selectedSites.size}` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "apps" ? (
        <View style={styles.tabContent}>
          {/* Search */}
          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por app"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loadingApps ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#7BC1DC" />
              <Text style={styles.loadingText}>Carregando apps...</Text>
            </View>
          ) : filteredApps.length === 0 ? (
            <View style={styles.loadingWrapper}>
              <Text style={styles.emptyText}>
                {Platform.OS !== "android"
                  ? "Listagem de apps disponível apenas em Android."
                  : "Nenhum app encontrado."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredApps}
              keyExtractor={(item) => item.packageName}
              renderItem={renderAppItem}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      ) : (
        <View style={styles.tabContent}>
          {/* Add site input */}
          <View style={styles.addSiteRow}>
            <TextInput
              style={styles.addSiteInput}
              placeholder="Digite uma URL"
              placeholderTextColor="#94A3B8"
              value={newSiteUrl}
              onChangeText={setNewSiteUrl}
              onSubmitEditing={addSite}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity style={styles.addSiteButton} onPress={addSite}>
              <Text style={styles.addSiteButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {sites.map((site) => {
              const isSelected = selectedSites.has(site)
              return (
                <TouchableOpacity
                  key={site}
                  style={styles.listItem}
                  onPress={() => toggleSite(site)}
                  activeOpacity={0.7}
                >
                  <View style={styles.siteIcon}>
                    <Text style={styles.siteIconText}>🌐</Text>
                  </View>
                  <Text style={styles.listItemLabel}>{site}</Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      )}

      {/* Bottom button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isCreating}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, isCreating && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          )}
        </TouchableOpacity>
      </View>
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
  titleCard: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
    marginLeft: 8,
  },
  subtitle: {
    textAlign: "center",
    color: "#322D70",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#E8EBF0",
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#322D70",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    height: 40,
    fontSize: 14,
    color: "#1E293B",
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  appIconWrapper: {
    marginRight: 12,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  appIconFallback: {
    backgroundColor: "#E2E8F0",
  },
  listItemLabel: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    backgroundColor: "#7BC1DC",
    borderColor: "#7BC1DC",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  siteIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  siteIconText: {
    fontSize: 22,
  },
  addSiteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  addSiteInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#1E293B",
  },
  addSiteButton: {
    width: 40,
    height: 40,
    backgroundColor: "#7BC1DC",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addSiteButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 28,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  backButton: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "#7BC1DC",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
})
