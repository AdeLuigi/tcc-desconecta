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
import { getInstalledApps, type InstalledApp } from "@/utils/installedApps"

const PREDEFINED_SITES = [
  "facebook.com",
  "instagram.com",
  "reddit.com",
  "snapchat.com",
  "tiktok.com",
  "x.com",
]

interface SelecionarAppsLimiteScreenProps {
  navigation: any
  route: any
}

export const SelecionarAppsLimiteScreen: React.FC<SelecionarAppsLimiteScreenProps> = ({
  navigation,
  route,
}) => {
  const initialApps: string[] = route.params?.initialApps ?? []
  const initialSites: string[] = route.params?.initialSites ?? []
  const editingConfig = route.params?.editingConfig ?? null

  const [activeTab, setActiveTab] = useState<"apps" | "sites">("apps")

  // Apps
  const [allApps, setAllApps] = useState<InstalledApp[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set(initialApps))

  // Sites
  const [sites, setSites] = useState<string[]>(() => {
    const extra = initialSites.filter((s) => !PREDEFINED_SITES.includes(s))
    return [...PREDEFINED_SITES, ...extra]
  })
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set(initialSites))
  const [newSiteUrl, setNewSiteUrl] = useState("")

  useEffect(() => {
    setLoadingApps(true)
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
      next.has(packageName) ? next.delete(packageName) : next.add(packageName)
      return next
    })
  }

  const toggleSite = (site: string) => {
    setSelectedSites((prev) => {
      const next = new Set(prev)
      next.has(site) ? next.delete(site) : next.add(site)
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

  const handleNext = () => {
    if (selectedApps.size === 0 && selectedSites.size === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um app ou site para continuar.")
      return
    }
    navigation.navigate("ConfigurarLimite", {
      selectedApps: Array.from(selectedApps),
      selectedSites: Array.from(selectedSites),
      editingConfig,
    })
  }

  const renderAppItem = ({ item }: { item: InstalledApp }) => {
    const isSelected = selectedApps.has(item.packageName)
    return (
      <TouchableOpacity
        style={s.listItem}
        onPress={() => toggleApp(item.packageName)}
        activeOpacity={0.7}
      >
        <View style={s.appIconWrapper}>
          {item.icon ? (
            <Image source={{ uri: item.icon }} style={s.appIcon} />
          ) : (
            <View style={[s.appIcon, s.appIconFallback]} />
          )}
        </View>
        <Text style={s.listItemLabel}>{item.appName}</Text>
        <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
          {isSelected && <Text style={s.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerCancel}>
          <Text style={s.headerCancelText}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Selecionar apps</Text>
        <TouchableOpacity onPress={handleNext} style={s.headerConfirm}>
          <Text style={s.headerConfirmText}>Avançar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tab, activeTab === "apps" && s.tabActive]}
          onPress={() => setActiveTab("apps")}
        >
          <Text style={[s.tabText, activeTab === "apps" && s.tabTextActive]}>
            Apps{selectedApps.size > 0 ? ` (${selectedApps.size})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === "sites" && s.tabActive]}
          onPress={() => setActiveTab("sites")}
        >
          <Text style={[s.tabText, activeTab === "sites" && s.tabTextActive]}>
            Sites{selectedSites.size > 0 ? ` (${selectedSites.size})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Apps tab */}
      {activeTab === "apps" ? (
        <View style={s.tabContent}>
          <View style={s.searchWrapper}>
            <TextInput
              style={s.searchInput}
              placeholder="Pesquisar por app"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loadingApps ? (
            <View style={s.centered}>
              <ActivityIndicator size="large" color="#7BC1DC" />
              <Text style={s.hintText}>Carregando apps...</Text>
            </View>
          ) : filteredApps.length === 0 ? (
            <View style={s.centered}>
              <Text style={s.hintText}>
                {Platform.OS !== "android"
                  ? "Listagem disponível apenas em Android."
                  : "Nenhum app encontrado."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredApps}
              keyExtractor={(item) => item.packageName}
              renderItem={renderAppItem}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.listContent}
            />
          )}
        </View>
      ) : (
        /* Sites tab */
        <View style={s.tabContent}>
          <View style={s.addSiteRow}>
            <TextInput
              style={s.addSiteInput}
              placeholder="Digite uma URL (ex: youtube.com)"
              placeholderTextColor="#94A3B8"
              value={newSiteUrl}
              onChangeText={setNewSiteUrl}
              onSubmitEditing={addSite}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity style={s.addSiteButton} onPress={addSite}>
              <Text style={s.addSiteButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.listContent}>
            {sites.map((site) => {
              const isSelected = selectedSites.has(site)
              return (
                <TouchableOpacity
                  key={site}
                  style={s.listItem}
                  onPress={() => toggleSite(site)}
                  activeOpacity={0.7}
                >
                  <View style={s.siteIcon}>
                    <Text style={s.siteIconText}>🌐</Text>
                  </View>
                  <Text style={s.listItemLabel}>{site}</Text>
                  <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                    {isSelected && <Text style={s.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      )}
    </Screen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#322D70" },
  headerCancel: { minWidth: 70 },
  headerCancelText: { fontSize: 15, color: "#64748B" },
  headerConfirm: { minWidth: 70, alignItems: "flex-end" as const },
  headerConfirmText: { fontSize: 15, color: "#5B7BF0", fontWeight: "700" },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#E8EBF0",
    borderRadius: 10,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center" as const, borderRadius: 8 },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#322D70" },
  tabContent: { flex: 1, paddingHorizontal: 16 },
  searchWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: { height: 40, fontSize: 14, color: "#1E293B" },
  listContent: { paddingBottom: 20 },
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
  appIconWrapper: { marginRight: 12 },
  appIcon: { width: 36, height: 36, borderRadius: 8 },
  appIconFallback: { backgroundColor: "#E2E8F0" },
  listItemLabel: { flex: 1, fontSize: 14, color: "#1E293B", fontWeight: "500" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: { backgroundColor: "#7BC1DC", borderColor: "#7BC1DC" },
  checkmark: { color: "#FFFFFF", fontSize: 13, fontWeight: "bold" },
  siteIcon: {
    width: 36, height: 36, alignItems: "center" as const,
    justifyContent: "center" as const, marginRight: 12,
  },
  siteIconText: { fontSize: 22 },
  addSiteRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  addSiteInput: {
    flex: 1, height: 40, backgroundColor: "#FFFFFF", borderRadius: 10,
    borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 12, fontSize: 14, color: "#1E293B",
  },
  addSiteButton: {
    width: 40, height: 40, backgroundColor: "#7BC1DC", borderRadius: 10,
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  addSiteButtonText: { color: "#FFFFFF", fontSize: 22, fontWeight: "bold", lineHeight: 28 },
  centered: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, gap: 12 },
  hintText: { color: "#64748B", fontSize: 14, textAlign: "center" as const, paddingHorizontal: 24 },
})
