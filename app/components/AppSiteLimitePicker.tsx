import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native"
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

export interface AppSiteLimitePickerProps {
  visible: boolean
  initialApps?: string[] // package names
  initialSites?: string[]
  initialName?: string
  onConfirm: (apps: string[], sites: string[], name: string) => void
  onClose: () => void
}

export function AppSiteLimitePicker({
  visible,
  initialApps = [],
  initialSites = [],
  initialName = "",
  onConfirm,
  onClose,
}: AppSiteLimitePickerProps) {
  const [activeTab, setActiveTab] = useState<"apps" | "sites">("apps")
  const [nome, setNome] = useState(initialName)

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

  // Re-sync when modal opens with fresh initial values
  useEffect(() => {
    if (visible) {
      setNome(initialName)
      setSelectedApps(new Set(initialApps))
      const extra = initialSites.filter((s) => !PREDEFINED_SITES.includes(s))
      setSites([...PREDEFINED_SITES, ...extra])
      setSelectedSites(new Set(initialSites))
      setSearch("")
      setActiveTab("apps")
    }
  }, [visible]) // intentionally not depending on initialApps/initialSites to avoid re-runs mid-open

  useEffect(() => {
    if (!visible) return
    setLoadingApps(true)
    getInstalledApps()
      .then((apps) => setAllApps(apps))
      .finally(() => setLoadingApps(false))
  }, [visible])

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

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selectedApps), Array.from(selectedSites), nome.trim())
  }, [selectedApps, selectedSites, nome, onConfirm])

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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.container}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={onClose} style={s.headerCancel}>
              <Text style={s.headerCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Limite de apps</Text>
            <TouchableOpacity onPress={handleConfirm} style={s.headerConfirm}>
              <Text style={s.headerConfirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          {/* Nome da restrição */}
          <View style={s.nameRow}>
            <TextInput
              style={s.nameInput}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome da restrição (ex: Redes Sociais, Games...)"
              placeholderTextColor="#94A3B8"
              returnKeyType="done"
              maxLength={40}
            />
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#322D70",
  },
  headerCancel: { minWidth: 70 },
  headerCancelText: { fontSize: 15, color: "#64748B" },
  headerConfirm: { minWidth: 70, alignItems: "flex-end" },
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
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: { backgroundColor: "#7BC1DC", borderColor: "#7BC1DC" },
  checkmark: { color: "#FFFFFF", fontSize: 13, fontWeight: "bold" },
  siteIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 12 },
  siteIconText: { fontSize: 22 },
  addSiteRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
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
  addSiteButtonText: { color: "#FFFFFF", fontSize: 22, fontWeight: "bold", lineHeight: 28 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  hintText: { color: "#64748B", fontSize: 14, textAlign: "center", paddingHorizontal: 24 },
  nameRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  nameInput: {
    height: 42,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#312E81",
    backgroundColor: "#F8FAFC",
  },
})
