import React from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { Icon } from "@/components/Icon"
const Logo = require("@assets/images/logo2.png")

interface HomeDinamicaScreenProps extends AppStackScreenProps<"HomeDinamica"> {}

export const HomeDinamicaScreen: React.FC<HomeDinamicaScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  // Mock data - replace with real data from your API
  const screenTimeData = {
    hours: 2,
    minutes: 32,
    mostUsedApps: ["📱", "🎵", "⏰"],
  }

  const activeChallenges = [
    { id: 1, title: "24 horas sem redes sociais", progress: 20 },
    { id: 2, title: "7 dias com menos de 3 horas", progress: 20 },
    { id: 3, title: "7 dias...", progress: 20 },
  ]

  const groups = [
    { id: 1, name: "Sem Brainrot", admin: "Felipe", participants: 29, emoji: "🔥" },
    { id: 2, name: "Família Silva", admin: "Ademário", participants: 12, emoji: "👨‍👩‍👧‍👦" },
    { id: 3, name: "Iluminados", admin: "Ana", participants: 8, emoji: "🌅" },
  ]

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
        <View style={styles.screenTimeCard}>
          <Text style={styles.screenTimeText}>
            {screenTimeData.hours}h {screenTimeData.minutes}m
          </Text>
          <Text style={styles.screenTimeLabel}>de tempo de tela</Text>
          <View style={styles.mostUsedApps}>
            {screenTimeData.mostUsedApps.map((app, index) => (
              <View key={index} style={styles.appIcon}>
                <Text style={styles.appEmoji}>{app}</Text>
              </View>
            ))}
            <Text style={styles.mostUsedLabel}>Mais usados</Text>
          </View>
        </View>

        {/* Comparison Message */}
        <TouchableOpacity style={styles.comparisonCard}>
          <Text style={styles.comparisonText}>
            📉 Você está 28% abaixo da média dos usuários
          </Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Active Challenges Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Desafios ativos</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {activeChallenges.map((challenge) => (
              <TouchableOpacity key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeIcon}>
                  <Text style={styles.challengeEmoji}>🎯</Text>
                  <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>{challenge.progress}%</Text>
                  </View>
                </View>
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
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          {groups.map((group) => (
            <TouchableOpacity 
              key={group.id} 
              style={styles.groupCard}
              onPress={() => navigation.navigate("DetalhesDoGrupo")}
            >
              <View style={styles.groupAvatar}>
                <Text style={styles.groupEmoji}>{group.emoji}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupDetails}>
                  👤 {group.admin} · {group.participants} participantes
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
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
    backgroundColor: "#1E1B4B",
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
    paddingHorizontal: 20,
  },
  screenTimeCard: {
    backgroundColor: "#7DD3FC",
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  screenTimeText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1E293B",
  },
  screenTimeLabel: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
  },
  mostUsedApps: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  appEmoji: {
    fontSize: 18,
  },
  mostUsedLabel: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 4,
  },
  comparisonCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  comparisonText: {
    fontSize: 14,
    color: "#1E293B",
    flex: 1,
  },
  arrow: {
    fontSize: 24,
    color: "#94A3B8",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
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
    fontWeight: "500",
    lineHeight: 18,
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
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  groupDetails: {
    fontSize: 13,
    color: "#64748B",
  },
})
