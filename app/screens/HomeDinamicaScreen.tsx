import React from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import ProgressBar from "@/components/ProgressBar"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { Icon } from "@/components/Icon"
const Logo = require("@assets/images/logo2.png")
const BadgeSocialNetwork = require("@assets/images/badge-social-network.png")
const BadgeWeek = require("@assets/images/badge-week.png")
const BackgroundImage = require("@assets/images/frame home 1.png")

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
    { id: 1, title: "24 horas sem redes sociais", progress: 20, imageLogo: BadgeSocialNetwork },
    { id: 2, title: "7 dias com menos de 3 horas", progress: 20, imageLogo: BadgeWeek },
    { id: 3, title: "7 dias...", progress: 20, imageLogo: BadgeSocialNetwork },
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
          <ImageBackground 
        source={BackgroundImage}
        style={{ width: '100%', height: 127, justifyContent: 'center' }}
        resizeMode="cover"
      >
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
          </ImageBackground>
        </View>

        {/* Comparison Message */}
        <TouchableOpacity style={styles.comparisonCard}>
          <View >
            <Icon icon="vector" size={16} color="#72C3E0" />
          </View>
          <View style={{ width:"80%"}}>
            <Text style={styles.comparisonText} >
             <Text style={{fontWeight: "bold"}} >Você está 28%</Text> abaixo da média dos usuários
            </Text>
          </View>
          <View>
            <Icon icon="chevron" size={16} />
          </View>
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
                  <Image source={challenge.imageLogo} style={styles.challengeImage} />
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
  },
  appEmoji: {
    fontSize: 18,
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
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 16,
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
    justifyContent: "space-between",
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
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  groupDetails: {
    fontSize: 13,
    color: "#64748B",
  },
})
