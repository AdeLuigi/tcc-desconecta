import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Button } from "@/components/Button"
import { useAuth } from "@/context/AuthContext"
import { updateUserData, getUserData } from "@/services/userService"
import type { LimiteConfig } from "@/services/userService"
import screenTimeService from "@/services/screenTime"
import { getInstalledApps, type InstalledApp } from "@/utils/installedApps"

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"]
const ALL_DAYS = [...DAYS]

const EMOJIS = ["📱", "🎮", "📺", "🎵", "📸", "💬", "🌐", "🛒", "📰", "🎯"]

interface ConfigurarLimiteScreenProps {
  navigation: any
  route: any
}

export const ConfigurarLimiteScreen: React.FC<ConfigurarLimiteScreenProps> = ({
  navigation,
  route,
}) => {
  const { userData, setUserData } = useAuth()
  const selectedApps: string[] = route.params?.selectedApps ?? []
  const selectedSites: string[] = route.params?.selectedSites ?? []
  const editingConfig: LimiteConfig | null = route.params?.editingConfig ?? null

  const [nome, setNome] = useState(editingConfig?.nome ?? "")
  const [emoji, setEmoji] = useState(editingConfig?.emoji ?? "📱")
  const [limiteMinutos, setLimiteMinutos] = useState(editingConfig?.limiteMinutos ?? 60)
  const [diasAtivos, setDiasAtivos] = useState<Set<string>>(
    new Set(editingConfig?.diasAtivos ?? ALL_DAYS),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // App icons for display
  const [appIcons, setAppIcons] = useState<Map<string, InstalledApp>>(new Map())

  useEffect(() => {
    getInstalledApps().then((apps) => {
      const map = new Map<string, InstalledApp>()
      apps.forEach((a) => map.set(a.packageName, a))
      setAppIcons(map)
    })
  }, [])

  const toggleDay = (day: string) => {
    setDiasAtivos((prev) => {
      const next = new Set(prev)
      if (next.has(day)) {
        if (next.size <= 1) return prev // must have at least 1 day
        next.delete(day)
      } else {
        next.add(day)
      }
      return next
    })
  }

  const decreaseLimite = () =>
    setLimiteMinutos((prev) => (prev <= 30 ? Math.max(2, prev - 2) : prev - 30))
  const increaseLimite = () =>
    setLimiteMinutos((prev) => (prev < 30 ? Math.min(30, prev + 2) : Math.min(1440, prev + 30)))

  const formatMinutes = (min: number) => {
    const hours = Math.floor(min / 60)
    const mins = min % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  const handleSave = async () => {
    if (!userData) return
    if (!nome.trim()) {
      Alert.alert("Aviso", "Dê um nome para este limite.")
      return
    }

    try {
      setIsSaving(true)

      const newConfig: LimiteConfig = {
        nome: nome.trim(),
        emoji,
        appsComLimite: selectedApps,
        sitesComLimite: selectedSites,
        limiteMinutos,
        diasAtivos: Array.from(diasAtivos),
      }

      const currentLimites = userData.configuracoes?.limitesDeApps ?? []
      let updatedLimites: LimiteConfig[]

      if (editingConfig) {
        // Replace existing config by matching the old name
        updatedLimites = currentLimites.map((c) =>
          c.nome === editingConfig.nome ? newConfig : c,
        )
      } else {
        updatedLimites = [...currentLimites, newConfig]
      }

      const success = await updateUserData(userData.uid, {
        configuracoes: {
          ...userData.configuracoes,
          bloqueio_apps: true,
          limitesDeApps: updatedLimites,
          // Keep legacy fields in sync
          appsComLimite: updatedLimites.flatMap((c) => c.appsComLimite),
          sitesComLimite: updatedLimites.flatMap((c) => c.sitesComLimite),
          limiteAppsNome: updatedLimites.map((c) => c.nome).join(", "),
        },
      })

      if (success) {
        // Build per-app config map: each app gets its config's limit and active days
        const appConfigs: Record<string, { limitMinutes: number; activeDays: string[] }> = {}
        for (const config of updatedLimites) {
          for (const pkg of config.appsComLimite) {
            // If an app appears in multiple configs, use the stricter (lower) limit
            if (!appConfigs[pkg] || config.limiteMinutos < appConfigs[pkg].limitMinutes) {
              appConfigs[pkg] = {
                limitMinutes: config.limiteMinutos,
                activeDays: Array.from(config.diasAtivos),
              }
            }
          }
        }

        // Sync native blocking with per-app limits
        await screenTimeService.configureAppBlocking(appConfigs, true)

        const isAccessibilityEnabled = await screenTimeService.isAccessibilityServiceEnabled()

        const updatedUserData = await getUserData(userData.uid)
        if (updatedUserData) setUserData(updatedUserData)

        if (!isAccessibilityEnabled) {
          Alert.alert(
            "Limite salvo — ativar bloqueio",
            "Limite criado com sucesso!\n\nPara bloquear apps quando o limite for atingido, ative o serviço de acessibilidade do Desconecta.",
            [
              {
                text: "Depois",
                style: "cancel",
                onPress: () => navigation.popToTop(),
              },
              {
                text: "Ativar agora",
                onPress: () => {
                  screenTimeService.requestAccessibilityPermission()
                  navigation.popToTop()
                },
              },
            ],
          )
        } else {
          Alert.alert("Sucesso", "Limite de apps salvo com sucesso!")
          navigation.popToTop()
        }
      } else {
        Alert.alert("Erro", "Não foi possível salvar. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao salvar limite:", error)
      Alert.alert("Erro", "Ocorreu um erro ao salvar o limite.")
    } finally {
      setIsSaving(false)
    }
  }

  // Show up to 4 app icons
  const visibleApps = selectedApps.slice(0, 4)
  const extraCount = selectedApps.length - 4

  return (
    <Screen preset="auto" safeAreaEdges={["top", "bottom"]} contentContainerStyle={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBack}>
            <Text style={s.headerBackText}>{"< Voltar"}</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Novo limite diário</Text>
          <View style={s.headerBack} />
        </View>

        {/* Dados básicos */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Dados básicos</Text>
          <View style={s.nameRow}>
            <TouchableOpacity style={s.emojiButton} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Text style={s.emojiText}>{emoji}</Text>
            </TouchableOpacity>
            <View style={s.nameInputWrapper}>
              <Text style={s.nameLabel}>Nome</Text>
              <TextInput
                style={s.nameInput}
                value={nome}
                onChangeText={setNome}
                placeholder="Ex: Redes Sociais, Games..."
                placeholderTextColor="#94A3B8"
                maxLength={40}
                editable={!isSaving}
              />
            </View>
          </View>
          {showEmojiPicker && (
            <View style={s.emojiPicker}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiOption, emoji === e && s.emojiOptionSelected]}
                  onPress={() => { setEmoji(e); setShowEmojiPicker(false) }}
                >
                  <Text style={s.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Apps bloqueados */}
        <TouchableOpacity
          style={s.card}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <View style={s.appsRow}>
            <Text style={s.cardTitle}>Apps bloqueados</Text>
            <View style={s.appsIcons}>
              {visibleApps.map((pkg) => {
                const app = appIcons.get(pkg)
                return app?.icon ? (
                  <Image key={pkg} source={{ uri: app.icon }} style={s.appIconSmall} />
                ) : (
                  <View key={pkg} style={[s.appIconSmall, s.appIconFallback]} />
                )
              })}
              {extraCount > 0 && (
                <Text style={s.extraCount}>+{extraCount}</Text>
              )}
              <Text style={s.chevron}>{">"}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tempo permitido */}
        <View style={s.card}>
          <View style={s.tempoRow}>
            <Text style={s.cardTitle}>Tempo permitido</Text>
            <View style={s.stepper}>
              <TouchableOpacity onPress={decreaseLimite} style={s.stepperBtn} disabled={isSaving}>
                <Text style={s.stepperBtnText}>{"<"}</Text>
              </TouchableOpacity>
              <Text style={s.stepperValue}>{formatMinutes(limiteMinutos)}</Text>
              <TouchableOpacity onPress={increaseLimite} style={s.stepperBtn} disabled={isSaving}>
                <Text style={s.stepperBtnText}>{">"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Dias da semana */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Dias da semana</Text>
          <View style={s.daysRow}>
            {DAYS.map((day) => {
              const isActive = diasAtivos.has(day)
              return (
                <TouchableOpacity
                  key={day}
                  style={[s.dayChip, isActive && s.dayChipActive]}
                  onPress={() => toggleDay(day)}
                  disabled={isSaving}
                >
                  <Text style={[s.dayChipText, isActive && s.dayChipTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Salvar */}
        <Button
          text={isSaving ? "Salvando..." : "Salvar"}
          onPress={handleSave}
          style={s.saveButton}
          disabled={isSaving}
        />
      </ScrollView>
    </Screen>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F0F5" },
  scrollContent: { paddingBottom: 40 },
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
  headerBack: { minWidth: 70 },
  headerBackText: { fontSize: 15, color: "#64748B" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#322D70", marginBottom: 12 },
  // Name row
  nameRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  emojiButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center",
  },
  emojiText: { fontSize: 24 },
  nameInputWrapper: { flex: 1 },
  nameLabel: { fontSize: 12, color: "#6881BA", marginBottom: 2, fontWeight: "500" },
  nameInput: {
    fontSize: 15, color: "#312E81", fontWeight: "500",
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingBottom: 4, paddingTop: 0,
  },
  emojiPicker: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12,
    padding: 8, backgroundColor: "#F8FAFC", borderRadius: 12,
  },
  emojiOption: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  emojiOptionSelected: { borderColor: "#7BC1DC", backgroundColor: "#E0F2FE" },
  emojiOptionText: { fontSize: 20 },
  // Apps row
  appsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  appsIcons: { flexDirection: "row", alignItems: "center", gap: 4 },
  appIconSmall: { width: 28, height: 28, borderRadius: 6 },
  appIconFallback: { backgroundColor: "#E2E8F0" },
  extraCount: { fontSize: 13, color: "#6881BA", fontWeight: "600", marginLeft: 2 },
  chevron: { fontSize: 16, color: "#94A3B8", marginLeft: 4 },
  // Tempo
  tempoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepperBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  stepperBtnText: { fontSize: 16, color: "#322D70", fontWeight: "600" },
  stepperValue: {
    fontSize: 14, fontWeight: "700", color: "#322D70", minWidth: 60, textAlign: "center",
  },
  // Days
  daysRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#E8EBF0",
  },
  dayChipActive: { backgroundColor: "#7BC1DC" },
  dayChipText: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
  dayChipTextActive: { color: "#fff" },
  // Save
  saveButton: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 12, backgroundColor: "#5B7BF0",
  },
})
