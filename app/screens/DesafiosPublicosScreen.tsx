import React from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground } from "react-native"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import ProgressBar from "@/components/ProgressBar"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { Icon } from "@/components/Icon"

const Logo = require("@assets/images/logo2.png")
const HeaderBackground = require("@assets/images/9ae8f9136d5d3212c5b60df64ba4f3eec8172563.png")
const BadgeSocialNetwork = require("@assets/images/badge-social-network.png")
const BadgeWeek = require("@assets/images/badge-week.png")

interface DesafiosPublicosScreenProps extends AppStackScreenProps<"DesafiosPublicos"> {}

export const DesafiosPublicosScreen: React.FC<DesafiosPublicosScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()

  const activeChallenges = [
    { id: 1, title: "24 horas sem redes sociais", progress: 20, imageLogo: BadgeSocialNetwork },
    { id: 2, title: "7 dias com menos de 3 horas", progress: 20, imageLogo: BadgeWeek },
    { id: 3, title: "7 dias com menos de 3 horas diárias", progress: 20, imageLogo: BadgeWeek },
  ]

  const availableChallenges = [
    { id: 4, title: "24 horas sem redes sociais", imageLogo: BadgeSocialNetwork },
    { id: 5, title: "7 dias com menos de 3 horas diárias", imageLogo: BadgeWeek },
  ]

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      {/* Header */}
                    {/* Header Banner */}


      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <ImageBackground 
          source={HeaderBackground}
          style={styles.headerBanner}
          resizeMode="cover"
        >
      <View style={styles.header}>
        <Image source={Logo} resizeMode="contain" />
        <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
          <Icon icon="notifications" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>


          <View style={styles.headerBannerOverlay} />
        </ImageBackground>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Card */}
          <View style={styles.titleCard}>
            <Icon icon="swords" size={24} color="#322D70" />
            <Text style={styles.pageTitle}>Desafios</Text>
          </View>

          {/* Active Challenges Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desafios ativos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {activeChallenges.map((challenge) => (
                <TouchableOpacity 
                  key={challenge.id} 
                  style={styles.activeChallengeCard}
                  onPress={() => navigation.navigate("DesafiosInscrito")}
                >
                  <View style={styles.challengeIcon}>
                    <Image source={challenge.imageLogo} style={styles.badgeImage} />
                  </View>
                  <ProgressBar progress={challenge.progress} />
                  <Text style={styles.activeChallengeTitle}>{challenge.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Available Challenges Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desafios disponíveis</Text>
            {availableChallenges.map((challenge) => (
              <View key={challenge.id} style={styles.availableChallengeCard}>
                <View style={styles.challengeIconLarge}>
                  <Image source={challenge.imageLogo} style={styles.badgeImageLarge} />
                </View>
                <Text style={styles.availableChallengeTitle}>{challenge.title}</Text>
                <TouchableOpacity 
                  style={styles.learnMoreButton}
                  onPress={() => navigation.navigate("DesafiosDisponiveis")}
                >
                  <Text style={styles.learnMoreButtonText}>saiba mais</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  },
  scrollContent: {
    flex: 1,
  },
  headerBanner: {
    width: "100%",
    height: 200,
  },
  headerBannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(50, 45, 112, 0.2)",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -14,
    paddingHorizontal: 16,
  },
  titleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
  },
  pageTitleIcon: {
    fontSize: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 16,
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  activeChallengeCard: {
    backgroundColor: "#1E1B4B",
    borderRadius: 16,
    padding: 16,
    width: 150,
    marginRight: 12,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  challengeIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#312E81",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  badgeImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  activeChallengeTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
  availableChallengeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeIconLarge: {
    width: 100,
    height: 100,
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeImageLarge: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  availableChallengeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
    textAlign: "center",
    marginBottom: 16,
  },
  learnMoreButton: {
    backgroundColor: "#72C3E0",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  learnMoreButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
})
